// Atria LMS — mock data shared across all screens.
// Ported from the design export (window.AtriaData). Static; interactions mutate
// local component state only.

import type {
  Activity,
  CalendarEvent,
  ChatMessage,
  ClassInfo,
  FeedItem,
  Module,
  Student,
  Submission,
  Thread,
} from "./types";

export const classes: ClassInfo[] = [
  {
    id: "calc2", name: "Cálculo II", code: "MAT-204", room: "Aula 345", students: 32,
    color: "var(--primary-500)", icon: "academic-cap", status: ["En vivo", "info"],
    progress: 0.62, openActivities: 4, pending: 8, nextSession: "Hoy · 10:30",
    desc: "Derivadas, integrales y series. Segundo cuatrimestre.",
  },
  {
    id: "arte", name: "Historia del Arte", code: "HUM-110", room: "Aula 210", students: 28,
    color: "var(--yellow-500)", icon: "book-open", status: ["En vivo", "info"],
    progress: 0.41, openActivities: 2, pending: 3, nextSession: "Mañana · 09:00",
    desc: "Del Renacimiento a las vanguardias del siglo XX.",
  },
  {
    id: "bio", name: "Biología Molecular", code: "BIO-330", room: "Aula 118", students: 24,
    color: "var(--info-500)", icon: "folder", status: ["Programado", "draft"],
    progress: 0.18, openActivities: 1, pending: 0, nextSession: "Lun · 12:00",
    desc: "ADN, ARN y síntesis de proteínas. Laboratorio incluido.",
  },
  {
    id: "lengua", name: "Lengua y Literatura", code: "LEN-101", room: "Aula 402", students: 30,
    color: "var(--success-500)", icon: "document-text", status: ["En vivo", "info"],
    progress: 0.74, openActivities: 3, pending: 5, nextSession: "Hoy · 13:00",
    desc: "Comentario de texto y narrativa contemporánea.",
  },
  {
    id: "fisica", name: "Física General", code: "FIS-205", room: "Aula 201", students: 26,
    color: "var(--primary-600)", icon: "star", status: ["En vivo", "info"],
    progress: 0.55, openActivities: 2, pending: 7, nextSession: "Mié · 11:00",
    desc: "Mecánica, termodinámica y ondas.",
  },
  {
    id: "quimica", name: "Química Orgánica", code: "QUI-212", room: "Aula 119", students: 22,
    color: "var(--warning-500)", icon: "book-open", status: ["Borrador", "default"],
    progress: 0.0, openActivities: 0, pending: 0, nextSession: "Sin programar",
    desc: "Borrador en preparación para el próximo curso.",
  },
];

const names = [
  "Alba García", "Marc Soler", "Lucía Romero", "Iker Mendoza", "Nadia Khan", "Tomás Vidal",
  "Sara Pons", "Diego Lima", "Emma Ferrer", "Hugo Casas", "Valeria Ruiz", "Nil Bosch",
  "Carla Vega", "Pol Serra", "Inés Marí", "Bruno Gil",
];

const avgs = [9.0, 6.4, 7.8, 8.2, 5.9, 7.1, 8.8, 6.0, 9.4, 7.5, 8.0, 6.8, 7.2, 8.6, 5.4, 7.9];
const progresses = [0.92, 0.61, 0.78, 0.84, 0.49, 0.7, 0.9, 0.55, 0.95, 0.74, 0.81, 0.66, 0.72, 0.88, 0.42, 0.8];
const submittedCounts = [12, 8, 10, 11, 6, 9, 12, 7, 13, 10, 11, 8, 9, 12, 5, 10];
const attendances = [0.98, 0.82, 0.9, 0.95, 0.7, 0.85, 0.97, 0.78, 0.99, 0.88, 0.92, 0.8, 0.86, 0.96, 0.65, 0.9];

export const students: Student[] = names.map((n, i) => ({
  id: "s" + i,
  name: n,
  email:
    n.toLowerCase()
      .replace(/[áàä]/g, "a").replace(/[éè]/g, "e").replace(/[íï]/g, "i")
      .replace(/[óö]/g, "o").replace(/[úü]/g, "u").replace(" ", ".") + "@atria.edu",
  avg: avgs[i],
  progress: progresses[i],
  submitted: submittedCounts[i],
  attendance: attendances[i],
}));

export const activities: Activity[] = [
  {
    id: "a1", classId: "calc2", title: "Explica tu idea: límites", type: "Ensayo", due: "12 / 10 / 2022",
    points: 10, submitted: 28, total: 32, status: ["En vivo", "info"],
    desc: "Redacta un texto de 300–500 palabras explicando el concepto de límite con tus propias palabras y un ejemplo.",
  },
  {
    id: "a2", classId: "calc2", title: "Ensayo de derivadas", type: "Tarea", due: "10 / 10 / 2022",
    points: 10, submitted: 30, total: 32, status: ["Cerrado", "default"],
    desc: "Resuelve los 8 ejercicios de derivadas del cuaderno y súbelos en PDF.",
  },
  {
    id: "a3", classId: "calc2", title: "Cuestionario 4 — Integrales", type: "Cuestionario", due: "18 / 10 / 2022",
    points: 5, submitted: 12, total: 32, status: ["En vivo", "info"],
    desc: "10 preguntas de opción múltiple. Un solo intento, 20 minutos.",
  },
  {
    id: "a4", classId: "calc2", title: "Proyecto: aplicación real", type: "Proyecto", due: "30 / 10 / 2022",
    points: 20, submitted: 4, total: 32, status: ["Programado", "draft"],
    desc: "En grupos de 3, aplicad el cálculo a un problema real y presentadlo.",
  },
];

