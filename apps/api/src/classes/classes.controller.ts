import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createClassSchema, type CreateClassInput } from "@atria/types";
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

  @Get(":id")
  @UseGuards(ClassMembershipGuard)
  findOne(@Param("id") id: string) {
    return this.classes.findOne(id);
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
}
