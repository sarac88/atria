import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClassInfo, CreateClassInput, UpdateClassInput } from "@atria/types";
import { apiFetch } from "./client";

export const getClasses = () => apiFetch<ClassInfo[]>("/classes");
export const getClass = (id: string) => apiFetch<ClassInfo>(`/classes/${id}`);

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: getClasses });
}

export function useClass(id: string) {
  return useQuery({ queryKey: ["classes", id], queryFn: () => getClass(id), enabled: !!id });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassInput) =>
      apiFetch<ClassInfo>("/classes", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClassInput) =>
      apiFetch<ClassInfo>(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["classes"] });
      void qc.invalidateQueries({ queryKey: ["classes", id] });
    },
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/classes/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}
