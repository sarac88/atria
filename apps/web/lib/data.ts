// Atria LMS — remaining mock data.
// Only the bits still used by not-yet-wired Fase 2/3 screens remain here:
//   · students     → admin (UserManagement, AdminDashboard) + teacher Analytics
//   · activityFeed → teacher dashboard "actividad reciente"
// Everything else (classes, activities, submissions, modules, messages, chat,
// events) is now served by the API and has been removed.

import type { FeedItem, Student } from "./types";

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

export const activityFeed: FeedItem[] = [
  { icon: "document-add", who: "Alba García", what: "entregó «Explica tu idea: límites»", when: "hace 8 min", tint: "var(--info-100)", fg: "var(--info-600)" },
  { icon: "chat", who: "Lucía Romero", what: "te envió un mensaje", when: "hace 26 min", tint: "var(--primary-100)", fg: "var(--primary-600)" },
  { icon: "clipboard-check", who: "12 alumnos", what: "completaron el «Cuestionario 4»", when: "hace 1 h", tint: "var(--success-100)", fg: "var(--success-600)" },
  { icon: "document-add", who: "Iker Mendoza", what: "entregó «Ensayo de derivadas»", when: "hace 2 h", tint: "var(--info-100)", fg: "var(--info-600)" },
  { icon: "bell", who: "Sistema", what: "el plazo de «Cuestionario 4» cierra mañana", when: "hace 3 h", tint: "var(--warning-200)", fg: "var(--warning-600)" },
];
