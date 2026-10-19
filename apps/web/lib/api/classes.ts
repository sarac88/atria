import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClassInfo, CreateClassInput, OverviewSessionDto, TeacherOverviewDto, UpdateClassInput } from "@atria/types";
import { apiFetch } from "./client";

export const getClasses = () => apiFetch<ClassInfo[]>("/classes");
export const getClass = (id: string) => apiFetch<ClassInfo>(`/classes/${id}`);

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: getClasses });
}

export function useClass(id: string) {
  return useQuery({ queryKey: ["classes", id], queryFn: () => getClass(id), enabled: !!id });
}

/** Próximas videollamadas de las clases del usuario, para el tablero de inicio. */
export function useUpcomingSessions() {
  return useQuery({ queryKey: ["classes", "upcoming-sessions"], queryFn: () => apiFetch<OverviewSessionDto[]>("/classes/sessions/upcoming") });
}

/** Panel de inicio del docente. Cuelga de ["classes"] para refrescarse con cualquier cambio de clase o nota. */
export function useTeacherOverview() {
  return useQuery({ queryKey: ["classes", "teacher-overview"], queryFn: () => apiFetch<TeacherOverviewDto>("/classes/teacher/overview") });
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

export function useUploadClassCover(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<ClassInfo>(`/classes/${id}/cover`, { method: "POST", body: form });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["classes"] });
      void qc.invalidateQueries({ queryKey: ["classes", id] });
    },
  });
}

export function useClearClassCover(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<ClassInfo>(`/classes/${id}/cover`, { method: "DELETE" }),
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
