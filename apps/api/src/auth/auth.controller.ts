import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { loginSchema, type LoginInput } from "@atria/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { clearAuthCookies, setAuthCookies } from "../common/cookies";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.auth.validateAndLogin(body);
    setAuthCookies(res, accessToken, refreshToken);
    return user;
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.refresh(
      req.cookies?.["atria_refresh"],
    );
    setAuthCookies(res, accessToken, refreshToken);
    return user;
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.["atria_refresh"]);
    clearAuthCookies(res);
    return { ok: true };
  }
}
