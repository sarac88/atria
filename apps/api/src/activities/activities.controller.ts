import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { submitSchema, type SubmitInput } from "@atria/types";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ActivitiesService } from "./activities.service";

@Controller("activities")
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get(":id/submissions")
  listSubmissions(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.activities.listSubmissions(user, id);
  }

  @Post(":id/submissions")
  submit(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitSchema)) body: SubmitInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activities.submit(user, id, body);
  }
}
