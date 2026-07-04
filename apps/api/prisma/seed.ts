import { ActivityType, ClassStatus, PrismaClient, SubmissionStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

interface SeedClass {
  id: string;
  name: string;
  code: string;
  room: string;
  subject: string;
  students: number;
  color: string;
  icon: string;
  status: ClassStatus;
  progress: number;
  openActivities: number;
  pending: number;
  nextSession: string;
  desc: string;
}

const CLASSES: SeedClass[] = [
  { id: "calc2", name: "Cálculo II", code: "MAT-204", room: "Aula 345", subject: "Matemáticas", students: 32, color: "var(--primary-500)", icon: "academic-cap", status: ClassStatus.live, progress: 0.62, openActivities: 4, pending: 8, nextSession: "Hoy · 10:30", desc: "Derivadas, integrales y series. Segundo cuatrimestre." },
  { id: "arte", name: "Historia del Arte", code: "HUM-110", room: "Aula 210", subject: "Humanidades", students: 28, color: "var(--yellow-500)", icon: "book-open", status: ClassStatus.live, progress: 0.41, openActivities: 2, pending: 3, nextSession: "Mañana · 09:00", desc: "Del Renacimiento a las vanguardias del siglo XX." },
  { id: "bio", name: "Biología Molecular", code: "BIO-330", room: "Aula 118", subject: "Ciencias", students: 24, color: "var(--info-500)", icon: "folder", status: ClassStatus.scheduled, progress: 0.18, openActivities: 1, pending: 0, nextSession: "Lun · 12:00", desc: "ADN, ARN y síntesis de proteínas. Laboratorio incluido." },
  { id: "lengua", name: "Lengua y Literatura", code: "LEN-101", room: "Aula 402", subject: "Lengua", students: 30, color: "var(--success-500)", icon: "document-text", status: ClassStatus.live, progress: 0.74, openActivities: 3, pending: 5, nextSession: "Hoy · 13:00", desc: "Comentario de texto y narrativa contemporánea." },
  { id: "fisica", name: "Física General", code: "FIS-205", room: "Aula 201", subject: "Ciencias", students: 26, color: "var(--primary-600)", icon: "star", status: ClassStatus.live, progress: 0.55, openActivities: 2, pending: 7, nextSession: "Mié · 11:00", desc: "Mecánica, termodinámica y ondas." },
  { id: "quimica", name: "Química Orgánica", code: "QUI-212", room: "Aula 119", subject: "Ciencias", students: 22, color: "var(--warning-500)", icon: "book-open", status: ClassStatus.draft, progress: 0.0, openActivities: 0, pending: 0, nextSession: "Sin programar", desc: "Borrador en preparación para el próximo curso." },
];

const MODULES = [
  { id: "m1", title: "Unidad 1 · Límites y continuidad", position: 0, done: true, items: [
    { type: "document-text", label: "Apuntes: definición de límite", meta: "PDF · 12 págs", state: "Visto" },
    { type: "play", label: "Vídeo: límites laterales", meta: "Vídeo · 14 min", state: "Visto" },
    { type: "clipboard-check", label: "Cuestionario 1", meta: "5 preguntas", state: "Completado" },
  ] },
  { id: "m2", title: "Unidad 2 · Derivadas", position: 1, done: false, items: [
    { type: "document-text", label: "Apuntes: reglas de derivación", meta: "PDF · 18 págs", state: "Nuevo" },
    { type: "document-add", label: "Ensayo de derivadas", meta: "Entrega · 10 pts", state: "Abierto" },
    { type: "play", label: "Vídeo: regla de la cadena", meta: "Vídeo · 11 min", state: "" },
  ] },
  { id: "m3", title: "Unidad 3 · Integrales", position: 2, done: false, items: [
    { type: "document-text", label: "Apuntes: integral definida", meta: "PDF · 15 págs", state: "" },
    { type: "clipboard-check", label: "Cuestionario 4 — Integrales", meta: "10 preguntas", state: "Abierto" },
    { type: "folder", label: "Material complementario", meta: "3 archivos", state: "" },
  ] },
];

const ACTIVITIES = [
  { id: "a1", type: ActivityType.ensayo, title: "Explica tu idea: límites", dueAt: "12 / 10 / 2022", points: 10, format: "Texto", status: ClassStatus.live, instructions: "Redacta un texto de 300–500 palabras explicando el concepto de límite." },
  { id: "a2", type: ActivityType.tarea, title: "Ensayo de derivadas", dueAt: "10 / 10 / 2022", points: 10, format: "Archivo", status: ClassStatus.draft, instructions: "Resuelve los 8 ejercicios de derivadas y súbelos en PDF." },
  { id: "a3", type: ActivityType.cuestionario, title: "Cuestionario 4 — Integrales", dueAt: "18 / 10 / 2022", points: 5, format: "Examen", status: ClassStatus.live, instructions: "10 preguntas de opción múltiple. Un intento, 20 minutos." },
  { id: "a4", type: ActivityType.proyecto, title: "Proyecto: aplicación real", dueAt: "30 / 10 / 2022", points: 20, format: "Archivo", status: ClassStatus.scheduled, instructions: "En grupos de 3, aplicad el cálculo a un problema real." },
];

// Roster de Cálculo II (8 alumnos, como en el diseño). Marc Soler reutiliza u-marc.
const ROSTER = [
  "Alba García", "Marc Soler", "Lucía Romero", "Iker Mendoza",
  "Nadia Khan", "Tomás Vidal", "Sara Pons", "Diego Lima",
];
const emailOf = (n: string) =>
  n.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éè]/g, "e").replace(/[íï]/g, "i")
    .replace(/[óö]/g, "o").replace(/[úü]/g, "u").replace(" ", ".") + "@atria.edu";

