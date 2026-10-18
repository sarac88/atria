"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { Page, PageHead, Panel } from "@/components/layout";
import { useCalendarEvents } from "@/lib/api/calendar";
import { classHeaderTheme } from "@/lib/class-thumbs";
import type { CalendarEventDto, CalendarKind } from "@/lib/types";

interface CatDef {
  label: string;
  icon: string;
  color: string;
  tint: string;
}

const dows = ["L", "M", "X", "J", "V", "S", "D"];

const CATS: Record<CalendarKind, CatDef> = {
  entrega: { label: "Entregas", icon: "document-text", color: "var(--event-entrega)", tint: "var(--event-entrega-soft)" },
  sesion: { label: "Sesiones", icon: "academic-cap", color: "var(--event-sesion)", tint: "var(--event-sesion-soft)" },
  examen: { label: "Exámenes", icon: "clipboard-check", color: "var(--event-examen)", tint: "var(--event-examen-soft)" },
  unidad: { label: "Unidades", icon: "book-open", color: "var(--event-unidad)", tint: "var(--event-unidad-soft)" },
};

const KINDS = Object.keys(CATS) as CalendarKind[];

const monthFmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Lunes = 0, para una rejilla que empieza en lunes. */
const mondayOffset = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

export function CalendarScreen() {
  const router = useRouter();
  const { data, isLoading } = useCalendarEvents();
  const [active, setActive] = useState<Record<CalendarKind, boolean>>({ entrega: true, sesion: true, examen: true, unidad: true });
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEventDto[]>();
    for (const e of data ?? []) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [data]);

  const { year, month } = cursor;
  const offset = mondayOffset(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cells }, (_, i) => i - offset + 1);

  const now = new Date();
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;
  const monthLabel = monthFmt.format(new Date(year, month, 1));
  const titled = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Las unidades se pintan como barras, no como eventos de un día.
  const visible = (d: number) => (byDate.get(dateKey(year, month, d)) ?? []).filter((e) => e.kind !== "unidad" && active[e.kind]);

  // Unidades que tocan este mes, recortadas a sus días dentro de él.
  const units = useMemo(() => {
    if (!active.unidad) return [];
    const first = dateKey(year, month, 1);
    const last = dateKey(year, month, daysInMonth);
    return (data ?? [])
      .filter((e) => e.kind === "unidad" && e.date <= last && (e.endDate ?? e.date) >= first)
      .map((e) => {
        const end = e.endDate ?? e.date;
        return {
          event: e,
          startDay: e.date < first ? 1 : Number(e.date.slice(8, 10)),
          endDay: end > last ? daysInMonth : Number(end.slice(8, 10)),
          startsInMonth: e.date >= first,
          endsInMonth: end <= last,
        };
      });
  }, [data, year, month, daysInMonth, active.unidad]);

  /** La unidad de la misma clase en cuya barra cae el evento, si la hay. */
  const unitOf = (e: CalendarEventDto) =>
    units.find((u) => u.event.classId === e.classId && u.event.date <= e.date && (u.event.endDate ?? u.event.date) >= e.date)?.event.id;

  const weeks = Array.from({ length: cells / 7 }, (_, w) => {
    const segs: { unit: (typeof units)[number]; a: number; b: number; lane: number }[] = [];
    for (const u of units) {
      const a = Math.max(u.startDay + offset - 1, w * 7) - w * 7;
      const b = Math.min(u.endDay + offset - 1, w * 7 + 6) - w * 7;
      if (a <= b) segs.push({ unit: u, a, b, lane: 0 });
    }
    // Cada barra ocupa el primer carril libre de la semana.
    segs.sort((x, y) => x.a - y.a || y.b - x.b);
    const laneEnds: number[] = [];
    for (const s of segs) {
      let lane = laneEnds.findIndex((end) => end < s.a);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = s.b;
      s.lane = lane;
    }
    return { segs, lanes: laneEnds.length };
  });
  const toggle = (k: CalendarKind) => setActive((a) => ({ ...a, [k]: !a[k] }));
  const shift = (delta: number) => setCursor(({ year, month }) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const goToday = () => setCursor({ year: now.getFullYear(), month: now.getMonth() });

  const monthCount = useMemo(
    () => (data ?? []).filter((e) => e.date.startsWith(`${year}-${pad(month + 1)}`) && active[e.kind]).length,
    [data, year, month, active],
  );

  const dot = (e: CalendarEventDto) => (
    <button
      key={e.id}
      type="button"
      title={`${e.time ? `${e.time} · ` : ""}${e.title} · ${e.className}`}
      onClick={() => router.push(`/clase/${e.classId}`)}
      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0, boxSizing: "border-box", textAlign: "left", background: "transparent", border: "none", borderRadius: 4, padding: "2px 3px", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "background .15s ease" }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: CATS[e.kind].color }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {e.time ? <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{e.time} </span> : null}
        {e.title}
      </span>
    </button>
  );

  /** Hasta 3 eventos y un «+N más». */
  const dotList = (evs: CalendarEventDto[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      {evs.slice(0, 3).map(dot)}
      {evs.length > 3 ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "0 4px" }}>+{evs.length - 3} más</span> : null}
    </div>
  );

  return (
    <Page>
      <PageHead
        title="Calendario"
        subtitle={isLoading ? "Cargando eventos…" : monthCount === 1 ? "1 evento este mes" : `${monthCount} eventos este mes`}
        actions={
          <button
            onClick={goToday}
            style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-strong)", cursor: "pointer", padding: "9px 16px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-sans)" }}
          >
            Hoy
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", marginBottom: 14 }}>Filtros</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {KINDS.map((k) => {
              const c = CATS[k];
              const on = active[k];
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "7px 6px", borderRadius: "var(--radius-md)", transition: "background .15s ease" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                >
                  <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? c.color : "transparent", boxShadow: on ? "none" : "inset 0 0 0 2px var(--border-strong)", transition: "background .15s ease" }}>
                    {on ? <Icon name="check" size={13} color="#fff" /> : null}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: on ? "var(--text-strong)" : "var(--text-muted)" }}>{c.label}</span>
                  <Icon name={c.icon} size={15} color={on ? c.color : "var(--text-muted)"} />
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "18px 0" }} />

          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 10 }}>{titled}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {dows.map((d, i) => <div key={"h" + i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", paddingBottom: 4 }}>{d}</div>)}
            {days.map((d, i) => {
              const valid = d >= 1 && d <= daysInMonth;
              const evs = valid ? visible(d) : [];
              const isToday = d === todayDay;
              return (
                <div key={i} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: !valid ? "var(--text-muted)" : isToday ? "#fff" : "var(--text-body)", background: isToday ? "var(--brand-primary)" : "transparent", opacity: valid ? 1 : 0.4 }}>{valid ? d : ""}</span>
                  <span style={{ display: "flex", gap: 2, height: 4 }}>
                    {evs.slice(0, 3).map((e, k) => <span key={k} style={{ width: 4, height: 4, borderRadius: "50%", background: CATS[e.kind].color }} />)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel pad={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: 22, margin: 0, fontWeight: 700, color: "var(--text-strong)" }}>{titled}</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {([["arrow-left", "Mes anterior", -1], ["arrow-right", "Mes siguiente", 1]] as [string, string, number][]).map(([ic, lb, delta]) => (
                <button
                  key={ic}
                  type="button"
                  aria-label={lb}
                  onClick={() => shift(delta)}
                  style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-default)", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", color: "var(--text-strong)", cursor: "pointer", transition: "background .15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--state-hover-tint)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                >
                  <Icon name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border-subtle)" }}>
            {dows.map((d, i) => <div key={i} style={{ padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: ".03em", color: "var(--text-muted)" }}>{d}</div>)}
          </div>
          {weeks.map(({ segs, lanes }, w) => {
            const week = days.slice(w * 7, w * 7 + 7);
            const valid = (d: number) => d >= 1 && d <= daysInMonth;
            return (
              <div
                key={w}
                style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridTemplateRows: `auto ${"auto auto ".repeat(lanes)}1fr`, minHeight: 124, borderBottom: w < weeks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                {/* Fondo y bordes de cada día, detrás de barras y eventos. */}
                {week.map((d, c) => (
                  <div key={"bg" + c} style={{ gridColumn: c + 1, gridRow: "1 / -1", borderRight: c !== 6 ? "1px solid var(--border-subtle)" : "none", background: valid(d) ? "transparent" : "var(--surface-soft)" }} />
                ))}

                {week.map((d, c) => (
                  <div key={"n" + c} style={{ gridColumn: c + 1, gridRow: 1, padding: "8px 8px 4px" }}>
                    {valid(d) ? <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: 700, color: d === todayDay ? "#fff" : "var(--text-strong)", background: d === todayDay ? "var(--brand-primary)" : "transparent" }}>{d}</div> : null}
                  </div>
                ))}

                {/* Cada unidad: una barra de fondo que abarca dos filas (título y eventos);
                    los eventos van en las columnas de la semana para cuadrar con cada día. */}
                {segs.map(({ unit, a, b, lane }) => {
                  const u = unit.event;
                  const endsHere = unit.endsInMonth && unit.endDay + offset - 1 === w * 7 + b;
                  const subject = u.classSubject || u.className;
                  const span = `${a + 1} / ${b + 2}`;
                  const right = endsHere ? 6 : 0;
                  return [
                    <div
                      key={u.id + ":bar"}
                      style={{ gridColumn: span, gridRow: `${2 + 2 * lane} / span 2`, marginRight: right, marginBottom: 4, background: "color-mix(in srgb, var(--event-unidad-soft) 55%, transparent)", borderLeft: `4px solid ${classHeaderTheme(u.classThumb, u.classColor).ink}`, zIndex: 1 }}
                    />,
                    <button
                      key={u.id + ":title"}
                      type="button"
                      title={`${u.title} · ${subject} · ${u.className}`}
                      onClick={() => router.push(`/clase/${u.classId}`)}
                      style={{ gridColumn: span, gridRow: 2 + 2 * lane, zIndex: 2, display: "flex", alignItems: "baseline", gap: 6, minWidth: 0, marginRight: right, background: "transparent", border: "none", padding: "5px 6px 2px 9px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", whiteSpace: "nowrap", overflow: "hidden" }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1, minWidth: 0 }}>{u.title}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 2, minWidth: 0 }}>{subject}</span>
                    </button>,
                    ...week.slice(a, b + 1).map((d, k) => (
                      <div key={`${u.id}:${k}`} style={{ gridColumn: a + k + 1, gridRow: 3 + 2 * lane, zIndex: 2, minWidth: 0, padding: `0 ${a + k === b ? 6 + right : 6}px 5px 6px` }}>
                        {dotList(visible(d).filter((e) => unitOf(e) === u.id))}
                      </div>
                    )),
                  ];
                })}

                {/* Eventos que no caen dentro de ninguna unidad visible. */}
                {week.map((d, c) => (
                  <div key={"e" + c} style={{ gridColumn: c + 1, gridRow: 2 + 2 * lanes, minWidth: 0, padding: "0 6px 8px" }}>
                    {valid(d) ? dotList(visible(d).filter((e) => !unitOf(e))) : null}
                  </div>
                ))}
              </div>
            );
          })}
        </Panel>
      </div>
    </Page>
  );
}
