import { useQuery } from "@tanstack/react-query";
import type { ConversationDto, MessageDto } from "@atria/types";
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