// a1 "Explica tu idea" — entregas por índice de ROSTER (Marc=1 y Diego=7 → sin entrega, Pendiente).
const A1: { i: number; status: SubmissionStatus; date: Date; grade: number | null }[] = [
  { i: 0, status: SubmissionStatus.entregado, date: new Date(2022, 9, 12), grade: 9.0 },
  { i: 2, status: SubmissionStatus.atrasado, date: new Date(2022, 9, 13), grade: null },
  { i: 3, status: SubmissionStatus.entregado, date: new Date(2022, 9, 11), grade: 7.5 },
  { i: 4, status: SubmissionStatus.entregado, date: new Date(2022, 9, 12), grade: null },
  { i: 5, status: SubmissionStatus.entregado, date: new Date(2022, 9, 12), grade: 8.0 },
  { i: 6, status: SubmissionStatus.entregado, date: new Date(2022, 9, 12), grade: null },
];
// Matriz de notas (por índice de ROSTER) para a2 (Derivadas) y a3 (Cuestionario 4).
const A2: (number | null)[] = [8.5, 5.0, 8.0, 7.5, 5.5, 7.0, 9.0, 6.5];
const A3: (number | null)[] = [9.5, 7.0, 8.5, 9.0, 6.0, 8.0, 9.5, null];

