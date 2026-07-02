import type { LoginInput, UserDto } from "@atria/types";
import { apiFetch } from "./client";

export const login = (body: LoginInput) =>
  apiFetch<UserDto>("/auth/login", { method: "POST", body: JSON.stringify(body) });

export const logout = () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });

export const getMe = () => apiFetch<UserDto>("/users/me");
