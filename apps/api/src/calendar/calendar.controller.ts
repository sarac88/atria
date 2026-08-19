import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { CalendarService } from "./calendar.service";

@Controller("calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.calendar.list(user);
  }
}
