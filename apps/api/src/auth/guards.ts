import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import type { Role } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { ROLES_KEY, type AuthUser } from "./decorators";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

/**
 * Resuelve la sesión si hay cookie válida, pero deja pasar a los anónimos.
 * Lo usan las rutas por token (invitaciones), que sirven tanto a un alumno ya
 * identificado como a alguien que todavía no tiene cuenta.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<T>(_err: unknown, user: T): T | undefined {
    return user || undefined;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    return !!user && roles.includes(user.role);
  }
}

/** Authorises access to a class by ownership or enrollment (doc §8). */
@Injectable()
export class ClassMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    const classId: string = req.params.id;
    if (!user) return false;
    if (user.role === "admin") return true;

    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { ownerId: true },
    });
    if (cls?.ownerId === user.userId) return true;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_classId: { userId: user.userId, classId } },
    });
    if (enrollment) return true;

    throw new ForbiddenException();
  }
}
