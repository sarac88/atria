import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { openClassThreadSchema, type OpenClassThreadInput } from "@atria/types";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ConversationsService } from "./conversations.service";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.conversations.findAll(user.userId);
  }

  /** Hilos del chat de una clase: todos los alumnos si es el docente, solo el docente si es alumno. */
  @Get("class/:classId")
  classChat(@Param("classId") classId: string, @CurrentUser() user: AuthUser) {
    return this.conversations.classChat(user, classId);
  }

  @Post("class/:classId/open")
  openClassThread(
    @Param("classId") classId: string,
    @Body(new ZodValidationPipe(openClassThreadSchema)) body: OpenClassThreadInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.conversations.openClassThread(user, classId, body.withUserId);
  }

  @Get(":id/messages")
  messages(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.conversations.getMessages(user.userId, id);
  }
}
