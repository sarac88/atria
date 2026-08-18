import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { unlink } from "fs/promises";
import { extname, join } from "path";
import {
  detectMeetingProvider,
  type AddOnlineSessionInput,
  type AddResourceInput,
  type CreateModuleInput,
  type Module as ModuleDto,
  type UpdateModuleInput,
  type UpdateOnlineSessionInput,
  type UpdateResourceInput,
} from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { toModuleDto } from "../common/mappers";
import { humanSize, UPLOADS_DIR, uploadUrl } from "../common/uploads";

const MODULE_INCLUDE = {
  resources: { orderBy: { createdAt: "asc" as const } },
  // Postgres deja los NULL al final en ASC: primero las sesiones con horario y
  // luego las salas permanentes.
  sessions: { orderBy: [{ startsAt: "asc" as const }, { createdAt: "asc" as const }] },
};

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(classId: string): Promise<ModuleDto[]> {
    const modules = await this.prisma.module.findMany({
      where: { classId },
      orderBy: { position: "asc" },
      include: MODULE_INCLUDE,
    });
    return modules.map(toModuleDto);
  }

  private async assertClassOwner(user: AuthUser, classId: string): Promise<void> {
    const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { ownerId: true } });
    if (!cls) throw new NotFoundException();
    if (user.role !== "admin" && cls.ownerId !== user.userId) throw new ForbiddenException();
  }

  async createModule(user: AuthUser, classId: string, input: CreateModuleInput): Promise<ModuleDto> {
    await this.assertClassOwner(user, classId);
    const position = await this.prisma.module.count({ where: { classId } });
    const mod = await this.prisma.module.create({
      data: { classId, title: input.title, description: input.description ?? "", position },
      include: MODULE_INCLUDE,
    });
    return toModuleDto(mod);
  }

  /** Renombra la unidad y/o actualiza su descripción. */
  async updateModule(user: AuthUser, moduleId: string, input: UpdateModuleInput): Promise<ModuleDto> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId }, select: { classId: true } });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);
    await this.prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
    return this.moduleDto(moduleId);
  }

  /**
   * Borra la unidad. Los recursos caen por cascada (limpiamos sus ficheros a mano)
   * y las actividades se quedan sin unidad, no se borran.
   */
  async deleteModule(user: AuthUser, moduleId: string): Promise<{ id: string }> {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
      select: { classId: true, resources: { select: { fileId: true, file: { select: { key: true } } } } },
    });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);

    const files = mod.resources.flatMap((r) => (r.fileId ? [{ id: r.fileId, key: r.file?.key }] : []));
    await this.prisma.module.delete({ where: { id: moduleId } });
    for (const f of files) {
      await this.prisma.file.delete({ where: { id: f.id } }).catch(() => undefined);
      if (f.key) await unlink(join(UPLOADS_DIR, f.key)).catch(() => undefined);
    }

    return { id: moduleId };
  }

  async addResource(user: AuthUser, moduleId: string, input: AddResourceInput): Promise<ModuleDto> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId }, select: { classId: true } });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);
    await this.prisma.resource.create({
      data: { moduleId, type: input.type, label: input.label, meta: input.meta ?? "", url: input.url ?? "" },
    });
    return this.moduleDto(moduleId);
  }

  /** Sube un fichero (PDF/DOC/DOCX), lo registra como File y crea el recurso enlazado. */
  async uploadResource(
    user: AuthUser,
    moduleId: string,
    file: Express.Multer.File,
    label?: string,
  ): Promise<ModuleDto> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId }, select: { classId: true } });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);

    const ext = extname(file.originalname).replace(".", "").toUpperCase();
    const saved = await this.prisma.file.create({
      data: { ownerId: user.userId, key: file.filename, name: file.originalname, size: file.size, mime: file.mimetype },
    });
    await this.prisma.resource.create({
      data: {
        moduleId,
        type: "document-text",
        label: (label ?? "").trim() || file.originalname,
        meta: `${ext} · ${humanSize(file.size)}`,
        url: uploadUrl(saved.key),
        fileId: saved.id,
      },
    });
    return this.moduleDto(moduleId);
  }

  /**
   * Renombra el recurso y, en los enlaces, permite corregir la URL.
   * En los ficheros subidos la URL la manda el fichero, así que se ignora.
   */
  async updateResource(user: AuthUser, resourceId: string, input: UpdateResourceInput): Promise<ModuleDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: { moduleId: true, fileId: true, module: { select: { classId: true } } },
    });
    if (!resource) throw new NotFoundException();
    await this.assertClassOwner(user, resource.module.classId);

    const url = resource.fileId ? undefined : input.url;
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(url !== undefined ? { url } : {}),
      },
    });
    return this.moduleDto(resource.moduleId);
  }

  async deleteResource(user: AuthUser, resourceId: string): Promise<ModuleDto> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { module: { select: { classId: true } }, file: { select: { id: true, key: true } } },
    });
    if (!resource) throw new NotFoundException();
    await this.assertClassOwner(user, resource.module.classId);

    const moduleId = resource.moduleId;
    const fileKey = resource.file?.key;

    await this.prisma.resource.delete({ where: { id: resourceId } });
    if (resource.fileId) {
      await this.prisma.file.delete({ where: { id: resource.fileId } }).catch(() => undefined);
      if (fileKey) {
        await unlink(join(UPLOADS_DIR, fileKey)).catch(() => undefined);
      }
    }

    return this.moduleDto(moduleId);
  }

  async addSession(user: AuthUser, moduleId: string, input: AddOnlineSessionInput): Promise<ModuleDto> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId }, select: { classId: true } });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);
    await this.prisma.onlineSession.create({
      data: {
        moduleId,
        label: input.label,
        url: input.url,
        provider: detectMeetingProvider(input.url),
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
      },
    });
    return this.moduleDto(moduleId);
  }

  /** Al cambiar la URL se recalcula la plataforma, que es derivada. */
  async updateSession(user: AuthUser, sessionId: string, input: UpdateOnlineSessionInput): Promise<ModuleDto> {
    const session = await this.prisma.onlineSession.findUnique({
      where: { id: sessionId },
      select: { moduleId: true, module: { select: { classId: true } } },
    });
    if (!session) throw new NotFoundException();
    await this.assertClassOwner(user, session.module.classId);
    await this.prisma.onlineSession.update({
      where: { id: sessionId },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.url !== undefined ? { url: input.url, provider: detectMeetingProvider(input.url) } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt ? new Date(input.startsAt) : null } : {}),
      },
    });
    return this.moduleDto(session.moduleId);
  }

  async deleteSession(user: AuthUser, sessionId: string): Promise<ModuleDto> {
    const session = await this.prisma.onlineSession.findUnique({
      where: { id: sessionId },
      select: { moduleId: true, module: { select: { classId: true } } },
    });
    if (!session) throw new NotFoundException();
    await this.assertClassOwner(user, session.module.classId);
    await this.prisma.onlineSession.delete({ where: { id: sessionId } });
    return this.moduleDto(session.moduleId);
  }

  private async moduleDto(moduleId: string): Promise<ModuleDto> {
    const full = await this.prisma.module.findUniqueOrThrow({ where: { id: moduleId }, include: MODULE_INCLUDE });
    return toModuleDto(full);
  }
}
