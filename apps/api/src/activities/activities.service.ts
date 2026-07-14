import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Activity, SubmissionDto, SubmitInput, UpdateActivityInput } from "@atria/types";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { toActivityDto, toSubmissionDto } from "../common/mappers";

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

  private assertOwner(user: AuthUser, ownerId: string) {
    if (user.role !== "admin" && ownerId !== user.userId) throw new ForbiddenException();
  }

  /** PATCH /activities/:id — edita una actividad (docente dueño o admin). */
  async update(user: AuthUser, activityId: string, input: UpdateActivityInput): Promise<Activity> {
    const existing = await this.activityOrThrow(activityId);
    this.assertOwner(user, existing.class.ownerId);

    const data: Prisma.ActivityUpdateInput = {};

    if (input.type !== undefined) data.type = input.type;
    if (input.title !== undefined) data.title = input.title;
    if (input.instructions !== undefined) data.instructions = input.instructions;
    if (input.dueAt !== undefined) data.dueAt = input.dueAt;
    if (input.format !== undefined) data.format = input.format;
    if (input.status !== undefined) data.status = input.status;
    if (input.allowLate !== undefined) data.allowLate = input.allowLate;
    if (input.moduleId !== undefined) {
      data.module = input.moduleId
        ? { connect: { id: input.moduleId } }
        : { disconnect: true };
    }

    if (input.questions !== undefined || input.quiz !== undefined || input.debate !== undefined) {
      const config: Prisma.InputJsonValue = {};
      if (input.questions?.length) (config as Record<string, unknown>).questions = input.questions;
      if (input.quiz) (config as Record<string, unknown>).quiz = input.quiz;
      if (input.debate) (config as Record<string, unknown>).debate = input.debate;
      data.config = config;
    }

    const type = input.type ?? existing.type;
    if (input.points !== undefined) {
      data.points = input.points;
    } else if (type === "cuestionario" && input.questions?.length) {
      data.points = input.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    }

    const activity = await this.prisma.activity.update({ where: { id: activityId }, data });
    const [total, submitted] = await Promise.all([
      this.prisma.enrollment.count({ where: { classId: activity.classId, roleInClass: "student" } }),
      this.prisma.submission.count({ where: { activityId } }),
    ]);
    return toActivityDto(activity, submitted, total);
  }

  /** DELETE /activities/:id — elimina una actividad (docente dueño o admin). */
  async remove(user: AuthUser, activityId: string): Promise<{ id: string }> {
    const activity = await this.activityOrThrow(activityId);
    this.assertOwner(user, activity.class.ownerId);
    await this.prisma.activity.delete({ where: { id: activityId } });
    return { id: activityId };
  }
}
