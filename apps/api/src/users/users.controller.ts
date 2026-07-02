import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.userId);
  }
}
