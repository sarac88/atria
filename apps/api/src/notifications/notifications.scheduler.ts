import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

/**
 * Deadline reminders. Time-based (not an event), so it runs on a schedule.
 * Dev cadence is 30 s for a quick demo; production would use a BullMQ repeatable
 * job over Redis so it fires once across instances.
 */
@Injectable()
export class NotificationsScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async remindDeadlines(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

    const activities = await this.prisma.activity.findMany({
      where: { dueDate: { gte: now, lte: in24h } },
      select: { id: true, title: true, classId: true },
    });

    for (const a of activities) {
      const [enrolled, submissions] = await Promise.all([
        this.prisma.enrollment.findMany({ where: { classId: a.classId, roleInClass: "student" }, select: { userId: true } }),
        this.prisma.submission.findMany({ where: { activityId: a.id }, select: { studentId: true } }),
      ]);
      const submitted = new Set(submissions.map((s) => s.studentId));
      for (const e of enrolled) {
        if (submitted.has(e.userId)) continue;
        await this.notifications.createOnce({
          userId: e.userId,
          type: "deadline",
          title: "Plazo próximo",
          body: `«${a.title}» vence pronto`,
          link: `/clase/${a.classId}`,
          entityId: a.id,
        });
      }
    }
  }
}
