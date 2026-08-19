"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { Page, PageHead, Panel } from "@/components/layout";
import { useCalendarEvents } from "@/lib/api/calendar";
import type { CalendarEventDto, CalendarKind } from "@/lib/types";

interface CatDef {
  label: string;
  icon: string;
  color: string;
  tint: string;
}

const dows = ["L", "M", "X", "J", "V", "S", "D"];

const CATS: Record<CalendarKind, CatDef> = {
  entrega: { label: "Entregas", icon: "document-text", color: "var(--info-600)", tint: "var(--info-100)" },
  sesion: { label: "Sesiones", icon: "academic-cap", color: "var(--primary-600)", tint: "var(--primary-100)" },
  examen: { label: "Exámenes", icon: "clipboard-check", color: "var(--warning-600)", tint: "var(--warning-200)" },
};

const KINDS = Object.keys(CATS) as CalendarKind[];

const monthFmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Lunes = 0, para una rejilla que empieza en lunes. */
const mondayOffset = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

export function CalendarScreen() {
  const { data, isLoading } = useCalendarEvents();
  const [active, setActive] = useState<Record<CalendarKind, boolean>>({ entrega: true, sesion: true, examen: true });
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

  const visible = (d: number) => (byDate.get(dateKey(year, month, d)) ?? []).filter((e) => active[e.kind]);
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

  const chip = (e: CalendarEventDto, key: number) => {
    const c = CATS[e.kind];
    const sub = e.time ? `${e.time} · ${e.className}` : e.className;
    return (
      <div key={key} title={`${e.title} · ${e.className}`} style={{ background: c.tint, borderRadius: 6, borderLeft: `3px solid ${c.color}`, padding: "4px 8px", minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
      </div>
    );
  };

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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {days.map((d, i) => {
              const valid = d >= 1 && d <= daysInMonth;
              const evs = valid ? visible(d) : [];
              const shown = evs.slice(0, 3);
              const extra = evs.length - shown.length;
              const isToday = d === todayDay;
              return (
                <div key={i} style={{ minHeight: 124, display: "flex", flexDirection: "column", padding: 8, gap: 4, borderRight: i % 7 !== 6 ? "1px solid var(--border-subtle)" : "none", borderBottom: i < days.length - 7 ? "1px solid var(--border-subtle)" : "none", background: valid ? "transparent" : "var(--surface-soft)" }}>
                  {valid ? <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: 700, color: isToday ? "#fff" : "var(--text-strong)", background: isToday ? "var(--brand-primary)" : "transparent", alignSelf: "flex-start" }}>{d}</div> : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    {shown.map((e, j) => chip(e, j))}
                    {extra > 0 ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: "0 4px" }}>+{extra} más</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
