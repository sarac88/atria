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
  type: string;
  label: string;
  meta: string;
  state: string;
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
});
export type CreateClassInput = z.infer<typeof createClassSchema>;
