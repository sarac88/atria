import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { gradeSchema, type GradeInput } from "@atria/types";
import { CurrentUser, Roles, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SubmissionsService } from "./submissions.service";

@Controller("submissions")
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Patch(":id/grade")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  grade(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(gradeSchema)) body: GradeInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.submissions.grade(user, id, body);
  }
}
