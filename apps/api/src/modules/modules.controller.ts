import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  addOnlineSessionSchema,
  addResourceSchema,
  createModuleSchema,
  updateModuleSchema,
  updateOnlineSessionSchema,
  updateResourceSchema,
  type AddOnlineSessionInput,
  type AddResourceInput,
  type CreateModuleInput,
  type UpdateModuleInput,
  type UpdateOnlineSessionInput,
  type UpdateResourceInput,
} from "@atria/types";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { ClassMembershipGuard, JwtAuthGuard } from "../auth/guards";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { resourceUploadOptions } from "../common/uploads";
import { ModulesService } from "./modules.service";
import { LinkPreviewService } from "./link-preview.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(
    private readonly modules: ModulesService,
    private readonly linkPreviews: LinkPreviewService,
  ) {}

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

  @Delete("modules/:id")
  deleteModule(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.modules.deleteModule(user, id);
  }

  /** Portada (og:image) de un enlace, para la miniatura de la card. */
  @Get("link-preview")
  linkPreview(@Query("url") url: string) {
    return this.linkPreviews.image(url ?? "");
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

  @Patch("resources/:id")
  updateResource(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateResourceSchema)) body: UpdateResourceInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.updateResource(user, id, body);
  }

  @Delete("resources/:id")
  deleteResource(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.modules.deleteResource(user, id);
  }

  @Post("modules/:id/sessions")
  addSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addOnlineSessionSchema)) body: AddOnlineSessionInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.addSession(user, id, body);
  }

  @Patch("sessions/:id")
  updateSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOnlineSessionSchema)) body: UpdateOnlineSessionInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.modules.updateSession(user, id, body);
  }

  @Delete("sessions/:id")
  deleteSession(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.modules.deleteSession(user, id);
  }
}
