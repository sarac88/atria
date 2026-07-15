import type { BadgeColor, SubmissionDto } from "./types";

/** Submission state → badge (label + color) for a student's view, or null when nothing has been submitted yet. */
export function studentTaskBadge(sub: SubmissionDto | null | undefined): { label: string; color: BadgeColor } | null {
  if (!sub) return null;
  if (sub.grade && sub.grade !== "—") return { label: `Nota ${sub.grade}`, color: "success" };
  return { label: sub.late ? "Entregado tarde" : "Entregado", color: "info" };
}
