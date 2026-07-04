import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { SubmissionDto, SubmitInput } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { toSubmissionDto } from "../common/mappers";

const SUBMISSION_INCLUDE = {
  student: { select: { id: true, name: true } },
  activity: { select: { id: true, title: true } },
  grade: true,
} as const;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async activityOrThrow(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { class: { select: { id: true, ownerId: true } } },
    });
    if (!activity) throw new NotFoundException();
    return activity;
  }

  /** GET /activities/:id/submissions — una fila por alumno matriculado (docente/admin). */
  async listSubmissions(user: AuthUser, activityId: string): Promise<SubmissionDto[]> {
    const activity = await this.activityOrThrow(activityId);
    if (user.role !== "admin" && activity.class.ownerId !== user.userId) throw new ForbiddenException();

    const [roster, subs] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { classId: activity.classId, roleInClass: "student" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.submission.findMany({ where: { activityId }, include: SUBMISSION_INCLUDE }),
    ]);

    const byStudent = new Map(subs.map((s) => [s.studentId, s]));
    return roster.map((e) => {
      const s = byStudent.get(e.user.id);
      if (s) return toSubmissionDto(s);
      return {
        id: `pending-${e.user.id}`,
        studentId: e.user.id,
        student: e.user.name,
        activityId,
        activity: activity.title,
        status: "Pendiente" as const,
        date: "—",
        grade: "—",
        feedback: "",
        late: false,
      };
    });
  }

  /** POST /activities/:id/submissions — el alumno matriculado entrega (metadatos). */
  async submit(user: AuthUser, activityId: string, input: SubmitInput): Promise<SubmissionDto> {
    if (user.role !== "alumno") throw new ForbiddenException("Solo los alumnos pueden entregar.");
    const activity = await this.activityOrThrow(activityId);
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_classId: { userId: user.userId, classId: activity.classId } },
    });
    if (!enrolled) throw new ForbiddenException();

    const fileName = input.fileName ?? "entrega.pdf";
    const sub = await this.prisma.submission.upsert({
      where: { activityId_studentId: { activityId, studentId: user.userId } },
      update: { status: "entregado", submittedAt: new Date(), fileName },
      create: { activityId, studentId: user.userId, status: "entregado", submittedAt: new Date(), fileName },
      include: SUBMISSION_INCLUDE,
    });

    // Avisar al docente dueño de la clase.
    void this.notifications
      .create({
        userId: activity.class.ownerId,
        type: "submission",
        title: "Nueva entrega",
        body: `${sub.student.name} entregó «${activity.title}»`,
        link: `/clase/${activity.classId}`,
        entityId: sub.id,
      })
      .catch(() => undefined);

    return toSubmissionDto(sub);
  }
}
