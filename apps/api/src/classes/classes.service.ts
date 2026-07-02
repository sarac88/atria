import { Injectable, NotFoundException } from "@nestjs/common";
import type { ClassInfo, CreateClassInput } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { toClassInfo } from "../common/mappers";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser): Promise<ClassInfo[]> {
    if (user.role === "admin") {
      const all = await this.prisma.class.findMany({ orderBy: { createdAt: "asc" } });
      return all.map(toClassInfo);
    }
    if (user.role === "docente") {
      const owned = await this.prisma.class.findMany({
        where: { ownerId: user.userId },
        orderBy: { createdAt: "asc" },
      });
      return owned.map(toClassInfo);
    }
    // alumno → clases en las que está matriculado
    const enrolled = await this.prisma.class.findMany({
      where: { enrollments: { some: { userId: user.userId } } },
      orderBy: { createdAt: "asc" },
    });
    return enrolled.map(toClassInfo);
  }

  async findOne(id: string): Promise<ClassInfo> {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException();
    return toClassInfo(cls);
  }

  async create(ownerId: string, input: CreateClassInput): Promise<ClassInfo> {
    const cls = await this.prisma.class.create({
      data: {
        name: input.name,
        code: input.code,
        room: input.room ?? "",
        subject: input.subject ?? "",
        color: input.color,
        icon: input.icon,
        desc: input.desc ?? "",
        status: "draft",
        ownerId,
        enrollments: { create: { userId: ownerId, roleInClass: "teacher" } },
      },
    });
    return toClassInfo(cls);
  }
}
