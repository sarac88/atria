import type { Response } from "express";

const secure = () => process.env.COOKIE_SECURE === "true";
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15m
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d
const REFRESH_PATH = "/api/v1/auth";

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("atria_access", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie("atria_refresh", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("atria_access", { path: "/" });
  res.clearCookie("atria_refresh", { path: REFRESH_PATH });
}
