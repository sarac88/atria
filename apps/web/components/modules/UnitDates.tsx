import { Icon } from "@/components/ui";

const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const dayYearFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

/** "YYYY-MM-DD" como fecha local (new Date("YYYY-MM-DD") sería medianoche UTC). */
function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "12 oct – 6 nov 2026", "Desde 12 oct 2026" o "Hasta 6 nov 2026"; "" sin fechas. */
export function unitDatesLabel(startsOn: string | null, endsOn: string | null): string {
  if (startsOn && endsOn) {
    const a = parseDay(startsOn);
    const b = parseDay(endsOn);
    const first = a.getFullYear() === b.getFullYear() ? dayFmt.format(a) : dayYearFmt.format(a);
    return `${first} – ${dayYearFmt.format(b)}`;
  }
  if (startsOn) return `Desde ${dayYearFmt.format(parseDay(startsOn))}`;
  if (endsOn) return `Hasta ${dayYearFmt.format(parseDay(endsOn))}`;
  return "";
}

/** Fechas informativas de la unidad, bajo su título. No pinta nada si no tiene. */
export function UnitDates({ startsOn, endsOn }: { startsOn: string | null; endsOn: string | null }) {
  const label = unitDatesLabel(startsOn, endsOn);
  if (!label) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
      <Icon name="calendar" size={14} />
      {label}
    </span>
  );
}
