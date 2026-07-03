import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ClassesModule } from "./classes/classes.module";
import { ActivitiesModule } from "./activities/activities.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { MessagingModule } from "./messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    ActivitiesModule,
    SubmissionsModule,
    ConversationsModule,
    MessagingModule,
  ],
})
export class AppModule {}
