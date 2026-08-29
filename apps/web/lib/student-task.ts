import type { BadgeColor, SubmissionDto } from "./types";

/** True when the student has actually submitted (not the placeholder "Pendiente" row). */
export function isDelivered(sub: SubmissionDto | null | undefined): sub is SubmissionDto {
  return !!sub && sub.status !== "Pendiente";
}

/** Submission state → badge (label + color) for a student's view, or null when nothing has been submitted yet. */
export function studentTaskBadge(sub: SubmissionDto | null | undefined): { label: string; color: BadgeColor } | null {
  if (!isDelivered(sub)) return null;
  if (sub.grade && sub.grade !== "—") return { label: `Nota ${sub.grade}`, color: "success" };
  return { label: sub.late ? "Entregado tarde" : "Entregado", color: "info" };
}
