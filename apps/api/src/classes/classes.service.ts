import { Injectable, NotFoundException } from "@nestjs/common";
import type { Activity, GradebookDto, ClassInfo, CreateClassInput, SubmissionDto } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { toActivityDto, toClassInfo, toSubmissionDto } from "../common/mappers";

const SUBMISSION_INCLUDE = {
  student: { select: { id: true, name: true } },
  activity: { select: { id: true, title: true } },
  grade: true,
} as const;

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser): Promise<ClassInfo[]> {
    if (user.role === "admin") {
      const all = await this.prisma.class.findMany({ orderBy: { createdAt: "asc" } });
      return all.map(toClassInfo);
    }
    if (user.role === "docente") {
      const owned = await this.prisma.class.findMany({
        where: { ownerId: user.userId },
        orderBy: { createdAt: "asc" },
      });
      return owned.map(toClassInfo);
    }
    // alumno → clases en las que está matriculado
    const enrolled = await this.prisma.class.findMany({
      where: { enrollments: { some: { userId: user.userId } } },
      orderBy: { createdAt: "asc" },
    });
    return enrolled.map(toClassInfo);
  }

  async findOne(id: string): Promise<ClassInfo> {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException();
    return toClassInfo(cls);
  }

  async create(ownerId: string, input: CreateClassInput): Promise<ClassInfo> {
    const cls = await this.prisma.class.create({
      data: {
        name: input.name,
        code: input.code,
        room: input.room ?? "",
        subject: input.subject ?? "",
        color: input.color,
        icon: input.icon,
        desc: input.desc ?? "",
        status: "draft",
        ownerId,
        enrollments: { create: { userId: ownerId, roleInClass: "teacher" } },
      },
    });
    return toClassInfo(cls);
  }

  /** GET /classes/:id/activities — con recuentos de entregas/alumnos. */
  async listActivities(classId: string): Promise<Activity[]> {
    const [activities, total, submissions] = await Promise.all([
      this.prisma.activity.findMany({ where: { classId }, orderBy: { createdAt: "asc" } }),
      this.prisma.enrollment.count({ where: { classId, roleInClass: "student" } }),
      this.prisma.submission.groupBy({ by: ["activityId"], where: { activity: { classId } }, _count: true }),
    ]);
    const counts = new Map(submissions.map((s) => [s.activityId, s._count]));
    return activities.map((a) => toActivityDto(a, counts.get(a.id) ?? 0, total));
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
}
