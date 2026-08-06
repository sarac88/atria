import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Activity,
  AddResourceInput,
  CreateActivityInput,
  CreateModuleInput,
  DebatePostDto,
  DebateThreadDto,
  GradebookDto,
  Module,
  Student,
  StudentTaskDto,
  SubmissionDto,
  UpdateActivityInput,
} from "@atria/types";
import { apiFetch } from "./client";

export function useActivities(classId: string) {
  return useQuery({
    queryKey: ["activities", classId],
    queryFn: () => apiFetch<Activity[]>(`/classes/${classId}/activities`),
    enabled: !!classId,
  });
}

export function useSubmissions(activityId?: string) {
  return useQuery({
    queryKey: ["submissions", activityId],
    queryFn: () => apiFetch<SubmissionDto[]>(`/activities/${activityId}/submissions`),
    enabled: !!activityId,
  });
}

export function useGradebook(classId: string) {
  return useQuery({
    queryKey: ["gradebook", classId],
    queryFn: () => apiFetch<GradebookDto>(`/classes/${classId}/gradebook`),
    enabled: !!classId,
  });
}

export function useMyGrades(classId: string) {
  return useQuery({
    queryKey: ["myGrades", classId],
    queryFn: () => apiFetch<SubmissionDto[]>(`/classes/${classId}/my-submissions`),
    enabled: !!classId,
  });
}

export function useStudentTasks() {
  return useQuery({
    queryKey: ["studentTasks"],
    queryFn: () => apiFetch<StudentTaskDto[]>(`/classes/student/tasks`),
  });
}

export function useGradeSubmission(activityId?: string, classId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; score: number; feedback?: string }) =>
      apiFetch<SubmissionDto>(`/submissions/${v.id}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ score: v.score, feedback: v.feedback }),
      }),
    onSuccess: () => {
      if (activityId) void qc.invalidateQueries({ queryKey: ["submissions", activityId] });
      if (classId) {
        void qc.invalidateQueries({ queryKey: ["gradebook", classId] });
        void qc.invalidateQueries({ queryKey: ["activities", classId] });
      }
    },
  });
}

export function useSubmitWork(classId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { activityId: string; file?: File; fileName?: string; comment?: string; answers?: Record<string, string> }) => {
      if (v.file) {
        const form = new FormData();
        form.append("file", v.file);
        if (v.comment) form.append("comment", v.comment);
        return apiFetch<SubmissionDto>(`/activities/${v.activityId}/submissions/upload`, { method: "POST", body: form });
      }
      return apiFetch<SubmissionDto>(`/activities/${v.activityId}/submissions`, {
        method: "POST",
        body: JSON.stringify({ fileName: v.fileName, comment: v.comment, answers: v.answers }),
      });
    },
    onSuccess: (_data, v) => {
      void qc.invalidateQueries({ queryKey: ["submissions", v.activityId] });
      void qc.invalidateQueries({ queryKey: ["studentTasks"] });
      if (classId) void qc.invalidateQueries({ queryKey: ["myGrades", classId] });
    },
  });
}

export function useDebateThread(activityId?: string) {
  return useQuery({
    queryKey: ["debate", activityId],
    queryFn: () => apiFetch<DebateThreadDto>(`/activities/${activityId}/debate`),
    enabled: !!activityId,
  });
}

export function useCreateDebatePost(activityId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { body: string; parentId?: string }) =>
      apiFetch<DebatePostDto>(`/activities/${activityId}/debate`, { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["debate", activityId] });
      // La primera intervención cuenta como entrega: refresca la tabla del docente.
      void qc.invalidateQueries({ queryKey: ["submissions", activityId] });
    },
  });
}

export function useDeleteDebatePost(activityId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiFetch<{ id: string }>(`/activities/debate/posts/${postId}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["debate", activityId] }),
  });
}

export function useModules(classId: string) {
  return useQuery({
    queryKey: ["modules", classId],
    queryFn: () => apiFetch<Module[]>(`/classes/${classId}/modules`),
    enabled: !!classId,
  });
}

export function useRoster(classId: string) {
  return useQuery({
    queryKey: ["roster", classId],
    queryFn: () => apiFetch<Student[]>(`/classes/${classId}/roster`),
    enabled: !!classId,
  });
}

export function useCreateActivity(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) =>
      apiFetch<Activity>(`/classes/${classId}/activities`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["activities", classId] }),
  });
}

export function useUpdateActivity(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string } & UpdateActivityInput) => {
      const { id, ...body } = v;
      return apiFetch<Activity>(`/activities/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["activities", classId] });
      void qc.invalidateQueries({ queryKey: ["modules", classId] });
    },
  });
}

export function useDeleteActivity(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiFetch<{ id: string }>(`/activities/${activityId}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["activities", classId] });
      void qc.invalidateQueries({ queryKey: ["modules", classId] });
    },
  });
}

export function useCreateModule(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateModuleInput) =>
      apiFetch<Module>(`/classes/${classId}/modules`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["modules", classId] }),
  });
}

export function useAddResource(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { moduleId: string } & AddResourceInput) =>
      apiFetch<Module>(`/modules/${v.moduleId}/resources`, {
        method: "POST",
        body: JSON.stringify({ type: v.type, label: v.label, meta: v.meta, url: v.url }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["modules", classId] }),
  });
}

export function useUploadResource(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { moduleId: string; file: File; label?: string }) => {
      const form = new FormData();
      form.append("file", v.file);
      if (v.label) form.append("label", v.label);
      return apiFetch<Module>(`/modules/${v.moduleId}/resources/upload`, { method: "POST", body: form });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["modules", classId] }),
  });
}

export function useDeleteResource(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) =>
      apiFetch<Module>(`/resources/${resourceId}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["modules", classId] }),
  });
}
