// Horarios de las sesiones online de una unidad: la API devuelve un ISO (o null
// para las salas permanentes) y aquí se traduce a la etiqueta que ve el usuario.

/** Margen antes y después de la hora en el que la sesión se considera en curso. */
const LIVE_BEFORE_MS = 15 * 60_000;
const LIVE_AFTER_MS = 90 * 60_000;

export type SessionTone = "live" | "soon" | "upcoming" | "past" | "always";

export interface SessionSchedule {
  tone: SessionTone;
  /** "En curso", "Hoy · 17:00", "mar, 20 ago · 11:00" o "Sala permanente". */
  label: string;
}

const timeFmt = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" });

/** Días de calendario entre dos fechas, ignorando la hora. */
function daysApart(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((start - end) / 86_400_000);
}

export function sessionSchedule(startsAt: string | null, now = Date.now()): SessionSchedule {
  if (!startsAt) return { tone: "always", label: "Sala permanente" };
  const date = new Date(startsAt);
  const time = timeFmt.format(date);
  const ms = date.getTime() - now;
  if (ms <= LIVE_BEFORE_MS && ms > -LIVE_AFTER_MS) return { tone: "live", label: `En curso · ${time}` };
  if (ms < 0) return { tone: "past", label: `${dateFmt.format(date)} · ${time}` };
  const days = daysApart(date, new Date(now));
  if (days === 0) return { tone: "soon", label: `Hoy · ${time}` };
  if (days === 1) return { tone: "soon", label: `Mañana · ${time}` };
  return { tone: "upcoming", label: `${dateFmt.format(date)} · ${time}` };
}

/** Valor para un <input type="datetime-local">, en hora local. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Lo que escribe el input datetime-local (hora local) pasado a ISO para la API. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
