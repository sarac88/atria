import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { submitSchema, updateActivitySchema, type SubmitInput, type UpdateActivityInput } from "@atria/types";
import { CurrentUser, Roles, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
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

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateActivitySchema)) body: UpdateActivityInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activities.update(user, id, body);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.activities.remove(user, id);
  }
}