export const submissions: Submission[] = [
  { id: 1, student: "Alba García", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "9.0", late: false },
  { id: 2, student: "Marc Soler", activity: "Explica tu idea: límites", date: "—", status: "Pendiente", grade: "—", late: false },
  { id: 3, student: "Lucía Romero", activity: "Explica tu idea: límites", date: "13 / 10 / 2022", status: "Atrasado", grade: "—", late: true },
  { id: 4, student: "Iker Mendoza", activity: "Explica tu idea: límites", date: "11 / 10 / 2022", status: "Entregado", grade: "7.5", late: false },
  { id: 5, student: "Nadia Khan", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "—", late: false },
  { id: 6, student: "Tomás Vidal", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "8.0", late: false },
  { id: 7, student: "Sara Pons", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "—", late: false },
  { id: 8, student: "Diego Lima", activity: "Explica tu idea: límites", date: "—", status: "Pendiente", grade: "—", late: false },
];

export const modules: Module[] = [
  {
    id: "m1", title: "Unidad 1 · Límites y continuidad", done: true, items: [
      { type: "document-text", label: "Apuntes: definición de límite", meta: "PDF · 12 págs", state: "Visto" },
      { type: "play", label: "Vídeo: límites laterales", meta: "Vídeo · 14 min", state: "Visto" },
      { type: "clipboard-check", label: "Cuestionario 1", meta: "5 preguntas", state: "Completado" },
    ],
  },
  {
    id: "m2", title: "Unidad 2 · Derivadas", done: false, items: [
      { type: "document-text", label: "Apuntes: reglas de derivación", meta: "PDF · 18 págs", state: "Nuevo" },
      { type: "document-add", label: "Ensayo de derivadas", meta: "Entrega · 10 pts", state: "Abierto" },
      { type: "play", label: "Vídeo: regla de la cadena", meta: "Vídeo · 11 min", state: "" },
    ],
  },
  {
    id: "m3", title: "Unidad 3 · Integrales", done: false, items: [
      { type: "document-text", label: "Apuntes: integral definida", meta: "PDF · 15 págs", state: "" },
      { type: "clipboard-check", label: "Cuestionario 4 — Integrales", meta: "10 preguntas", state: "Abierto" },
      { type: "folder", label: "Material complementario", meta: "3 archivos", state: "" },
    ],
  },
];

export const messages: Thread[] = [
  { id: "t1", name: "Cálculo II · Tablón", role: "Clase", last: "Recordad subir el ensayo antes del jueves.", time: "10:24", unread: 0, channel: true },
  { id: "t2", name: "Lucía Romero", role: "Alumna", last: "Profesora, ¿puedo entregar con un día de retraso?", time: "09:58", unread: 2, channel: false },
  { id: "t3", name: "Marc Soler", role: "Alumno", last: "Gracias por la corrección, lo reviso.", time: "Ayer", unread: 0, channel: false },
  { id: "t4", name: "Claustro de Matemáticas", role: "Grupo", last: "Reunión de departamento el viernes a las 12.", time: "Ayer", unread: 0, channel: true },
  { id: "t5", name: "Nadia Khan", role: "Alumna", last: "Adjunto la versión corregida del trabajo.", time: "Lun", unread: 0, channel: false },
];

export const chat: ChatMessage[] = [
  { from: "them", text: "Profesora, ¿puedo entregar con un día de retraso? Tuve un problema con el archivo.", time: "09:55" },
  { from: "them", text: "Lo tengo casi listo, solo me falta revisar la última parte.", time: "09:58" },
  { from: "me", text: "Hola Lucía, sin problema. Te amplío el plazo 24 horas. Súbelo cuando lo tengas.", time: "10:05" },
];

export const events: CalendarEvent[] = [
  { day: 8, title: "Cuestionario 1 · Cálculo", color: "var(--info-500)" },
  { day: 10, title: "Cierre ensayo derivadas", color: "var(--warning-500)" },
  { day: 12, title: "Entrega: Explica tu idea", color: "var(--primary-500)" },
  { day: 15, title: "Claustro de Matemáticas", color: "var(--success-500)" },
  { day: 18, title: "Cuestionario 4 · Integrales", color: "var(--info-500)" },
  { day: 22, title: "Tutoría · Física", color: "var(--primary-600)" },
  { day: 30, title: "Proyecto: aplicación real", color: "var(--warning-500)" },
];

export const activityFeed: FeedItem[] = [
  { icon: "document-add", who: "Alba García", what: "entregó «Explica tu idea: límites»", when: "hace 8 min", tint: "var(--info-100)", fg: "var(--info-600)" },
  { icon: "chat", who: "Lucía Romero", what: "te envió un mensaje", when: "hace 26 min", tint: "var(--primary-100)", fg: "var(--primary-600)" },
  { icon: "clipboard-check", who: "12 alumnos", what: "completaron el «Cuestionario 4»", when: "hace 1 h", tint: "var(--success-100)", fg: "var(--success-600)" },
  { icon: "document-add", who: "Iker Mendoza", what: "entregó «Ensayo de derivadas»", when: "hace 2 h", tint: "var(--info-100)", fg: "var(--info-600)" },
  { icon: "bell", who: "Sistema", what: "el plazo de «Cuestionario 4» cierra mañana", when: "hace 3 h", tint: "var(--warning-200)", fg: "var(--warning-600)" },
];

export const AtriaData = {
  classes, students, activities, submissions, modules, messages, chat, events, activityFeed,
};
