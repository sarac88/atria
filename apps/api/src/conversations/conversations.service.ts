import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ClassChatDto, ClassChatThreadDto, ConversationDto, MessageDto } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { formatTime, ROLE_LABEL, toConversationDto, toMessageDto } from "../common/mappers";

const PARTICIPANT_INCLUDE = {
  participants: { include: { user: { select: { id: true, name: true, role: true } } } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<ConversationDto[]> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: { conversation: { include: PARTICIPANT_INCLUDE } },
    });

    const withMeta = await Promise.all(
      parts.map(async (p) => {
        const unread = await this.prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });
        const lastAt = p.conversation.messages[0]?.createdAt ?? p.conversation.createdAt;
        return { conversation: p.conversation, unread, lastAt };
      }),
    );

    withMeta.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    return withMeta.map((x) => toConversationDto(x.conversation, userId, x.unread));
  }

  async getMessages(userId: string, conversationId: string): Promise<MessageDto[]> {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) throw new ForbiddenException();

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    // Marcar como leída al abrir.
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return messages.map((m) => toMessageDto(m, userId));
  }

  // ---- Chat de la clase ----------------------------------------------------
  //
  // El chat del panel de módulos es una rejilla de hilos 1:1 entre el docente
  // dueño y cada alumno matriculado: el docente los ve todos y el alumno solo
  // el suyo, de modo que un alumno nunca puede escribir a otro. Las
  // conversaciones se etiquetan con classId y nacen con el primer mensaje.

  /** Resuelve con quién puede hablar `user` dentro de la clase. */
  private async peersInClass(user: AuthUser, classId: string) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { ownerId: true } });
    if (!cls) throw new NotFoundException();
    const isTeacher = user.role === "admin" || cls.ownerId === user.userId;

    if (isTeacher) {
      const enrolled = await this.prisma.enrollment.findMany({
        where: { classId, roleInClass: "student" },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });
      return { isTeacher, peers: enrolled.map((e) => e.user) };
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_classId: { userId: user.userId, classId } },
    });
    if (!enrollment) throw new ForbiddenException();
    const owner = await this.prisma.user.findUnique({
      where: { id: cls.ownerId },
      select: { id: true, name: true, role: true },
    });
    return { isTeacher, peers: owner ? [owner] : [] };
  }

  /** GET /conversations/class/:classId — un hilo por interlocutor, con no leídos. */
  async classChat(user: AuthUser, classId: string): Promise<ClassChatDto> {
    const { peers } = await this.peersInClass(user, classId);
    if (peers.length === 0) return { threads: [], unread: 0 };

    const existing = await this.prisma.conversation.findMany({
      where: { classId, type: "direct", participants: { some: { userId: user.userId } } },
      include: {
        participants: { select: { userId: true, lastReadAt: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    // Indexado por el otro participante para casarlo con la lista de peers.
    const byPeer = new Map(
      existing
        .map((c) => [c.participants.find((p) => p.userId !== user.userId)?.userId, c] as const)
        .filter((e): e is [string, (typeof existing)[number]] => !!e[0]),
    );

    const threads: ClassChatThreadDto[] = await Promise.all(
      peers.map(async (peer) => {
        const conv = byPeer.get(peer.id);
        const base = { userId: peer.id, name: peer.name, role: ROLE_LABEL[peer.role] ?? "" };
        if (!conv) return { ...base, conversationId: null, last: "", time: "", unread: 0 };
        const mine = conv.participants.find((p) => p.userId === user.userId);
        const unread = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.userId },
            ...(mine?.lastReadAt ? { createdAt: { gt: mine.lastReadAt } } : {}),
          },
        });
        const last = conv.messages[0];
        return {
          ...base,
          conversationId: conv.id,
          last: last?.body ?? "",
          time: last ? formatTime(last.createdAt) : "",
          unread,
        };
      }),
    );

    // Primero quien espera respuesta, luego la conversación más reciente.
    threads.sort((a, b) => b.unread - a.unread || Number(!!b.conversationId) - Number(!!a.conversationId));
    return { threads, unread: threads.reduce((sum, t) => sum + t.unread, 0) };
  }

  /**
   * POST /conversations/class/:classId/open — devuelve el hilo con `withUserId`
   * (o con el docente, si lo pide un alumno) creándolo la primera vez.
   */
  async openClassThread(user: AuthUser, classId: string, withUserId?: string): Promise<{ conversationId: string }> {
    const { isTeacher, peers } = await this.peersInClass(user, classId);
    // El docente debe decir con qué alumno habla; al alumno le sobra: solo tiene uno.
    const peer = isTeacher ? peers.find((p) => p.id === withUserId) : peers[0];
    if (!peer) throw new ForbiddenException();

    const existing = await this.prisma.conversation.findFirst({
      where: {
        classId,
        type: "direct",
        AND: [{ participants: { some: { userId: user.userId } } }, { participants: { some: { userId: peer.id } } }],
      },
      select: { id: true },
    });
    if (existing) return { conversationId: existing.id };

    const created = await this.prisma.conversation.create({
      data: {
        type: "direct",
        classId,
        participants: { create: [{ userId: user.userId }, { userId: peer.id }] },
      },
      select: { id: true },
    });
    return { conversationId: created.id };
  }
}
