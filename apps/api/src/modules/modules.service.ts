import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AddResourceInput, CreateModuleInput, Module as ModuleDto } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { toModuleDto } from "../common/mappers";

const MODULE_INCLUDE = { resources: { orderBy: { createdAt: "asc" as const } } };

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
      data: { classId, title: input.title, position },
      include: MODULE_INCLUDE,
    });
    return toModuleDto(mod);
  }

  async addResource(user: AuthUser, moduleId: string, input: AddResourceInput): Promise<ModuleDto> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId }, select: { classId: true } });
    if (!mod) throw new NotFoundException();
    await this.assertClassOwner(user, mod.classId);
    await this.prisma.resource.create({
      data: { moduleId, type: input.type, label: input.label, meta: input.meta ?? "" },
    });
    const full = await this.prisma.module.findUniqueOrThrow({ where: { id: moduleId }, include: MODULE_INCLUDE });
    return toModuleDto(full);
  }
}
