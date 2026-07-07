import type {
  Activity,
  ActivityType,
  Class,
  ClassStatus,
  Conversation,
  ConversationParticipant,
  Grade,
  Message,
  Module,
  Notification,
  Resource,
  Submission,
  SubmissionStatus,
  User,
} from "@prisma/client";
import type {
  Activity as ActivityDto,
  ClassInfo,
  ConversationDto,
  MessageDto,
  Module as ModuleDto,
  NotificationDto,
  NotificationType,
  Role,
  StatusTuple,
  SubmissionDto,
  UserDto,
} from "@atria/types";

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

export function toClassInfo(c: Class): ClassInfo {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    room: c.room,
    students: c.studentsCount,
    color: c.color,
    icon: c.icon,
    status: STATUS[c.status],
    progress: c.progress,
    openActivities: c.openActivities,
    pending: c.pending,
    nextSession: c.nextSession,
    desc: c.desc,
  };
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  tarea: "Tarea",
  cuestionario: "Cuestionario",
  proyecto: "Proyecto",
  ensayo: "Ensayo",
  debate: "Debate",
};

export function toActivityDto(a: Activity, submitted: number, total: number): ActivityDto {
  return {
    id: a.id,
    classId: a.classId,
    title: a.title,
    type: ACTIVITY_LABEL[a.type],
    due: a.dueAt,
    points: a.points,
    submitted,
    total,
    status: STATUS[a.status],
    desc: a.instructions,
  };
}

const SUBMISSION_STATUS: Record<SubmissionStatus, SubmissionDto["status"]> = {
  entregado: "Entregado",
  pendiente: "Pendiente",
  atrasado: "Atrasado",
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())} / ${p(d.getMonth() + 1)} / ${d.getFullYear()}`;
}

type SubmissionWithRelations = Submission & {
  student: Pick<User, "id" | "name">;
  activity: Pick<Activity, "id" | "title">;
  grade: Grade | null;
};

export function toSubmissionDto(s: SubmissionWithRelations): SubmissionDto {
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
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Relative time label used in the messages list and bubbles. */
function formatTime(d: Date): string {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 7) return DAY_NAMES[d.getDay()];
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

const ROLE_LABEL: Record<string, string> = { docente: "Docente", alumno: "Alumno", admin: "Administración" };

type ConversationWithRelations = Conversation & {
  participants: (ConversationParticipant & { user: Pick<User, "id" | "name" | "role"> })[];
  messages: Message[];
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
  };
}

export function toMessageDto(m: Message, meId: string): MessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    from: m.senderId === meId ? "me" : "them",
    text: m.body,
    time: formatTime(m.createdAt),
    createdAt: m.createdAt.toISOString(),
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

type ModuleWithResources = Module & { resources: Resource[] };

export function toModuleDto(m: ModuleWithResources): ModuleDto {
  return {
    id: m.id,
    title: m.title,
    done: m.done,
    items: m.resources.map((r) => ({ type: r.type, label: r.label, meta: r.meta, state: r.state, url: r.url })),
  };
}
