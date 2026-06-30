// Atria LMS — shared domain types.
// Mirrors the @atria/types package described in the architecture doc; for now
// it backs the static mock data in lib/data.ts.

export type Role = "docente" | "alumno" | "admin";

/** Badge / status colour keys understood by the Badge component. */
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
  color: string; // CSS colour token
  icon: string; // Icon name
  status: StatusTuple;
  progress: number; // 0..1
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
  progress: number; // 0..1
  submitted: number;
  attendance: number; // 0..1
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
  type: string; // Icon name
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
