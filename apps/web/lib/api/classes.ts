import { useQuery } from "@tanstack/react-query";
import type { ClassInfo } from "@atria/types";
import { apiFetch } from "./client";

export const getClasses = () => apiFetch<ClassInfo[]>("/classes");
export const getClass = (id: string) => apiFetch<ClassInfo>(`/classes/${id}`);

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: getClasses });
}

export function useClass(id: string) {
  return useQuery({ queryKey: ["classes", id], queryFn: () => getClass(id), enabled: !!id });
}
