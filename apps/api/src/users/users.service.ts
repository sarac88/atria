import { Injectable, NotFoundException } from "@nestjs/common";
import type { UserDto } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { toUserDto } from "../common/mappers";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return toUserDto(user);
  }
}
