import { Injectable, NotFoundException } from "@nestjs/common";
import type { AdminUserDto, UserDto } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { formatDate, toUserDto } from "../common/mappers";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return toUserDto(user);
  }

  /** GET /users — listado para el panel de administración, de alta más reciente a más antigua. */
  async listAll(): Promise<AdminUserDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true } } },
    });
    return users.map((u) => ({
      ...toUserDto(u),
      joined: formatDate(u.createdAt),
      createdAt: u.createdAt.toISOString(),
      classes: u._count.enrollments,
    }));
  }
}
