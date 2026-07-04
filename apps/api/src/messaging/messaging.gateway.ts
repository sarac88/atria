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
import { sendMessageSchema } from "@atria/types";
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
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    for (const p of parts) client.join(`conversation:${p.conversationId}`);
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

    // Broadcast a recipient-agnostic payload; each client derives from/me itself.
    this.server.to(`conversation:${conversationId}`).emit("message.new", {
      id: msg.id,
      conversationId,
      senderId: userId,
      body,
      createdAt: msg.createdAt.toISOString(),
    });
  }
}
