import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Activity, GradebookDto, SubmissionDto } from "@atria/types";
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
      if (classId) void qc.invalidateQueries({ queryKey: ["gradebook", classId] });
    },
  });
}

export function useSubmitWork(classId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { activityId: string; fileName?: string }) =>
      apiFetch<SubmissionDto>(`/activities/${v.activityId}/submissions`, {
        method: "POST",
        body: JSON.stringify({ fileName: v.fileName }),
      }),
    onSuccess: (_data, v) => {
      void qc.invalidateQueries({ queryKey: ["submissions", v.activityId] });
      if (classId) void qc.invalidateQueries({ queryKey: ["myGrades", classId] });
    },
  });
}
