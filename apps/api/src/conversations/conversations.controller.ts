import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { ConversationsService } from "./conversations.service";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.conversations.findAll(user.userId);
  }

  @Get(":id/messages")
  messages(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.conversations.getMessages(user.userId, id);
  }
}
