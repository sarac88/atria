import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AcceptInvitationInput,
  AcceptInvitationResultDto,
  ClassInvitationDto,
  InvitationPreviewDto,
  InviteStudentsResultDto,
} from "@atria/types";
import { apiFetch } from "./client";

export const getClassInvitations = (classId: string) =>
  apiFetch<ClassInvitationDto[]>(`/classes/${classId}/invitations`);

export const getInvitation = (token: string) =>
  apiFetch<InvitationPreviewDto>(`/invitations/${token}`);

export const acceptInvitation = (token: string, input: AcceptInvitationInput) =>
  apiFetch<AcceptInvitationResultDto>(`/invitations/${token}/accept`, {
    method: "POST",
    body: JSON.stringify(input),
  });

/** Invitaciones pendientes de una clase (sólo docente dueño o admin). */
export function useClassInvitations(classId: string) {
  return useQuery({
    queryKey: ["invitations", classId],
    queryFn: () => getClassInvitations(classId),
    enabled: !!classId,
  });
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token),
    enabled: !!token,
    retry: false,
  });
}

export function useInviteStudents(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) =>
      apiFetch<InviteStudentsResultDto>(`/classes/${classId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ emails }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["invitations", classId] }),
  });
}

export function useResendInvitation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ClassInvitationDto>(`/classes/${classId}/invitations/${id}/resend`, {
        method: "POST",
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["invitations", classId] }),
  });
}

export function useRevokeInvitation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/classes/${classId}/invitations/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["invitations", classId] }),
  });
}
