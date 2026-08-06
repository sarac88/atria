import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  addResourceSchema,
  createModuleSchema,
  updateModuleSchema,
  type AddResourceInput,
  type CreateModuleInput,
  type UpdateModuleInput,
} from "@atria/types";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { ClassMembershipGuard, JwtAuthGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { resourceUploadOptions } from "../common/uploads";
import { ModulesService } from "./modules.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Get("classes/:id/modules")
  @UseGuards(ClassMembershipGuard)
  list(@Param("id") id: string) {
    return this.modules.list(id);
  }

  @Post("classes/:id/modules")
  createModule(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createModuleSchema)) body: CreateModuleInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.createModule(user, id, body);
  }

  @Patch("modules/:id")
  updateModule(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateModuleSchema)) body: UpdateModuleInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.updateModule(user, id, body);
  }

  @Post("modules/:id/resources")
  addResource(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addResourceSchema)) body: AddResourceInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.addResource(user, id, body);
  }

  @Post("modules/:id/resources/upload")
  @UseInterceptors(FileInterceptor("file", resourceUploadOptions))
  uploadResource(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("label") label: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException("No se ha recibido ningún fichero.");
    return this.modules.uploadResource(user, id, file, label);
  }

  @Delete("resources/:id")
  deleteResource(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.modules.deleteResource(user, id);
  }
}