async function main() {
  // Clean (dev seed is re-runnable). Order respects FKs.
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.module.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash("atria2025");

  const elena = await prisma.user.create({
    data: { id: "u-elena", name: "Elena Ruiz", email: "elena.ruiz@atria.edu", passwordHash, role: "docente" },
  });
  const marc = await prisma.user.create({
    data: { id: "u-marc", name: "Marc Soler", email: "marc.soler@atria.edu", passwordHash, role: "alumno" },
  });
  await prisma.user.create({
    data: { id: "u-admin", name: "Dirección", email: "direccion@atria.edu", passwordHash, role: "admin" },
  });

  for (const c of CLASSES) {
    await prisma.class.create({
      data: {
        id: c.id, name: c.name, code: c.code, room: c.room, subject: c.subject,
        color: c.color, icon: c.icon, status: c.status, progress: c.progress,
        studentsCount: c.students, openActivities: c.openActivities, pending: c.pending,
        nextSession: c.nextSession, desc: c.desc, ownerId: elena.id,
      },
    });
    // Elena imparte todas; Marc matriculado en las 5 primeras.
    await prisma.enrollment.create({ data: { classId: c.id, userId: elena.id, roleInClass: "teacher" } });
  }
  for (const c of CLASSES.slice(0, 5)) {
    await prisma.enrollment.create({ data: { classId: c.id, userId: marc.id, roleInClass: "student" } });
  }

  // Contenido de Cálculo II
  for (const m of MODULES) {
    await prisma.module.create({
      data: {
        id: m.id, classId: "calc2", title: m.title, position: m.position, done: m.done,
        resources: { create: m.items.map((it) => ({ type: it.type, label: it.label, meta: it.meta, state: it.state })) },
      },
    });
  }
  for (const a of ACTIVITIES) {
    await prisma.activity.create({
      data: { id: a.id, classId: "calc2", type: a.type, title: a.title, dueAt: a.dueAt, points: a.points, format: a.format, status: a.status, instructions: a.instructions },
    });
  }

  // Roster de Cálculo II + entregas y notas.
  const rosterIds: string[] = [];
  for (const name of ROSTER) {
    const email = emailOf(name);
    const user =
      name === "Marc Soler"
        ? marc
        : await prisma.user.create({ data: { name, email, passwordHash, role: "alumno" } });
    rosterIds.push(user.id);
    await prisma.enrollment.upsert({
      where: { userId_classId: { userId: user.id, classId: "calc2" } },
      update: {},
      create: { userId: user.id, classId: "calc2", roleInClass: "student" },
    });
  }

  const addSub = async (
    activityId: string,
    studentId: string,
    status: SubmissionStatus,
    date: Date | null,
    grade: number | null,
    fileName: string,
  ) => {
    const sub = await prisma.submission.create({
      data: { activityId, studentId, status, submittedAt: date, fileName },
    });
    if (grade != null) {
      await prisma.grade.create({
        data: { submissionId: sub.id, score: grade, feedback: "", gradedById: elena.id },
      });
    }
  };

  for (const s of A1) await addSub("a1", rosterIds[s.i], s.status, s.date, s.grade, "explica-idea.pdf");
  for (let i = 0; i < ROSTER.length; i++) {
    await addSub("a2", rosterIds[i], SubmissionStatus.entregado, new Date(2022, 9, 10), A2[i], "derivadas.pdf");
  }
  for (let i = 0; i < ROSTER.length; i++) {
    if (A3[i] != null) await addSub("a3", rosterIds[i], SubmissionStatus.entregado, new Date(2022, 9, 18), A3[i], "cuestionario4.pdf");
  }

  // ---- Conversaciones (mensajería) ----
  const lucia = rosterIds[2];
  const nadia = rosterIds[4];
  const at = (h: number, m: number, daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const READ = new Date();

  const makeConversation = async (opts: {
    type: string;
    title?: string;
    classId?: string | null;
    participants: { userId: string; lastReadAt: Date | null }[];
    messages: { senderId: string; body: string; createdAt: Date }[];
  }) => {
    const conv = await prisma.conversation.create({
      data: {
        type: opts.type,
        title: opts.title ?? "",
        classId: opts.classId ?? null,
        participants: { create: opts.participants.map((p) => ({ userId: p.userId, lastReadAt: p.lastReadAt })) },
      },
    });
    for (const msg of opts.messages) {
      await prisma.message.create({ data: { conversationId: conv.id, senderId: msg.senderId, body: msg.body, createdAt: msg.createdAt } });
    }
  };

  // Directa Elena ↔ Lucía (Elena con 2 no-leídos: lastReadAt null)
  await makeConversation({
    type: "direct",
    participants: [{ userId: elena.id, lastReadAt: null }, { userId: lucia, lastReadAt: at(10, 6) }],
    messages: [
      { senderId: lucia, body: "Profesora, ¿puedo entregar con un día de retraso? Tuve un problema con el archivo.", createdAt: at(9, 55) },
      { senderId: lucia, body: "Lo tengo casi listo, solo me falta revisar la última parte.", createdAt: at(9, 58) },
      { senderId: elena.id, body: "Hola Lucía, sin problema. Te amplío el plazo 24 horas. Súbelo cuando lo tengas.", createdAt: at(10, 5) },
    ],
  });
  // Directa Elena ↔ Marc
  await makeConversation({
    type: "direct",
    participants: [{ userId: elena.id, lastReadAt: READ }, { userId: marc.id, lastReadAt: READ }],
    messages: [{ senderId: marc.id, body: "Gracias por la corrección, lo reviso.", createdAt: at(16, 30, 1) }],
  });
  // Directa Elena ↔ Nadia
  await makeConversation({
    type: "direct",
    participants: [{ userId: elena.id, lastReadAt: READ }, { userId: nadia, lastReadAt: READ }],
    messages: [{ senderId: nadia, body: "Adjunto la versión corregida del trabajo.", createdAt: at(11, 0, 4) }],
  });
  // Canal de clase · Cálculo II · Tablón
  await makeConversation({
    type: "channel",
    title: "Cálculo II · Tablón",
    classId: "calc2",
    participants: [elena.id, ...rosterIds].map((userId) => ({ userId, lastReadAt: READ })),
    messages: [{ senderId: elena.id, body: "Recordad subir el ensayo antes del jueves.", createdAt: at(10, 24) }],
  });
  // Grupo · Claustro de Matemáticas
  await makeConversation({
    type: "group",
    title: "Claustro de Matemáticas",
    participants: [{ userId: elena.id, lastReadAt: READ }],
    messages: [{ senderId: elena.id, body: "Reunión de departamento el viernes a las 12.", createdAt: at(12, 0, 1) }],
  });

  // Plazo próximo para el planificador (a4 "Proyecto" sin entregas → avisos a los alumnos).
  await prisma.activity.update({ where: { id: "a4" }, data: { dueDate: new Date(Date.now() + 18 * 3600 * 1000) } });

  // Notificaciones iniciales para Elena (2 sin leer).
  await prisma.notification.createMany({
    data: [
      { userId: elena.id, type: "submission", title: "Nueva entrega", body: "Alba García entregó «Explica tu idea: límites»", link: "/clase/calc2", entityId: "seed-1", createdAt: at(9, 52) },
      { userId: elena.id, type: "submission", title: "Nueva entrega", body: "Iker Mendoza entregó «Ensayo de derivadas»", link: "/clase/calc2", entityId: "seed-2", createdAt: at(8, 30) },
      { userId: elena.id, type: "system", title: "Recordatorio", body: "El plazo de «Cuestionario 4» cierra mañana", link: "/clase/calc2", entityId: "seed-3", readAt: new Date(), createdAt: at(7, 0) },
    ],
  });

  console.log("Seed completado: usuarios + roster, clases, entregas, notas, conversaciones y notificaciones.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
