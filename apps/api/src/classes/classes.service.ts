import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { unlink } from "fs/promises";
import { join } from "path";
import type { Activity, CreateActivityInput, GradebookDto, ClassInfo, CreateClassInput, MeetingProvider, OverviewClassRef, OverviewStudentDto, Student, StudentTaskDto, SubmissionDto, TeacherOverviewDto, UpdateClassInput } from "@atria/types";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { toActivityDto, toClassInfo, toSubmissionDto, type ClassCounters, type ClassWithOwner } from "../common/mappers";
import { UPLOADS_DIR, uploadUrl } from "../common/uploads";

/** El nombre del docente viaja en ClassInfo.teacher, así que toda lectura de clase carga al dueño. */
const CLASS_OWNER_INCLUDE = { owner: { select: { name: true } } } as const;

const SUBMISSION_INCLUDE = {
  student: { select: { id: true, name: true } },
  activity: { select: { id: true, title: true } },
  grade: true,
  file: true,
} as const;

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser): Promise<ClassInfo[]> {
    let classes: ClassWithOwner[];
    if (user.role === "admin") {
      classes = await this.prisma.class.findMany({ include: CLASS_OWNER_INCLUDE, orderBy: { createdAt: "asc" } });
    } else if (user.role === "docente") {
      classes = await this.prisma.class.findMany({
        where: { ownerId: user.userId },
        include: CLASS_OWNER_INCLUDE,
        orderBy: { createdAt: "asc" },
      });
    } else {
      // alumno → clases en las que está matriculado
      classes = await this.prisma.class.findMany({
        where: { enrollments: { some: { userId: user.userId } } },
        include: CLASS_OWNER_INCLUDE,
        orderBy: { createdAt: "asc" },
      });
    }
    const ids = classes.map((c) => c.id);
    const [counts, counters] = await Promise.all([this.studentCounts(ids), this.classCounters(ids)]);
    const infos = classes.map((c) => toClassInfo(c, counts.get(c.id) ?? 0, counters.get(c.id)));
    if (user.role === "alumno") return this.withStudentProgress(infos, user.userId);
    return infos;
  }

  async findOne(id: string, user?: AuthUser): Promise<ClassInfo> {
    const cls = await this.prisma.class.findUnique({ where: { id }, include: CLASS_OWNER_INCLUDE });
    if (!cls) throw new NotFoundException();
    const info = await this.withStudents(cls);
    if (user?.role === "alumno") {
      const [own] = await this.withStudentProgress([info], user.userId);
      return own;
    }
    return info;
  }

  /** Recuento real de alumnos (matrículas con rol student) por clase. */
  private async studentCounts(classIds: string[]): Promise<Map<string, number>> {
    if (classIds.length === 0) return new Map();
    const grouped = await this.prisma.enrollment.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, roleInClass: "student" },
      _count: true,
    });
    return new Map(grouped.map((g) => [g.classId, g._count]));
  }

  /**
   * El progreso que ve el alumno es el suyo (entregas reales / actividades
   * publicadas), no Class.progress de la semilla, que es del temario de la clase.
   */
  private async withStudentProgress(infos: ClassInfo[], studentId: string): Promise<ClassInfo[]> {
    if (infos.length === 0) return infos;
    const classIds = infos.map((c) => c.id);
    const [activityCounts, subs] = await Promise.all([
      this.prisma.activity.groupBy({
        by: ["classId"],
        where: { classId: { in: classIds }, status: { not: "draft" } },
        _count: true,
      }),
      this.prisma.submission.findMany({
        where: {
          studentId,
          status: { in: ["entregado", "atrasado"] },
          activity: { classId: { in: classIds }, status: { not: "draft" } },
        },
        select: { activity: { select: { classId: true } } },
      }),
    ]);
    const totalOf = new Map(activityCounts.map((a) => [a.classId, a._count]));
    const deliveredOf = new Map<string, number>();
    for (const s of subs) {
      const classId = s.activity.classId;
      deliveredOf.set(classId, (deliveredOf.get(classId) ?? 0) + 1);
    }
    return infos.map((c) => {
      const total = totalOf.get(c.id) ?? 0;
      const delivered = deliveredOf.get(c.id) ?? 0;
      return { ...c, progress: total ? delivered / total : 0 };
    });
  }

  /**
   * Actividades abiertas (publicadas) y entregas por revisar de cada clase. Se
   * calculan en cada lectura: las columnas homónimas de Class venían de la
   * semilla y nadie las mantenía al día.
   */
  private async classCounters(classIds: string[]): Promise<Map<string, ClassCounters>> {
    if (classIds.length === 0) return new Map();
    const [open, ungraded] = await Promise.all([
      this.prisma.activity.groupBy({
        by: ["classId"],
        where: { classId: { in: classIds }, status: { not: "draft" } },
        _count: true,
      }),
      this.prisma.submission.groupBy({
        by: ["activityId"],
        where: { activity: { classId: { in: classIds } }, grade: { is: null } },
        _count: true,
      }),
    ]);
    // groupBy sobre submission agrupa por actividad, así que hay que remapear a su clase.
    const activityClass = new Map(
      (
        await this.prisma.activity.findMany({
          where: { id: { in: ungraded.map((u) => u.activityId) } },
          select: { id: true, classId: true },
        })
      ).map((a) => [a.id, a.classId]),
    );
    const result = new Map<string, ClassCounters>(classIds.map((id) => [id, { openActivities: 0, pending: 0 }]));
    for (const o of open) {
      const entry = result.get(o.classId);
      if (entry) entry.openActivities = o._count;
    }
    for (const u of ungraded) {
      const classId = activityClass.get(u.activityId);
      const entry = classId ? result.get(classId) : undefined;
      if (entry) entry.pending += u._count;
    }
    return result;
  }

  async create(ownerId: string, input: CreateClassInput): Promise<ClassInfo> {
    const cls = await this.prisma.class.create({
      data: {
        name: input.name,
        code: input.code,
        room: input.room ?? "",
        subject: input.subject ?? "",
        stage: input.stage ?? "",
        color: input.color,
        icon: input.icon,
        thumb: input.thumb ?? "",
        desc: input.desc ?? "",
        status: input.publish === false ? "draft" : "live",
        ownerId,
        enrollments: { create: { userId: ownerId, roleInClass: "teacher" } },
      },
      include: CLASS_OWNER_INCLUDE,
    });
    return toClassInfo(cls, 0);
  }

  /** Comprueba que el usuario es el docente dueño (o admin). Devuelve la clase. */
  private async assertOwner(user: AuthUser, classId: string) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException();
    if (user.role !== "admin" && cls.ownerId !== user.userId) throw new ForbiddenException();
    return cls;
  }

  /** PATCH /classes/:id — edita la clase (docente dueño o admin). */
  async update(user: AuthUser, classId: string, input: UpdateClassInput): Promise<ClassInfo> {
    await this.assertOwner(user, classId);
    const { publish, ...rest } = input;
    const cls = await this.prisma.class.update({
      where: { id: classId },
      data: {
        ...rest,
        ...(publish === undefined ? {} : { status: publish ? "live" : "draft" }),
      },
      include: CLASS_OWNER_INCLUDE,
    });
    return this.withStudents(cls);
  }

  /** POST /classes/:id/cover — guarda la portada y descarta la anterior. */
  async setCover(user: AuthUser, classId: string, file: Express.Multer.File): Promise<ClassInfo> {
    const prev = await this.assertOwner(user, classId);
    const cls = await this.prisma.class.update({
      where: { id: classId },
      data: { coverUrl: uploadUrl(file.filename) },
      include: CLASS_OWNER_INCLUDE,
    });
    await this.removeCoverFile(prev.coverUrl);
    return this.withStudents(cls);
  }

  /** DELETE /classes/:id/cover — quita la portada. */
  async clearCover(user: AuthUser, classId: string): Promise<ClassInfo> {
    const prev = await this.assertOwner(user, classId);
    const cls = await this.prisma.class.update({ where: { id: classId }, data: { coverUrl: "" }, include: CLASS_OWNER_INCLUDE });
    await this.removeCoverFile(prev.coverUrl);
    return this.withStudents(cls);
  }

  /** Las portadas no pasan por la tabla File: se borran del disco a mano. */
  private async removeCoverFile(coverUrl: string): Promise<void> {
    const key = coverUrl.startsWith("/uploads/") ? coverUrl.slice("/uploads/".length) : "";
    if (!key) return;
    await unlink(join(UPLOADS_DIR, key)).catch(() => undefined);
  }

  private async withStudents(cls: ClassWithOwner): Promise<ClassInfo> {
    const [students, counters] = await Promise.all([
      this.prisma.enrollment.count({ where: { classId: cls.id, roleInClass: "student" } }),
      this.classCounters([cls.id]),
    ]);
    return toClassInfo(cls, students, counters.get(cls.id));
  }

  /** DELETE /classes/:id — borra la clase y su contenido (docente dueño o admin). */
  async remove(user: AuthUser, classId: string): Promise<{ id: string }> {
    await this.assertOwner(user, classId);
    // Desligamos las conversaciones (classId opcional) y dejamos que el resto
    // (matrículas, módulos, actividades, entregas, notas) caiga por cascada.
    await this.prisma.$transaction([
      this.prisma.conversation.updateMany({ where: { classId }, data: { classId: null } }),
      this.prisma.class.delete({ where: { id: classId } }),
    ]);
    return { id: classId };
  }

  /** GET /classes/:id/roster — alumnos matriculados con media/entregas/progreso reales. */
  async roster(classId: string): Promise<Student[]> {
    const [enrolled, activityCount] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { classId, roleInClass: "student" },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.activity.count({ where: { classId } }),
    ]);
    const subs = await this.prisma.submission.findMany({
      where: { activity: { classId }, studentId: { in: enrolled.map((e) => e.userId) } },
      select: { studentId: true, grade: { select: { score: true } } },
    });
    const agg = new Map<string, { count: number; grades: number[] }>();
    for (const s of subs) {
      const cur = agg.get(s.studentId) ?? { count: 0, grades: [] };
      cur.count += 1;
      if (s.grade) cur.grades.push(s.grade.score);
      agg.set(s.studentId, cur);
    }
    return enrolled.map((e) => {
      const a = agg.get(e.user.id) ?? { count: 0, grades: [] };
      const avg = a.grades.length ? Math.round((a.grades.reduce((x, y) => x + y, 0) / a.grades.length) * 10) / 10 : null;
      return {
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        avg,
        progress: activityCount ? a.count / activityCount : 0,
        submitted: a.count,
      };
    });
  }

  /** POST /classes/:id/activities — crea una actividad (docente dueño). */
  async createActivity(user: AuthUser, classId: string, input: CreateActivityInput): Promise<Activity> {
    const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { ownerId: true } });
    if (!cls) throw new NotFoundException();
    if (user.role !== "admin" && cls.ownerId !== user.userId) throw new ForbiddenException();
    const total = await this.prisma.enrollment.count({ where: { classId, roleInClass: "student" } });

    const config: Prisma.InputJsonValue = {};
    if (input.questions?.length) (config as Record<string, unknown>).questions = input.questions;
    if (input.quiz) (config as Record<string, unknown>).quiz = input.quiz;
    if (input.debate) (config as Record<string, unknown>).debate = input.debate;

    let points = input.points ?? 0;
    if (input.type === "cuestionario" && input.questions?.length) {
      points = input.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    }

    const activity = await this.prisma.activity.create({
      data: {
        classId,
        moduleId: input.moduleId ?? null,
        type: input.type,
        title: input.title,
        instructions: input.instructions ?? "",
        dueAt: input.dueAt ?? "",
        points,
        format: input.format ?? "Archivo",
        allowLate: input.allowLate ?? true,
        config,
        status: input.status ?? "live",
      },
    });
    return toActivityDto(activity, 0, total);
  }

  /** GET /classes/:id/activities — con recuentos de entregas/alumnos. */
  async listActivities(classId: string, user: AuthUser): Promise<Activity[]> {
    const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { ownerId: true } });
    // Los borradores solo son visibles para el docente dueño (o admin); los alumnos no los ven.
    const canSeeDrafts = user.role === "admin" || cls?.ownerId === user.userId;
    const [activities, total, submissions, ungraded] = await Promise.all([
      this.prisma.activity.findMany({
        where: { classId, ...(canSeeDrafts ? {} : { status: { not: "draft" } }) },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.enrollment.count({ where: { classId, roleInClass: "student" } }),
      this.prisma.submission.groupBy({ by: ["activityId"], where: { activity: { classId } }, _count: true }),
      this.prisma.submission.groupBy({
        by: ["activityId"],
        where: {
          activity: { classId },
          grade: { is: null },
          status: { in: ["entregado", "atrasado"] },
        },
        _count: true,
      }),
    ]);
    const counts = new Map(submissions.map((s) => [s.activityId, s._count]));
    const ungradedOf = new Map(ungraded.map((s) => [s.activityId, s._count]));
    return activities.map((a) => toActivityDto(a, counts.get(a.id) ?? 0, total, ungradedOf.get(a.id) ?? 0));
  }

  /** GET /classes/:id/gradebook — matriz alumnos × actividades. */
  async gradebook(classId: string): Promise<GradebookDto> {
    const [activities, roster, subs] = await Promise.all([
      this.prisma.activity.findMany({ where: { classId }, orderBy: { createdAt: "asc" }, select: { id: true, title: true } }),
      this.prisma.enrollment.findMany({
        where: { classId, roleInClass: "student" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.submission.findMany({
        where: { activity: { classId }, grade: { isNot: null } },
        select: { studentId: true, activityId: true, grade: { select: { score: true } } },
      }),
    ]);
    const scoreOf = new Map(subs.map((s) => [`${s.studentId}:${s.activityId}`, s.grade!.score]));
    const rows = roster.map((e) => {
      const cells = activities.map((a) => scoreOf.get(`${e.user.id}:${a.id}`) ?? null);
      const graded = cells.filter((c): c is number => c != null);
      const avg = graded.length ? Math.round((graded.reduce((x, y) => x + y, 0) / graded.length) * 10) / 10 : null;
      return { studentId: e.user.id, student: e.user.name, cells, avg };
    });
    return { columns: activities.map((a) => ({ id: a.id, title: a.title })), rows };
  }

  /** GET /classes/:id/my-submissions — entregas del alumno autenticado en la clase. */
  async mySubmissions(classId: string, studentId: string): Promise<SubmissionDto[]> {
    const subs = await this.prisma.submission.findMany({
      where: { studentId, activity: { classId } },
      include: SUBMISSION_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    return subs.map(toSubmissionDto);
  }

  /** GET /classes/student/tasks — todas las actividades de las clases del alumno con su entrega (si la hay). */
  async studentTasks(user: AuthUser): Promise<StudentTaskDto[]> {
    const classes = await this.prisma.class.findMany({
      where: { enrollments: { some: { userId: user.userId } } },
      select: { id: true, name: true },
    });
    if (classes.length === 0) return [];
    const classIds = classes.map((c) => c.id);
    const nameOf = new Map(classes.map((c) => [c.id, c.name]));

    const [activities, totals, subCounts, mySubs] = await Promise.all([
      this.prisma.activity.findMany({ where: { classId: { in: classIds }, status: { not: "draft" } }, orderBy: { createdAt: "asc" } }),
      this.prisma.enrollment.groupBy({ by: ["classId"], where: { classId: { in: classIds }, roleInClass: "student" }, _count: true }),
      this.prisma.submission.groupBy({ by: ["activityId"], where: { activity: { classId: { in: classIds } } }, _count: true }),
      this.prisma.submission.findMany({ where: { studentId: user.userId, activity: { classId: { in: classIds } } }, include: SUBMISSION_INCLUDE }),
    ]);

    const totalOf = new Map(totals.map((t) => [t.classId, t._count]));
    const submittedOf = new Map(subCounts.map((s) => [s.activityId, s._count]));
    const myByActivity = new Map(mySubs.map((s) => [s.activityId, toSubmissionDto(s)]));

    return activities.map((a) => ({
      ...toActivityDto(a, submittedOf.get(a.id) ?? 0, totalOf.get(a.classId) ?? 0),
      className: nameOf.get(a.classId) ?? "",
      mySubmission: myByActivity.get(a.id) ?? null,
    }));
  }

  /**
   * GET /classes/teacher/overview — el panel de inicio del docente: próximas
   * videollamadas y sus alumnos con la participación de cada uno. El admin ve
   * el de todas las clases.
   */
  async teacherOverview(user: AuthUser): Promise<TeacherOverviewDto> {
    const classes = await this.prisma.class.findMany({
      where: user.role === "admin" ? {} : { ownerId: user.userId },
      select: { id: true, name: true, thumb: true, color: true, icon: true },
      orderBy: { createdAt: "asc" },
    });
    if (classes.length === 0) return { sessions: [], students: [] };
    const classIds = classes.map((c) => c.id);
    const byId = new Map(classes.map((c) => [c.id, c]));
    const classRef = (classId: string): OverviewClassRef => {
      const c = byId.get(classId);
      return { classId, className: c?.name ?? "", classThumb: c?.thumb ?? "", classColor: c?.color ?? "", classIcon: c?.icon ?? "" };
    };

    // Una sesión sigue "próxima" hasta hora y media después de empezar, igual que el "En curso" del cliente.
    const since = new Date(Date.now() - 90 * 60_000);
    const [sessions, enrollments, activityCounts, delivered] = await Promise.all([
      this.prisma.onlineSession.findMany({
        where: { startsAt: { gte: since }, module: { classId: { in: classIds } } },
        include: { module: { select: { classId: true, title: true } } },
        orderBy: { startsAt: "asc" },
        take: 4,
      }),
      this.prisma.enrollment.findMany({
        where: { classId: { in: classIds }, roleInClass: "student" },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.activity.groupBy({
        by: ["classId"],
        where: { classId: { in: classIds }, status: { not: "draft" } },
        _count: true,
      }),
      this.prisma.submission.findMany({
        where: { status: { in: ["entregado", "atrasado"] }, activity: { classId: { in: classIds }, status: { not: "draft" } } },
        select: { studentId: true, activity: { select: { classId: true } } },
      }),
    ]);

    const studentsOf = new Map<string, { id: string; name: string; avatarUrl: string | null }[]>();
    for (const e of enrollments) {
      const list = studentsOf.get(e.classId) ?? [];
      list.push({ id: e.user.id, name: e.user.name, avatarUrl: e.user.avatarUrl ?? null });
      studentsOf.set(e.classId, list);
    }

    // Participación: entregas en actividades publicadas sobre las publicadas en sus clases.
    const totalOf = new Map(activityCounts.map((a) => [a.classId, a._count]));
    const deliveredOf = new Map<string, number>();
    for (const s of delivered) {
      const key = `${s.studentId}:${s.activity.classId}`;
      deliveredOf.set(key, (deliveredOf.get(key) ?? 0) + 1);
    }
    const students = new Map<string, OverviewStudentDto>();
    for (const e of enrollments) {
      const cur = students.get(e.user.id) ?? { id: e.user.id, name: e.user.name, avatarUrl: e.user.avatarUrl ?? null, classes: [], participation: 0, submitted: 0, total: 0 };
      cur.classes.push(byId.get(e.classId)?.name ?? "");
      cur.submitted += deliveredOf.get(`${e.user.id}:${e.classId}`) ?? 0;
      cur.total += totalOf.get(e.classId) ?? 0;
      students.set(e.user.id, cur);
    }

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        provider: s.provider as MeetingProvider,
        label: s.label,
        url: s.url,
        startsAt: s.startsAt!.toISOString(),
        moduleTitle: s.module.title,
        students: studentsOf.get(s.module.classId) ?? [],
        ...classRef(s.module.classId),
      })),
      students: [...students.values()]
        .map((s) => ({ ...s, participation: s.total ? Math.min(1, s.submitted / s.total) : 0 }))
        .sort((a, b) => b.participation - a.participation || a.name.localeCompare(b.name, "es")),
    };
  }
}
