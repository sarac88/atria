import type {
  Activity,
  ActivityType,
  Class,
  DebatePost,
  ClassStatus,
  Conversation,
  ConversationParticipant,
  File,
  Grade,
  Message,
  MessageReaction,
  Module,
  Notification,
  OnlineSession,
  Resource,
  Submission,
  SubmissionStatus,
  User,
} from "@prisma/client";
import { groupReactions } from "@atria/types";
import type {
  Activity as ActivityDto,
  ClassInfo,
  DebatePostDto,
  ConversationDto,
  MeetingProvider,
  MessageDto,
  MessageReactionEntry,
  Module as ModuleDto,
  NotificationDto,
  NotificationType,
  OnlineSessionDto,
  Role,
  StatusTuple,
  SubmissionDto,
  UserDto,
} from "@atria/types";
import { uploadUrl } from "./uploads";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    avatarUrl: user.avatarUrl ?? null,
  };
}

const STATUS: Record<ClassStatus, StatusTuple> = {
  live: ["En vivo", "info"],
  scheduled: ["Programado", "draft"],
  draft: ["Borrador", "default"],
};

/** Clase con el docente dueño cargado (ver CLASS_OWNER_INCLUDE en ClassesService). */
export type ClassWithOwner = Class & { owner?: { name: string } | null };

/** Contadores que se calculan por consulta en vez de leerse de columnas obsoletas. */
export interface ClassCounters {
  openActivities: number;
  pending: number;
}

export function toClassInfo(c: ClassWithOwner, studentsCount?: number, counters?: ClassCounters): ClassInfo {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    room: c.room,
    students: studentsCount ?? c.studentsCount,
    color: c.color,
    icon: c.icon,
    thumb: c.thumb,
    status: STATUS[c.status],
    state: c.status,
    progress: c.progress,
    openActivities: counters?.openActivities ?? 0,
    pending: counters?.pending ?? 0,
    nextSession: c.nextSession,
    desc: c.desc,
    coverUrl: c.coverUrl,
    teacher: c.owner?.name ?? "",
  };
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  tarea: "Tarea",
  cuestionario: "Cuestionario",
  proyecto: "Proyecto",
  ensayo: "Ensayo",
  debate: "Debate",
};

export function toActivityDto(a: Activity, submitted: number, total: number, ungraded = 0): ActivityDto {
  const rawConfig = a.config && typeof a.config === "object" && !Array.isArray(a.config) ? (a.config as ActivityDto["config"]) : undefined;
  return {
    id: a.id,
    classId: a.classId,
    title: a.title,
    type: ACTIVITY_LABEL[a.type],
    due: a.dueAt,
    points: a.points,
    submitted,
    total,
    ungraded,
    status: STATUS[a.status],
    desc: a.instructions,
    moduleId: a.moduleId ?? undefined,
    allowLate: a.allowLate,
    config: rawConfig && Object.keys(rawConfig).length ? rawConfig : undefined,
  };
}

const SUBMISSION_STATUS: Record<SubmissionStatus, SubmissionDto["status"]> = {
  entregado: "Entregado",
  pendiente: "Pendiente",
  atrasado: "Atrasado",
};

