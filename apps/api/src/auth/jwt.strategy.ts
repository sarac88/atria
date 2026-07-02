import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { Role } from "@atria/types";

const fromCookie = (req: Request): string | null =>
  (req?.cookies?.["atria_access"] as string | undefined) ?? null;

interface AccessPayload {
  sub: string;
  role: Role;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
      ignoreExpiration: false,
    });
  }

  validate(payload: AccessPayload) {
    return { userId: payload.sub, role: payload.role, email: payload.email };
  }
}
