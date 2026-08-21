import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClassChatDto, ConversationDto, MessageDto } from "@atria/types";
import { apiFetch } from "./client";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<ConversationDto[]>("/conversations"),
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => apiFetch<MessageDto[]>(`/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
  });
}

/** Hilos 1:1 del chat de la clase: todos los alumnos (docente) o el docente (alumno). */
export function useClassChat(classId?: string) {
  return useQuery({
    queryKey: ["classChat", classId],
    queryFn: () => apiFetch<ClassChatDto>(`/conversations/class/${classId}`),
    enabled: !!classId,
  });
}

/** Crea el hilo la primera vez que se escribe; después devuelve el existente. */
export function useOpenClassThread(classId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (withUserId?: string) =>
      apiFetch<{ conversationId: string }>(`/conversations/class/${classId}/open`, {
        method: "POST",
        body: JSON.stringify(withUserId ? { withUserId } : {}),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["classChat", classId] }),
  });
}
