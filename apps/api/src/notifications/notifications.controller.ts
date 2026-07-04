import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.userId);
  }

  @Patch("read-all")
  async readAll(@CurrentUser() user: AuthUser) {
    await this.notifications.markAllRead(user.userId);
    return { ok: true };
  }

  @Patch(":id/read")
  async read(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    await this.notifications.markRead(id, user.userId);
    return { ok: true };
  }
}
