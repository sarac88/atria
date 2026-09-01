import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import {
  deleteMessageSchema,
  editMessageSchema,
  reactToMessageSchema,
  sendMessageSchema,
  withinEditWindow,
  MESSAGE_EDIT_WINDOW_MIN,
  type MessageActionAck,
} from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => {
        const i = part.indexOf("=");
        if (i === -1) return null;
        return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
      })
      .filter((x): x is [string, string] => !!x && !!x[0]),
  );
}

@WebSocketGateway({
  path: "/ws",
  cors: {
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private userIdFrom(client: Socket): string | null {
    const token = parseCookies(client.handshake.headers.cookie)["atria_access"];
    if (!token) return null;
    try {
      const payload = this.jwt.verify<{ sub: string }>(token, { secret: process.env.JWT_ACCESS_SECRET });
      return payload.sub;
    } catch {
      return null;
    }
  }

  /** Emit an event to every socket of a given user (used by notifications). */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  async handleConnection(client: Socket): Promise<void> {
    const userId = this.userIdFrom(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    client.data.userId = userId;
    client.join(`user:${userId}`);
  }

  @SubscribeMessage("message.send")
  async onSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    const parsed = sendMessageSchema.safeParse(payload);
    if (!parsed.success) return;
    const { conversationId, body } = parsed.data;

    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) return;

    const msg = await this.prisma.message.create({ data: { conversationId, senderId: userId, body } });
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    // Payload agnóstico del destinatario; cada cliente deduce si es suyo.
    await this.broadcast(conversationId, "message.new", {
      id: msg.id,
      conversationId,
      senderId: userId,
      body,
      createdAt: msg.createdAt.toISOString(),
    });
  }

  /**
   * Un mensaje sólo lo toca su autor y sólo dentro del plazo de rectificación,
   * comprobado aquí y no sólo en la interfaz.
   */
  private async ownEditableMessage(userId: string, messageId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, senderId: true, createdAt: true, deletedAt: true },
    });
    if (!msg || msg.deletedAt) return { error: "El mensaje ya no existe." } as const;
    if (msg.senderId !== userId) return { error: "Sólo puedes tocar tus propios mensajes." } as const;
    if (!withinEditWindow(msg.createdAt)) {
      return { error: `El plazo para cambiarlo era de ${MESSAGE_EDIT_WINDOW_MIN} minutos.` } as const;
    }
    return { msg } as const;
  }

  @SubscribeMessage("message.edit")
  async onEdit(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): Promise<MessageActionAck> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { ok: false, error: "Sesión caducada." };
    const parsed = editMessageSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "El mensaje no puede quedarse vacío." };

    const found = await this.ownEditableMessage(userId, parsed.data.messageId);
    if ("error" in found) return { ok: false, error: found.error };

    const body = parsed.data.body.trim();
    if (!body) return { ok: false, error: "El mensaje no puede quedarse vacío." };

    const updated = await this.prisma.message.update({
      where: { id: found.msg.id },
      data: { body, editedAt: new Date() },
    });
    await this.broadcast(found.msg.conversationId, "message.updated", {
      id: updated.id,
      conversationId: updated.conversationId,
      senderId: updated.senderId,
      body: updated.body,
      createdAt: updated.createdAt.toISOString(),
      edited: true,
    });
    return { ok: true };
  }

  @SubscribeMessage("message.delete")
  async onDelete(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): Promise<MessageActionAck> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { ok: false, error: "Sesión caducada." };
    const parsed = deleteMessageSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "Mensaje no válido." };

    const found = await this.ownEditableMessage(userId, parsed.data.messageId);
    if ("error" in found) return { ok: false, error: found.error };

    // Borrado lógico: desaparece del hilo de todos, pero la fila se conserva.
    await this.prisma.message.update({ where: { id: found.msg.id }, data: { deletedAt: new Date() } });
    await this.broadcast(found.msg.conversationId, "message.deleted", {
      id: found.msg.id,
      conversationId: found.msg.conversationId,
    });
    return { ok: true };
  }

  /**
   * Reaccionar es alternar: si ya habías puesto ese emoji se quita. A
   * diferencia de editar, no caduca y vale para cualquier mensaje del hilo,
   * también los ajenos.
   */
  @SubscribeMessage("message.react")
  async onReact(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): Promise<MessageActionAck> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return { ok: false, error: "Sesión caducada." };
    const parsed = reactToMessageSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "Reacción no válida." };
    const { messageId, emoji } = parsed.data;

    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, conversationId: true, deletedAt: true },
    });
    if (!msg || msg.deletedAt) return { ok: false, error: "El mensaje ya no existe." };

    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: msg.conversationId, userId } },
    });
    if (!part) return { ok: false, error: "No participas en esta conversación." };

    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.messageReaction.create({ data: { messageId, userId, emoji } });
    }

    // Se envían en crudo: cada cliente decide cuáles son suyas al agruparlas.
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    await this.broadcast(msg.conversationId, "message.reactions", {
      id: messageId,
      conversationId: msg.conversationId,
      entries: reactions.map((r) => ({ emoji: r.emoji, userId: r.userId, name: r.user.name })),
    });
    return { ok: true };
  }

  /**
   * Se reparte por la sala personal de cada participante, no por una sala de
   * conversación: el chat de la clase crea el hilo con el primer mensaje y los
   * sockets ya conectados nunca habrían entrado en esa sala.
   */
  private async broadcast(conversationId: string, event: string, payload: unknown): Promise<void> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    for (const p of parts) this.server.to(`user:${p.userId}`).emit(event, payload);
  }
}
