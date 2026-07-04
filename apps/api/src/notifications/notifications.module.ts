import { Module } from "@nestjs/common";
import { MessagingModule } from "../messaging/messaging.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsScheduler } from "./notifications.scheduler";

@Module({
  imports: [MessagingModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
