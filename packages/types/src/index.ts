// @atria/types — domain types and shared contracts (the doc's @atria/types).
// Consumed by both the Next.js frontend and the NestJS API.

import { z } from "zod";

// ---- Domain ----------------------------------------------------------------

export type Role = "docente" | "alumno" | "admin";

export type BadgeColor =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "new"
  | "draft";

/** [label, colourKey] pair used across cards and tables. */
export type StatusTuple = [string, BadgeColor];

export interface ClassInfo {
  id: string;
  name: string;
  code: string;
  room: string;
  students: number;
  color: string;
  icon: string;
  status: StatusTuple;
  progress: number;
  openActivities: number;
  pending: number;
  nextSession: string;
  desc: string;
  /** Portada del curso: ruta servida por la API, o "" si no tiene. */
  coverUrl: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avg: number;
  progress: number;
  submitted: number;
  attendance: number;
}

export interface Activity {
  id: string;
  classId: string;
  title: string;
  type: string;
  due: string;
  points: number;
  submitted: number;
  total: number;
  /** Entregas realizadas que aún no tienen nota (docente). */
  ungraded: number;
  status: StatusTuple;
  desc: string;
  moduleId?: string;
  allowLate?: boolean;
  config?: ActivityConfig;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  kind: "multiple" | "truefalse" | "short";
  text: string;
  points: number;
  options?: QuizQuestionOption[];
  correct?: number;
  answer?: string;
}

export interface QuizConfig {
  timeLimitMin?: number;
  attempts?: string;
  shuffle?: boolean;
}

export interface DebateConfig {
  openingQuestion?: string;
  minReplies?: number;
  minWords?: number;
  postBeforeSeeing?: boolean;
}

export interface ActivityConfig {
  questions?: QuizQuestion[];
  quiz?: QuizConfig;
  debate?: DebateConfig;
}

export interface Submission {
  id: number;
  student: string;
  activity: string;
  date: string;
  status: "Entregado" | "Pendiente" | "Atrasado";
  grade: string;
  late: boolean;
}

export interface ModuleItem {
  id: string;
  type: string;
  label: string;
  meta: string;
  state: string;
  url: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  done: boolean;
  items: ModuleItem[];
}

export interface Thread {
  id: string;
  name: string;
  role: string;
  last: string;
  time: string;
  unread: number;
  channel: boolean;
}

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  time: string;
}

export interface CalendarEvent {
  day: number;
  title: string;
  color: string;
}

export interface FeedItem {
  icon: string;
  who: string;
  what: string;
  when: string;
  tint: string;
  fg: string;
}

// ---- API DTOs --------------------------------------------------------------

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

/** Detailed class payload for GET /classes/:id. */
export interface ClassDetailDto extends ClassInfo {
  modules: Module[];
  activities: Activity[];
  roster: Student[];
}

/** Estado de una invitación tal como lo ve el docente. `expired` se deriva de expiresAt. */
export type InvitationStatus = "pending" | "accepted" | "expired";

/** Una invitación a la clase, con el enlace listo para compartir. */
export interface ClassInvitationDto {
  id: string;
  email: string;
  status: InvitationStatus;
  /** Enlace de aceptación absoluto, para copiar y enviar al alumno. */
  url: string;
  /** true si ya existe una cuenta con ese correo (recibe además aviso en la app). */
  hasAccount: boolean;
  /** Cuándo salió el correo con el enlace, o null si hay que compartirlo a mano. */
  emailSentAt: string | null;
  expiresAt: string;
  createdAt: string;
}

/** Respuesta de POST /classes/:id/invitations. */
export interface InviteStudentsResultDto {
  invitations: ClassInvitationDto[];
  /** Correos que no se han invitado, con el motivo para mostrarlo en la UI. */
  skipped: { email: string; reason: string }[];
}

/** Datos públicos de GET /invitations/:token, para la pantalla de aceptación. */
export interface InvitationPreviewDto {
  status: InvitationStatus;
  email: string;
  className: string;
  classSubject: string;
  teacherName: string;
  /** true si el invitado todavía no tiene cuenta y debe crearla al aceptar. */
  needsAccount: boolean;
  expiresAt: string;
}

/** Respuesta de POST /invitations/:token/accept. */
export interface AcceptInvitationResultDto {
  classId: string;
  className: string;
  user: UserDto;
}

/** A submission row for the teacher's Entregas table and the student's own view. */
export interface SubmissionDto {
  id: string;
  studentId: string;
  student: string;
  activityId: string;
  activity: string;
  status: "Entregado" | "Pendiente" | "Atrasado";
  date: string;
  grade: string;
  feedback: string;
  late: boolean;
  fileName?: string;
  fileUrl?: string;
  comment?: string;
  /** Quiz answers keyed by question id (see submitSchema). */
  answers?: Record<string, string>;
}

/** A message in a debate activity's thread. Replies hang one level below a root post. */
export interface DebatePostDto {
  id: string;
  activityId: string;
  authorId: string;
  author: string;
  authorRole: Role;
  body: string;
  date: string;
  parentId?: string;
  replies: DebatePostDto[];
  mine: boolean;
}

