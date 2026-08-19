// `Activity.dueAt` es texto libre: lo escribe el docente en un <input type="date">
// ("2026-09-04") y los datos de ejemplo usan "12 / 10 / 2022". Hasta que se
// normalice a una columna de fecha, se interpreta con tolerancia.

/** Interpreta la fecha límite como fecha local, o null si no se reconoce el formato. */
export function parseDueAt(dueAt: string | null | undefined): Date | null {
  const s = (dueAt ?? "").trim();
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

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha local como YYYY-MM-DD (no usar toISOString: desplaza por zona horaria). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Hora local como HH:MM. */
export function toTimeLabel(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
