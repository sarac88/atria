import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@atria/types";
import { CurrentUser, type AuthUser } from "../auth/decorators";
import { OptionalJwtAuthGuard } from "../auth/guards";
import { setAuthCookies } from "../common/cookies";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { InvitationsService } from "./invitations.service";

/** Rutas por token, abiertas desde el enlace de invitación: no exigen sesión previa. */
@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(":token")
  preview(@Param("token") token: string) {
    return this.invitations.preview(token);
  }

  @Post(":token/accept")
  @UseGuards(OptionalJwtAuthGuard)
  async accept(
    @Param("token") token: string,
    @Body(new ZodValidationPipe(acceptInvitationSchema)) body: AcceptInvitationInput,
    @CurrentUser() user: AuthUser | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { result, session } = await this.invitations.accept(token, body, user);
    // Un alumno recién registrado entra ya con sesión abierta.
    if (session) setAuthCookies(res, session.accessToken, session.refreshToken);
    return result;
  }
}