export function formatDate(d: Date | null): string {
  if (!d) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())} / ${p(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

type SubmissionWithRelations = Submission & {
  student: Pick<User, "id" | "name">;
  activity: Pick<Activity, "id" | "title">;
  grade: Grade | null;
  file?: File | null;
};

export function toSubmissionDto(s: SubmissionWithRelations): SubmissionDto {
  const answers =
    s.answers && typeof s.answers === "object" && !Array.isArray(s.answers)
      ? (s.answers as Record<string, string>)
      : undefined;
  return {
    id: s.id,
    studentId: s.studentId,
    student: s.student.name,
    activityId: s.activityId,
    activity: s.activity.title,
    status: SUBMISSION_STATUS[s.status],
    date: formatDate(s.submittedAt),
    grade: s.grade ? s.grade.score.toFixed(1) : "—",
    feedback: s.grade?.feedback ?? "",
    late: s.status === "atrasado",
    fileName: s.file?.name ?? s.fileName ?? undefined,
    fileUrl: s.file ? uploadUrl(s.file.key) : undefined,
    comment: s.comment ?? undefined,
    answers: answers && Object.keys(answers).length ? answers : undefined,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Relative time label used in the messages list and bubbles. */
export function formatTime(d: Date): string {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 7) return DAY_NAMES[d.getDay()];
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

type DebatePostWithAuthor = DebatePost & { author: Pick<User, "id" | "name" | "role"> };

/** Un post del foro de debate. Las respuestas se anidan aparte, en el servicio. */
export function toDebatePostDto(p: DebatePostWithAuthor, viewerId: string, replies: DebatePostDto[] = []): DebatePostDto {
  return {
    id: p.id,
    activityId: p.activityId,
    authorId: p.authorId,
    author: p.author.name,
    authorRole: p.author.role as Role,
    body: p.body,
    date: formatTime(p.createdAt),
    parentId: p.parentId ?? undefined,
    replies,
    mine: p.authorId === viewerId,
  };
}

export const ROLE_LABEL: Record<string, string> = { docente: "Docente", alumno: "Alumno", admin: "Administración" };

type ConversationWithRelations = Conversation & {
  participants: (ConversationParticipant & { user: Pick<User, "id" | "name" | "role"> })[];
  messages: Message[];
  /** Cargada sólo donde interesa etiquetar el hilo con su clase de origen. */
  class?: Pick<Class, "id" | "name" | "color"> | null;
};

export function toConversationDto(c: ConversationWithRelations, meId: string, unread: number): ConversationDto {
  const isChannel = c.type !== "direct";
  const other = c.participants.find((p) => p.userId !== meId)?.user;
  const last = c.messages[0];
  return {
    id: c.id,
    name: isChannel ? c.title : other?.name ?? "Conversación",
    role: isChannel ? (c.type === "group" ? "Grupo" : "Clase") : ROLE_LABEL[other?.role ?? "alumno"] ?? "",
    last: last?.body ?? "",
    time: last ? formatTime(last.createdAt) : "",
    unread,
    channel: isChannel,
    origin: c.class ? { classId: c.class.id, className: c.class.name, color: c.class.color } : null,
  };
}

/** Un mensaje con sus reacciones y el nombre de quien las puso. */
export type MessageWithReactions = Message & {
  reactions?: (MessageReaction & { user: Pick<User, "id" | "name"> })[];
};

export function toReactionEntries(m: MessageWithReactions): MessageReactionEntry[] {
  return (m.reactions ?? []).map((r) => ({ emoji: r.emoji, userId: r.userId, name: r.user.name }));
}

export function toMessageDto(m: MessageWithReactions, meId: string): MessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    from: m.senderId === meId ? "me" : "them",
    text: m.body,
    time: formatTime(m.createdAt),
    createdAt: m.createdAt.toISOString(),
    edited: m.editedAt != null,
    reactions: groupReactions(toReactionEntries(m), meId),
  };
}

export function toNotificationDto(n: Notification): NotificationDto {
  return {
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    link: n.link ?? null,
    read: n.readAt != null,
    time: formatTime(n.createdAt),
    createdAt: n.createdAt.toISOString(),
  };
}

type ModuleWithResources = Module & { resources: Resource[]; sessions: OnlineSession[] };

export function toOnlineSessionDto(s: OnlineSession): OnlineSessionDto {
  return {
    id: s.id,
    provider: s.provider as MeetingProvider,
    label: s.label,
    url: s.url,
    startsAt: s.startsAt?.toISOString() ?? null,
  };
}

export function toModuleDto(m: ModuleWithResources): ModuleDto {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    done: m.done,
    items: m.resources.map((r) => ({ id: r.id, type: r.type, label: r.label, meta: r.meta, state: r.state, url: r.url })),
    sessions: m.sessions.map(toOnlineSessionDto),
  };
}
