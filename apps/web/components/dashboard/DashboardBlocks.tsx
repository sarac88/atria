"use client";

// Bloques comunes de los tableros de inicio del docente y del alumno.

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, Avatar } from "@/components/ui";
import { EmptyState } from "@/components/layout";
import { MEETING_BRAND } from "@/components/icons/brand-glyphs";
import { useRouter } from "next/navigation";
import { resourceUrl } from "@/lib/api/client";
import { classHeaderTheme } from "@/lib/class-thumbs";
import { sessionSchedule } from "@/lib/online-sessions";
import type { CalendarEventDto, CalendarKind, OverviewSessionDto } from "@/lib/types";

// Mismos colores por tipo que el calendario: azul entregas, rojo sesiones, amarillo exámenes.
const KIND_META: Partial<Record<CalendarKind, { label: string; icon: string; color: string; tint: string }>> = {
  sesion: { label: "Videollamada", icon: "video-camera", color: "var(--event-sesion)", tint: "var(--event-sesion-soft)" },
  entrega: { label: "Entrega", icon: "document-text", color: "var(--event-entrega)", tint: "var(--event-entrega-soft)" },
  examen: { label: "Examen", icon: "clipboard-check", color: "var(--event-examen)", tint: "var(--event-examen-soft)" },
};

export const DASH_GAP = "calc(20px * var(--d,1))";

export const card: CSSProperties = {
  background: "var(--surface-card)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--ring-hairline), var(--shadow-md)",
};

export const ellipsis: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const pad = (n: number) => String(n).padStart(2, "0");
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayFmt = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric" });
const monthNameFmt = new Intl.DateTimeFormat("es-ES", { month: "long" });

/** «2 – 8 de noviembre» o «30 de noviembre – 6 de diciembre»; el año solo si no es el actual. */
function weekRangeLabel(monday: Date, sunday: Date, currentYear: number) {
  const startMonth = monthNameFmt.format(monday);
  const endMonth = monthNameFmt.format(sunday);
  const year = monday.getFullYear() !== currentYear || sunday.getFullYear() !== currentYear ? ` de ${sunday.getFullYear()}` : "";
  const start = startMonth === endMonth ? `${monday.getDate()}` : `${monday.getDate()} de ${startMonth}`;
  return `${start} – ${sunday.getDate()} de ${endMonth}${year}`;
}

export function SectionHead({ title, aside, action }: { title: ReactNode; aside?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px", minWidth: 0 }}>
        <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>{title}</h3>
        {aside ?? null}
      </div>
      {action ?? null}
    </div>
  );
}

/** Avatares solapados con un "+N" al final, como en las tarjetas de videollamada. */
function AvatarStack({ people, max = 3, onInverse = false }: { people: { id: string; name: string; avatarUrl: string | null }[]; max?: number; onInverse?: boolean }) {
  if (!people.length) return null;
  const extra = people.length - max;
  // Sobre el azul el aro imita el fondo; sobre el gris va blanco, que es como se ven mejor.
  const ring = onInverse ? "var(--surface-feature)" : "var(--surface-card)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {people.slice(0, max).map((p, i) => (
        <Avatar key={p.id} name={p.name} src={p.avatarUrl ? resourceUrl(p.avatarUrl) : undefined} size={28} style={{ marginLeft: i ? -8 : 0, boxShadow: `0 0 0 2px ${ring}` }} />
      ))}
      {extra > 0 ? <span style={{ fontSize: 12, fontWeight: 700, color: onInverse ? "rgba(255,255,255,.72)" : "var(--text-muted)", marginLeft: 6 }}>+{extra}</span> : null}
    </span>
  );
}

const WEEK_COLUMN_MIN = 100;
const WEEK_COLUMN_GAP = 8;

