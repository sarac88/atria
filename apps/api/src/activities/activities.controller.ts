import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  createDebatePostSchema,
  submitSchema,
  updateActivitySchema,
  type CreateDebatePostInput,
  type SubmitInput,
  type UpdateActivityInput,
} from "@atria/types";
import { CurrentUser, Roles, type AuthUser } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { resourceUploadOptions } from "../common/uploads";
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

  @Post(":id/submissions/upload")
  @UseInterceptors(FileInterceptor("file", resourceUploadOptions))
  submitUpload(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("comment") comment: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException("No se ha recibido ningún fichero.");
    return this.activities.submitUpload(user, id, file, comment);
  }

  @Get(":id/debate")
  debate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.activities.debateThread(user, id);
  }

  @Post(":id/debate")
  postDebate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createDebatePostSchema)) body: CreateDebatePostInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activities.createDebatePost(user, id, body);
  }

  @Delete("debate/posts/:postId")
  removeDebatePost(@Param("postId") postId: string, @CurrentUser() user: AuthUser) {
    return this.activities.removeDebatePost(user, postId);
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
