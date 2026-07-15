import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createActivitySchema, createClassSchema, updateClassSchema, type CreateActivityInput, type CreateClassInput, type UpdateClassInput } from "@atria/types";
import { CurrentUser, Roles, type AuthUser } from "../auth/decorators";
import { ClassMembershipGuard, JwtAuthGuard, RolesGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ClassesService } from "./classes.service";

@Controller("classes")
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.classes.findAll(user);
  }

  @Get("student/tasks")
  studentTasks(@CurrentUser() user: AuthUser) {
    return this.classes.studentTasks(user);
  }

  @Get(":id")
  @UseGuards(ClassMembershipGuard)
  findOne(@Param("id") id: string) {
    return this.classes.findOne(id);
  }

  @Get(":id/activities")
  @UseGuards(ClassMembershipGuard)
  activities(@Param("id") id: string) {
    return this.classes.listActivities(id);
  }

  @Get(":id/gradebook")
  @UseGuards(ClassMembershipGuard)
  gradebook(@Param("id") id: string) {
    return this.classes.gradebook(id);
  }

  @Get(":id/roster")
  @UseGuards(ClassMembershipGuard)
  roster(@Param("id") id: string) {
    return this.classes.roster(id);
  }

  @Get(":id/my-submissions")
  @UseGuards(ClassMembershipGuard)
  mySubmissions(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.classes.mySubmissions(id, user.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("docente")
  create(
    @Body(new ZodValidationPipe(createClassSchema)) body: CreateClassInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classes.create(user.userId, body);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateClassSchema)) body: UpdateClassInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classes.update(user, id, body);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.classes.remove(user, id);
  }

  @Post(":id/activities")
  @UseGuards(RolesGuard)
  @Roles("docente", "admin")
  createActivity(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createActivitySchema)) body: CreateActivityInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classes.createActivity(user, id, body);
  }
}