/** Semana de lunes a domingo, con flechas para cambiarla: una columna por día con sus videollamadas, entregas y exámenes. */
export function WeekSchedule({ events, onOpenEvent, onCalendar }: { events: CalendarEventDto[]; onOpenEvent: (e: CalendarEventDto) => void; onCalendar: () => void }) {
  // Semanas de distancia respecto a la actual: 0 es esta, -1 la anterior, 1 la siguiente.
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLDivElement>(null);

  const { days, range } = useMemo(() => {
    const today = new Date();
    const todayKey = localKey(today);
    // getDay() empieza en domingo (0); así el lunes queda como primer día.
    const mondayDate = today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7;
    const dateAt = (i: number) => new Date(today.getFullYear(), today.getMonth(), mondayDate + i);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = dateAt(i);
      const key = localKey(d);
      const items = events.filter((e) => e.date === key && KIND_META[e.kind]);
      // Agrupa por asignatura (o por clase si no tiene), en el orden en que aparecen.
      const groups = new Map<string, { title: string; ink: string; items: CalendarEventDto[] }>();
      for (const e of items) {
        const title = e.classSubject || e.className;
        const g = groups.get(title) ?? { title, ink: classHeaderTheme(e.classThumb, e.classColor).ink, items: [] };
        g.items.push(e);
        groups.set(title, g);
      }
      return { key, isToday: key === todayKey, label: dayFmt.format(d), groups: [...groups.values()] };
    });
    return { days, range: weekRangeLabel(dateAt(0), dateAt(6), today.getFullYear()) };
  }, [events, weekOffset]);
  const empty = days.every((d) => !d.groups.length);

  // En pantallas estrechas la rejilla hace scroll: se centra el día de hoy para que no quede fuera,
  // y en cualquier otra semana se vuelve al lunes.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const column = todayColumnRef.current?.getBoundingClientRect();
    scroller.scrollLeft = column ? scroller.scrollLeft + column.left - scroller.getBoundingClientRect().left - (scroller.clientWidth - column.width) / 2 : 0;
  }, [weekOffset]);

  const weekNav = (
    // Las flechas van antes de la fecha para no moverse de sitio cuando cambia el ancho del texto.
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {([["arrow-left", "Semana anterior", -1], ["arrow-right", "Semana siguiente", 1]] as [string, string, number][]).map(([icon, label, delta]) => (
          <button
            key={icon}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => setWeekOffset((w) => w + delta)}
            style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-default)", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", color: "var(--text-strong)", cursor: "pointer", transition: "background .15s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--state-hover-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
          >
            <Icon name={icon} size={15} />
          </button>
        ))}
      </div>
      <span aria-live="polite" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>{range}</span>
    </div>
  );

  return (
    <section style={{ ...card, padding: 20 }}>
      <SectionHead title="Mi semana" aside={weekNav} action={<Button variant="link" size="small" onClick={onCalendar}>Ver calendario</Button>} />
      <div ref={scrollerRef} style={{ overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(7, minmax(${WEEK_COLUMN_MIN}px, 1fr))`, gap: WEEK_COLUMN_GAP, minWidth: 7 * WEEK_COLUMN_MIN + 6 * WEEK_COLUMN_GAP }}>
          {days.map((d) => (
            <div key={d.key} ref={d.isToday ? todayColumnRef : undefined} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8, minWidth: 0 }}>
              <span
                aria-current={d.isToday ? "date" : undefined}
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 0",
                  borderRadius: "var(--radius-md)",
                  textTransform: "capitalize",
                  background: d.isToday ? "var(--surface-inverse)" : "var(--surface-sunken)",
                  color: d.isToday ? "var(--text-on-inverse, #fff)" : "var(--text-muted)",
                }}
              >
                {d.label}
              </span>
              <div style={{ position: "relative", minHeight: 260, display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: `1.5px dashed ${d.isToday ? "var(--text-strong)" : "var(--border-strong)"}`, opacity: d.isToday ? 0.5 : 0.6 }} />
                {d.groups.map((g) => (
                  <div key={g.title} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    {/* Título de la asignatura, con fondo para tapar la línea discontinua. */}
                    <span
                      title={g.title}
                      style={{ alignSelf: "center", maxWidth: "100%", boxSizing: "border-box", display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 6px", background: "var(--surface-card)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)" }}
                    >
                      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: g.ink }} />
                      <span style={ellipsis}>{g.title}</span>
                    </span>
                    {g.items.map((e) => {
                      const meta = KIND_META[e.kind]!;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => onOpenEvent(e)}
                          title={`${e.title} · ${e.className}`}
                          style={{
                            position: "relative",
                            textAlign: "left",
                            cursor: "pointer",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            background: meta.tint,
                            padding: "7px 8px",
                            fontFamily: "var(--font-sans)",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 7,
                            minWidth: 0,
                          }}
                        >
                          {/* Hora a un lado, con el icono del tipo debajo; los de todo el día solo llevan el icono. */}
                          <span style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: e.time ? 32 : 0, paddingTop: 1 }}>
                            {e.time ? <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{e.time}</span> : null}
                            <Icon name={meta.icon} size={13} color={meta.color} />
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                            {/* Hasta dos líneas de título antes de recortar. */}
                            <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, color: "var(--text-strong)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{e.title}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", ...ellipsis }}>{e.time ? meta.label : `${meta.label} · todo el día`}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {empty ? <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>Nada programado esta semana.</p> : null}
    </section>
  );
}

export function SessionItem({ s, featured }: { s: OverviewSessionDto; featured: boolean }) {
  const schedule = sessionSchedule(s.startsAt);
  const live = schedule.tone === "live";
  const brand = MEETING_BRAND[s.provider];
  const open = () => window.open(s.url, "_blank", "noopener,noreferrer");
  // La próxima llamada va sobre azul primario para destacar, así que sus textos se invierten.
  // Las demás bajan de tono: fondo azul muy claro y título en azul apagado, no en negro.
  const ink = featured ? "var(--text-on-inverse, #fff)" : "var(--primary-400)";
  const inkSoft = featured ? "rgba(255,255,255,.72)" : "var(--text-muted)";
  return (
    <div style={{ borderRadius: "var(--radius-lg)", padding: 14, background: featured ? "var(--surface-feature)" : "var(--surface-tint-blue-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            // Sin círculo: la campana va suelta, amarilla sobre el azul de la destacada
            // y del mismo azul apagado que el título en las demás.
            color: featured ? "var(--brand-accent)" : "var(--primary-400)",
          }}
        >
          <Icon name="bell" size={28} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: ink, ...ellipsis }}>{s.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: live ? (featured ? "var(--success-300)" : "var(--status-success)") : inkSoft, marginTop: 2, fontWeight: live ? 700 : 400 }}>
            <Icon name="clock" size={13} />
            <span style={ellipsis}>{schedule.label} · {s.className}</span>
          </div>
        </div>
        {featured ? null : <AvatarStack people={s.students} />}
      </div>
      {featured ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
          <AvatarStack people={s.students} onInverse />
          {/* Amarillo claro: el de marca pesa demasiado sobre el azul, y «outline» se perdería.
              Al pasar el ratón sube al amarillo de marca, en vez del oscurecido que trae el botón. */}
          <Button
            size="small"
            variant="accent"
            style={{ background: "var(--yellow-400)" }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--brand-accent)")}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = "var(--yellow-400)"; ev.currentTarget.style.transform = "none"; }}
            iconLeft={brand ? <span style={{ display: "inline-flex" }}>{brand.glyph(16)}</span> : <Icon name="video-camera" size={16} />}
            onClick={open}
          >
            Entrar a la clase
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * «Próximas videollamadas» en la columna lateral. Con `atria-fitrow atria-dash-calls`
 * ocupa las dos primeras filas de la rejilla sin estirarlas y hace scroll si no cabe.
 */
export function UpcomingSessionsCard({ sessions }: { sessions: OverviewSessionDto[] }) {
  const router = useRouter();
  return (
    <section className="atria-fitrow atria-dash-calls" style={{ ...card, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <SectionHead title="Próximas videollamadas" action={<Button variant="link" size="small" onClick={() => router.push("/calendario")}>Ver todas</Button>} />
      {sessions.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0, overflowY: "auto", margin: "-2px -4px", padding: "2px 4px" }}>
          {sessions.map((s, i) => <SessionItem key={s.id} s={s} featured={i === 0} />)}
        </div>
      ) : (
        <EmptyState compact illo="foro-tranquilo" text="No tienes videollamadas programadas." />
      )}
    </section>
  );
}
