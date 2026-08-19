import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser, Roles, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  list() {
    return this.users.listAll();
  }
}
