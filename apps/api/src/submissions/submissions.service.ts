import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { GradeInput, SubmissionDto } from "@atria/types";
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
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** PATCH /submissions/:id/grade — solo el docente dueño de la clase (o admin). */
  async grade(user: AuthUser, submissionId: string, input: GradeInput): Promise<SubmissionDto> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { activity: { include: { class: { select: { ownerId: true } } } } },
    });
    if (!submission) throw new NotFoundException();
    if (user.role !== "admin" && submission.activity.class.ownerId !== user.userId) {
      throw new ForbiddenException();
    }

    await this.prisma.grade.upsert({
      where: { submissionId },
      update: { score: input.score, feedback: input.feedback ?? "", gradedById: user.userId, gradedAt: new Date() },
      create: { submissionId, score: input.score, feedback: input.feedback ?? "", gradedById: user.userId },
    });

    const full = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: SUBMISSION_INCLUDE,
    });

    // Avisar al alumno de su nota.
    void this.notifications
      .create({
        userId: submission.studentId,
        type: "grade",
        title: "Nueva nota",
        body: `Has recibido una nota en «${submission.activity.title}»`,
        link: `/clase/${submission.activity.classId}`,
        entityId: submission.id,
      })
      .catch(() => undefined);

    return toSubmissionDto(full);
  }
}
