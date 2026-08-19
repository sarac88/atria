import { useQuery } from "@tanstack/react-query";
import type { AdminUserDto } from "@atria/types";
import { apiFetch } from "./client";

/** Listado completo de usuarios; solo responde a administración. */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => apiFetch<AdminUserDto[]>("/users"),
  });
}
