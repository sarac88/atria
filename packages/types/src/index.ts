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

export type NotificationType = "submission" | "grade" | "deadline" | "system";

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
  points: z.number().int().min(0),
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
  points: z.number().int().min(0).optional().default(0),
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
});
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const addResourceSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  meta: z.string().optional().default(""),
  url: z.string().optional().default(""),
});
export type AddResourceInput = z.infer<typeof addResourceSchema>;

export const gradeSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().optional().default(""),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export const submitSchema = z.object({
  fileName: z.string().optional(),
});
export type SubmitInput = z.infer<typeof submitSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