/** GET /activities/:id/debate — the thread plus the viewer's own participation state. */
export interface DebateThreadDto {
  openingQuestion: string;
  minReplies: number;
  minWords: number;
  /** False when the student must post before seeing their classmates' contributions. */
  canSeeOthers: boolean;
  /** Root posts written by the viewer. */
  myPosts: number;
  /** Replies to other people's posts written by the viewer. */
  myReplies: number;
  posts: DebatePostDto[];
}

/** An activity as seen by a student in their task lists, with the class name and their own submission (if any). */
export interface StudentTaskDto extends Activity {
  className: string;
  mySubmission: SubmissionDto | null;
}

export interface GradebookColumn {
  id: string;
  title: string;
}

export interface GradebookRow {
  studentId: string;
  student: string;
  cells: (number | null)[];
  avg: number | null;
}

/** Grade matrix for GET /classes/:id/gradebook. */
export interface GradebookDto {
  columns: GradebookColumn[];
  rows: GradebookRow[];
}

/** A conversation row for the Messages list (mirrors the Thread shape). */
export interface ConversationDto {
  id: string;
  name: string;
  role: string;
  last: string;
  time: string;
  unread: number;
  channel: boolean;
}

export type NotificationType = "submission" | "grade" | "deadline" | "invite" | "system";

/** An event notification for the bell feed. */
export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  time: string;
  createdAt: string;
}

export interface NotificationFeed {
  items: NotificationDto[];
  unread: number;
}

/** A single chat message. */
export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  from: "me" | "them";
  text: string;
  time: string;
  createdAt: string;
}

// ---- Zod contracts (shared validation, doc §3–§4) --------------------------

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createClassSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  room: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  color: z.string().min(1),
  icon: z.string().min(1),
  desc: z.string().optional().default(""),
  publish: z.boolean().optional().default(true),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = createClassSchema.partial();
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const quizQuestionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const quizQuestionSchema = z.object({
  id: z.string(),
  kind: z.enum(["multiple", "truefalse", "short"]),
  text: z.string(),
  points: z.number().min(0),
  options: z.array(quizQuestionOptionSchema).optional(),
  correct: z.number().int().min(0).optional(),
  answer: z.string().optional(),
});

export const quizConfigSchema = z.object({
  timeLimitMin: z.number().int().min(0).optional(),
  attempts: z.string().optional(),
  shuffle: z.boolean().optional(),
});

export const debateConfigSchema = z.object({
  openingQuestion: z.string().optional(),
  minReplies: z.number().int().min(0).optional(),
  minWords: z.number().int().min(0).optional(),
  postBeforeSeeing: z.boolean().optional(),
});

export const createActivitySchema = z.object({
  type: z.enum(["tarea", "cuestionario", "proyecto", "ensayo", "debate"]),
  title: z.string().min(1),
  instructions: z.string().optional().default(""),
  dueAt: z.string().optional().default(""),
  points: z.number().min(0).optional().default(0),
  format: z.string().optional().default("Archivo"),
  status: z.enum(["live", "draft"]).optional().default("live"),
  moduleId: z.string().optional(),
  allowLate: z.boolean().optional().default(true),
  questions: z.array(quizQuestionSchema).optional(),
  quiz: quizConfigSchema.optional(),
  debate: debateConfigSchema.optional(),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = createActivitySchema.partial();
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const createModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;

export const addResourceSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  meta: z.string().optional().default(""),
  url: z.string().optional().default(""),
});
export type AddResourceInput = z.infer<typeof addResourceSchema>;

export const updateResourceSchema = z.object({
  label: z.string().min(1).optional(),
  url: z.string().optional(),
});
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const gradeSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().optional().default(""),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export const submitSchema = z.object({
  fileName: z.string().optional(),
  comment: z.string().optional(),
  /** Quiz answers, keyed by question id: option index for choice questions, free text for short ones. */
  answers: z.record(z.string(), z.string()).optional(),
});
export type SubmitInput = z.infer<typeof submitSchema>;

export const createDebatePostSchema = z.object({
  body: z.string().min(1),
  /** Set to reply to an existing post; omit for a root contribution. */
  parentId: z.string().optional(),
});
export type CreateDebatePostInput = z.infer<typeof createDebatePostSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** Mínimo de caracteres para la contraseña que crea un alumno al aceptar la invitación. */
export const PASSWORD_MIN_LENGTH = 8;

export const inviteStudentsSchema = z.object({
  emails: z
    .array(z.string().email("Alguno de los correos no es válido."))
    .min(1, "Añade al menos un correo.")
    .max(50, "Puedes invitar a 50 alumnos como máximo de una vez."),
});
export type InviteStudentsInput = z.infer<typeof inviteStudentsSchema>;

/** Nombre y contraseña sólo son necesarios cuando el invitado aún no tiene cuenta. */
export const acceptInvitationSchema = z.object({
  name: z.string().min(1, "Escribe tu nombre.").optional(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
    .optional(),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
