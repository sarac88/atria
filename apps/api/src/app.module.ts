import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ClassesModule } from "./classes/classes.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { ModulesModule } from "./modules/modules.module";
import { ActivitiesModule } from "./activities/activities.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { MessagingModule } from "./messaging/messaging.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { CalendarModule } from "./calendar/calendar.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    InvitationsModule,
    ModulesModule,
    ActivitiesModule,
    SubmissionsModule,
    ConversationsModule,
    MessagingModule,
    NotificationsModule,
    CalendarModule,
  ],
})
export class AppModule {}
