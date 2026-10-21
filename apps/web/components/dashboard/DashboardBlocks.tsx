"use client";

// Bloques comunes de los tableros de inicio del docente y del alumno.

import type { CSSProperties, ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
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

export function SectionHead({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
      <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>{title}</h3>
      {action ?? null}
    </div>
  );
}

/** Avatares solapados con un "+N" al final, como en las tarjetas de videollamada. */
function AvatarStack({ people, max = 3 }: { people: { id: string; name: string; avatarUrl: string | null }[]; max?: number }) {
  if (!people.length) return null;
  const extra = people.length - max;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {people.slice(0, max).map((p, i) => (
        <Avatar key={p.id} name={p.name} src={p.avatarUrl ? resourceUrl(p.avatarUrl) : undefined} size={28} style={{ marginLeft: i ? -8 : 0, boxShadow: "0 0 0 2px var(--surface-card)" }} />
      ))}
      {extra > 0 ? <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginLeft: 6 }}>+{extra}</span> : null}
    </span>
  );
}

/** Próximos siete días: una columna por día con sus videollamadas, entregas y exámenes. */
export function WeekSchedule({ events, onOpenEvent, onCalendar }: { events: CalendarEventDto[]; onOpenEvent: (e: CalendarEventDto) => void; onCalendar: () => void }) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
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
      return { key, label: i === 0 ? "Hoy" : dayFmt.format(d), groups: [...groups.values()] };
    });
  }, [events]);
  const empty = days.every((d) => !d.groups.length);

  // Hora actual (HH:MM), refrescada cada minuto para mover la línea de «ahora».
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowLabel = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // La línea va antes del primer evento de hoy que aún no ha empezado; los de todo el día cuentan como ya pasados.
  const nowBefore = days[0].groups.flatMap((g) => g.items).find((e) => e.time && e.time > nowLabel)?.id ?? null;
  const nowLine = (
    <div key="now" aria-label={`Ahora, ${nowLabel}`} style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, margin: "2px 0" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#fff", background: "var(--calendar-weekend)", borderRadius: 999, padding: "1px 6px", fontVariantNumeric: "tabular-nums" }}>{nowLabel}</span>
      <span aria-hidden="true" style={{ flex: 1, height: 2, borderRadius: 1, background: "var(--calendar-weekend)" }} />
    </div>
  );

  return (
    <section style={{ ...card, padding: 20 }}>
      <SectionHead title="Mi semana" action={<Button variant="link" size="small" onClick={onCalendar}>Ver calendario</Button>} />
      <div style={{ overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(112px, 1fr))", gap: 8, minWidth: 7 * 112 + 6 * 8 }}>
          {days.map((d, i) => (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8, minWidth: 0 }}>
              <span
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 0",
                  borderRadius: "var(--radius-md)",
                  textTransform: "capitalize",
                  background: i === 0 ? "var(--surface-inverse)" : "var(--surface-sunken)",
                  color: i === 0 ? "var(--text-on-inverse, #fff)" : "var(--text-muted)",
                }}
              >
                {d.label}
              </span>
              <div style={{ position: "relative", minHeight: 260, display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: `1.5px dashed ${i === 0 ? "var(--text-strong)" : "var(--border-strong)"}`, opacity: i === 0 ? 0.5 : 0.6 }} />
                {d.groups.map((g) => (
                  <Fragment key={g.title}>
                  {i === 0 && nowBefore === g.items[0].id ? nowLine : null}
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    {/* Título de la asignatura, con fondo para tapar la línea discontinua. */}
                    <span
                      title={g.title}
                      style={{ alignSelf: "center", maxWidth: "100%", boxSizing: "border-box", display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 6px", background: "var(--surface-card)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)" }}
                    >
                      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: g.ink }} />
                      <span style={ellipsis}>{g.title}</span>
                    </span>
                    {g.items.map((e, k) => {
                      const meta = KIND_META[e.kind]!;
                      return (
                        <Fragment key={e.id}>
                        {i === 0 && k > 0 && nowBefore === e.id ? nowLine : null}
                        <button
                          type="button"
                          onClick={() => onOpenEvent(e)}
                          title={`${e.title} · ${e.className}`}
                          style={{
                            position: "relative",
                            textAlign: "left",
                            cursor: "pointer",
                            border: "none",
                            borderLeft: `3px solid ${meta.color}`,
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
                        </Fragment>
                      );
                    })}
                  </div>
                  </Fragment>
                ))}
                {i === 0 && !nowBefore ? nowLine : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      {empty ? <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>Nada programado en los próximos siete días.</p> : null}
    </section>
  );
}

export function SessionItem({ s, featured }: { s: OverviewSessionDto; featured: boolean }) {
  const schedule = sessionSchedule(s.startsAt);
  const live = schedule.tone === "live";
  const brand = MEETING_BRAND[s.provider];
  const open = () => window.open(s.url, "_blank", "noopener,noreferrer");
  return (
    <div style={{ borderRadius: "var(--radius-lg)", padding: 14, background: featured ? "var(--surface-sunken)" : "transparent", boxShadow: featured ? "none" : "var(--ring-hairline)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: featured ? "var(--surface-inverse)" : "var(--surface-sunken)",
            color: featured ? "var(--text-on-inverse, #fff)" : "var(--text-strong)",
          }}
        >
          <Icon name="bell" size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", ...ellipsis }}>{s.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: live ? "var(--status-success)" : "var(--text-muted)", marginTop: 2, fontWeight: live ? 700 : 400 }}>
            <Icon name="clock" size={13} />
            <span style={ellipsis}>{schedule.label} · {s.className}</span>
          </div>
        </div>
        {featured ? null : <AvatarStack people={s.students} />}
      </div>
      {featured ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
          <AvatarStack people={s.students} />
          <Button size="small" variant={live ? "accent" : "outline"} iconLeft={brand ? <span style={{ display: "inline-flex" }}>{brand.glyph(16)}</span> : <Icon name="video-camera" size={16} />} onClick={open}>
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
