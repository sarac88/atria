import { Injectable } from "@nestjs/common";
import type { NotificationFeed } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { MessagingGateway } from "../messaging/messaging.gateway";
import { toNotificationDto } from "../common/mappers";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagingGateway,
  ) {}

  /** Persist a notification and push it live to the user's sockets. */
  async create(input: CreateNotificationInput): Promise<void> {
    const n = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        link: input.link ?? null,
        entityId: input.entityId ?? null,
      },
    });
    this.gateway.emitToUser(input.userId, "notification.new", toNotificationDto(n));
  }

  /** Create only if no notification of the same (user, type, entity) exists — for deadline reminders. */
  async createOnce(input: CreateNotificationInput): Promise<void> {
    const exists = await this.prisma.notification.findFirst({
      where: { userId: input.userId, type: input.type, entityId: input.entityId },
      select: { id: true },
    });
    if (exists) return;
    await this.create(input);
  }

  async list(userId: string): Promise<NotificationFeed> {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items: items.map(toNotificationDto), unread };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  /** Borra una notificación del usuario (scoped por userId para que solo borre las suyas). */
  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
  }
}
