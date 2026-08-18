import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { User } from "@prisma/client";
import type { LoginInput, UserDto } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { toUserDto } from "../common/mappers";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateAndLogin(input: LoginInput): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException("Credenciales inválidas");
    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException("Credenciales inválidas");
    return this.issueSession(user);
  }

  async refresh(token?: string): Promise<IssuedTokens> {
    if (!token) throw new UnauthorizedException();
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException();
    const ok = await argon2.verify(user.hashedRefreshToken, token);
    if (!ok) throw new UnauthorizedException();
    return this.issueSession(user);
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { hashedRefreshToken: null },
      });
    } catch {
      /* token invalid/expired — nothing to revoke */
    }
  }

  /** Emite el par de tokens de un usuario ya verificado (login, refresh o alta por invitación). */
  async issueSession(user: User): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, email: user.email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? "7d" },
    );
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({ where: { id: user.id }, data: { hashedRefreshToken } });
    return { accessToken, refreshToken, user: toUserDto(user) };
  }
}
