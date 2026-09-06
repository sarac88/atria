import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ClassChatDto, ClassChatThreadDto, ConversationDto, MessageDto } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { formatTime, ROLE_LABEL, toConversationDto, toMessageDto } from "../common/mappers";

// Los mensajes borrados por su autor no cuentan para nada: ni se listan, ni son
// el último del hilo, ni suman no leídos.
const VISIBLE = { deletedAt: null };

const PARTICIPANT_INCLUDE = {
  participants: { include: { user: { select: { id: true, name: true, role: true } } } },
  // Para etiquetar en Mensajes de qué clase sale cada hilo.
  class: { select: { id: true, name: true, color: true } },
};

/** Las reacciones viajan con el nombre de quien las puso, para el tooltip. */
const REACTION_INCLUDE = { user: { select: { id: true, name: true } } };

/**
 * Vaciar y eliminar son decisiones de cada uno: se guardan en su fila de
 * participante y sólo recortan lo que ve quien las tomó, nunca el hilo del
 * otro. De ahí que todas las consultas partan de este corte en vez de leer los
 * mensajes tal cual.
 */
type Cuts = { clearedAt: Date | null; hiddenAt: Date | null };

const latest = (...dates: (Date | null | undefined)[]): Date | null => {
  const real = dates.filter((d): d is Date => !!d);
  return real.length ? new Date(Math.max(...real.map((d) => d.getTime()))) : null;
};

/** Desde cuándo cuenta el hilo para este participante, o null si lo ve entero. */
const cutoffOf = (p: Cuts): Date | null => latest(p.clearedAt, p.hiddenAt);

/** Filtro de mensajes visibles para un participante concreto. */
function visibleFor(p: Cuts) {
  const cutoff = cutoffOf(p);
  return cutoff ? { ...VISIBLE, createdAt: { gt: cutoff } } : { ...VISIBLE };
}

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** El último mensaje que este participante todavía ve, o null si no le queda ninguno. */
  private lastVisible(conversationId: string, p: Cuts) {
    return this.prisma.message.findFirst({
      where: { conversationId, ...visibleFor(p) },
      orderBy: { createdAt: "desc" },
    });
  }

  /** No leídos del participante, descontando lo que él mismo vació. */
  private countUnread(conversationId: string, userId: string, p: Cuts & { lastReadAt: Date | null }) {
    // Un único `createdAt`: el corte y la última lectura se funden en el mayor.
    const since = latest(cutoffOf(p), p.lastReadAt);
    return this.prisma.message.count({
      where: {
        ...VISIBLE,
        conversationId,
        senderId: { not: userId },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    });
  }

  async findAll(userId: string): Promise<ConversationDto[]> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: { conversation: { include: PARTICIPANT_INCLUDE } },
    });

    const withMeta = await Promise.all(
      parts.map(async (p) => {
        const [last, unread] = await Promise.all([
          this.lastVisible(p.conversationId, p),
          this.countUnread(p.conversationId, userId, p),
        ]);
        // El hilo eliminado desaparece de la lista, y vuelve solo si le escriben.
        if (p.hiddenAt && !last) return null;
        const lastAt = last?.createdAt ?? p.conversation.createdAt;
        // El mapper lee el último mensaje de `messages`, ya recortado aquí.
        return { conversation: { ...p.conversation, messages: last ? [last] : [] }, unread, lastAt };
      }),
    );

    const visible = withMeta.filter((x): x is NonNullable<typeof x> => !!x);
    visible.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    return visible.map((x) => toConversationDto(x.conversation, userId, x.unread));
  }

  async getMessages(userId: string, conversationId: string): Promise<MessageDto[]> {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) throw new ForbiddenException();

    const messages = await this.prisma.message.findMany({
      where: { conversationId, ...visibleFor(part) },
      orderBy: { createdAt: "asc" },
      include: { reactions: { include: REACTION_INCLUDE, orderBy: { createdAt: "asc" } } },
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
        participants: { select: { userId: true, lastReadAt: true, clearedAt: true, hiddenAt: true } },
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
        // Sin fila propia no debería llegar aquí, pero el hilo se ve entero.
        const mine = conv.participants.find((p) => p.userId === user.userId) ?? {
          lastReadAt: null,
          clearedAt: null,
          hiddenAt: null,
        };
        // Un hilo vaciado o eliminado se queda en blanco aquí: la fila del alumno
        // no desaparece del panel, porque la lista es el alumnado de la clase.
        const [last, unread] = await Promise.all([
          this.lastVisible(conv.id, mine),
          this.countUnread(conv.id, user.userId, mine),
        ]);
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

  // ---- Vaciar y eliminar ---------------------------------------------------
  //
  // Las dos son personales: mueven el corte de quien las pide y no tocan ni un
  // mensaje, así que el otro sigue viendo la conversación entera. Nadie puede
  // borrarle a otro lo que ya leyó, que en una clase es prueba de lo hablado.

  /** Comprueba que quien pide participa en el hilo. */
  private async participantOf(userId: string, conversationId: string) {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) throw new ForbiddenException();
    return part;
  }

  /** POST /conversations/:id/clear — deja el hilo en blanco para quien lo pide. */
  async clear(userId: string, conversationId: string): Promise<{ ok: true }> {
    await this.participantOf(userId, conversationId);
    const now = new Date();
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      // Al no quedar nada por ver, tampoco quedan no leídos.
      data: { clearedAt: now, lastReadAt: now },
    });
    return { ok: true };
  }

  /**
   * DELETE /conversations/:id — saca el hilo de la lista de quien lo pide. No
   * se borra la fila: el otro sigue teniéndolo, y si vuelve a escribir la
   * conversación reaparece con los mensajes nuevos.
   */
  async remove(userId: string, conversationId: string): Promise<{ ok: true }> {
    await this.participantOf(userId, conversationId);
    const now = new Date();
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { clearedAt: now, hiddenAt: now, lastReadAt: now },
    });
    return { ok: true };
  }
}
