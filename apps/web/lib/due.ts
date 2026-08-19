// Fechas límite de actividad. `Activity.due` es texto libre (lo escribe el
// docente en un <input type="date">, y los datos de ejemplo usan "12 / 10 / 2022"),
// así que se interpreta con tolerancia y se degrada a "Sin fecha" si no encaja.

import type { BadgeColor } from "./types";

const MS_DAY = 86_400_000;

/** Interpreta la fecha límite como fecha local, o null si no se reconoce el formato. */
export function parseDue(due: string | undefined): Date | null {
  const s = (due ?? "").trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) return valid(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const dmy = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(s);
  if (dmy) return valid(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  return null;
}

function valid(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null;
}

/** Días completos hasta la fecha (0 = hoy, 1 = mañana, negativo = ya vencida). */
export function daysUntil(date: Date, now = new Date()): number {
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / MS_DAY);
}

/** Etiqueta relativa del plazo, con el color de badge correspondiente. */
export function dueBadge(due: string | undefined, now = new Date()): { label: string; color: BadgeColor } {
  const date = parseDue(due);
  if (!date) return { label: "Sin fecha", color: "draft" };
  const d = daysUntil(date, now);
  if (d < -1) return { label: `Venció hace ${-d} días`, color: "error" };
  if (d === -1) return { label: "Venció ayer", color: "error" };
  if (d === 0) return { label: "Vence hoy", color: "error" };
  if (d === 1) return { label: "Vence mañana", color: "error" };
  if (d <= 7) return { label: `En ${d} días`, color: "warning" };
  return { label: `En ${d} días`, color: "info" };
}
