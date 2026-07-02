import type {
  Activity,
  ActivityType,
  Class,
  ClassStatus,
  Grade,
  Submission,
  SubmissionStatus,
  User,
} from "@prisma/client";
import type { Activity as ActivityDto, ClassInfo, Role, StatusTuple, SubmissionDto, UserDto } from "@atria/types";

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
