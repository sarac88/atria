import { useQuery } from "@tanstack/react-query";
import type { CalendarEventDto } from "@atria/types";
import { apiFetch } from "./client";

export function useCalendarEvents() {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: () => apiFetch<CalendarEventDto[]>("/calendar"),
  });
}
