"use client";

import { useState } from "react";
import { Icon, Button } from "@/components/ui";
import { Page, PageHead, Panel } from "@/components/layout";

interface CatDef {
  label: string;
  icon: string;
  color: string;
  tint: string;
}
interface CalEvent {
  cat: string;
  label: string;
  count?: number;
  sub?: string;
}

const dows = ["L", "M", "X", "J", "V", "S", "D"];
const start = 5; // Octubre 2022 first-cell offset
const days = Array.from({ length: 35 }, (_, i) => i - start + 1);
const today = 12;

const CATS: Record<string, CatDef> = {
  entregas: { label: "Entregas", icon: "document-text", color: "var(--info-600)", tint: "var(--info-100)" },
  sesiones: { label: "Sesiones", icon: "academic-cap", color: "var(--primary-600)", tint: "var(--primary-100)" },
  examenes: { label: "Exámenes", icon: "clipboard-check", color: "var(--warning-600)", tint: "var(--warning-200)" },
  tutorias: { label: "Tutorías", icon: "chat", color: "var(--success-600)", tint: "var(--success-100)" },
  recordatorios: { label: "Recordatorios", icon: "bell", color: "var(--yellow-700)", tint: "var(--yellow-200)" },
};

const EVENTS: Record<number, CalEvent[]> = {
  3: [{ cat: "sesiones", label: "Clase · Cálculo II" }],
  4: [{ cat: "tutorias", label: "Tutoría · Física" }],
  6: [{ cat: "sesiones", label: "Clase · Cálculo II" }],
  7: [{ cat: "recordatorios", label: "Recordatorios", count: 2 }],
  10: [{ cat: "entregas", label: "Entregas", count: 4 }, { cat: "examenes", label: "Cuestionario 1" }, { cat: "sesiones", label: "Clase · Cálculo II" }],
  11: [{ cat: "tutorias", label: "Tutoría · Lengua" }],
  12: [{ cat: "entregas", label: "Explica tu idea", sub: "Nicole Spencer" }, { cat: "recordatorios", label: "Recordatorios", count: 2 }],
  13: [{ cat: "sesiones", label: "Clase · Cálculo II" }],
  17: [{ cat: "examenes", label: "Examen parcial", sub: "09:00 · Aula 345" }],
  18: [{ cat: "entregas", label: "Entregas", count: 3 }, { cat: "sesiones", label: "Sesión de repaso" }],
  20: [{ cat: "recordatorios", label: "Cierre de matrícula" }, { cat: "tutorias", label: "Tutoría" }],
  24: [{ cat: "sesiones", label: "Clase · Cálculo II" }],
  25: [{ cat: "recordatorios", label: "Seguimiento alumnos", sub: "Revisar progreso" }],
  26: [{ cat: "entregas", label: "Entregas", count: 5 }, { cat: "examenes", label: "Cuestionario 4" }, { cat: "tutorias", label: "Tutoría" }],
  27: [{ cat: "sesiones", label: "Clase · Cálculo II" }],
  28: [{ cat: "entregas", label: "Proyecto final", sub: "11:00" }],
};

export function CalendarScreen() {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(Object.keys(CATS).map((k) => [k, true])));
  const [view, setView] = useState("Mes");
  const visible = (d: number) => (EVENTS[d] || []).filter((e) => active[e.cat]);
  const toggle = (k: string) => setActive((a) => ({ ...a, [k]: !a[k] }));

  const chip = (e: CalEvent, key: number) => {
    const c = CATS[e.cat];
    if (e.sub) {
      return (
        <div key={key} title={e.label} style={{ background: c.tint, borderRadius: 6, borderLeft: `3px solid ${c.color}`, padding: "4px 8px", minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.label}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.sub}</div>
        </div>
      );
    }
    return (
      <div key={key} title={e.label} style={{ display: "flex", alignItems: "center", gap: 6, background: c.tint, borderRadius: 6, padding: "3px 6px", minWidth: 0 }}>
        <Icon name={c.icon} size={13} color={c.color} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.label}</span>
        {e.count != null ? <span style={{ flexShrink: 0, minWidth: 17, height: 16, borderRadius: 5, background: c.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{e.count}</span> : null}
      </div>
    );
  };

  return (
    <Page>
      <PageHead
        title="Calendario"
        subtitle="Octubre 2022"
        actions={
          <>
            <div style={{ display: "inline-flex", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 3, gap: 2 }}>
              {["Día", "Semana", "Mes"].map((v) => (
                <button key={v} onClick={() => setView(v)} style={{ border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, background: view === v ? "var(--surface-card)" : "transparent", color: view === v ? "var(--text-strong)" : "var(--text-muted)", boxShadow: view === v ? "var(--shadow-sm)" : "none", transition: "background .15s ease" }}>{v}</button>
              ))}
            </div>
            <Button variant="accent" iconLeft={<Icon name="plus" />}>Evento</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", marginBottom: 14 }}>Filtros</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(CATS).map(([k, c]) => {
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

          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 10 }}>Octubre 2022</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {dows.map((d) => <div key={"h" + d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", paddingBottom: 4 }}>{d}</div>)}
            {days.map((d, i) => {
              const valid = d >= 1 && d <= 31;
              const evs = valid ? visible(d) : [];
              const isToday = d === today;
              return (
                <div key={i} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: !valid ? "var(--text-muted)" : isToday ? "#fff" : "var(--text-body)", background: isToday ? "var(--brand-primary)" : "transparent", opacity: valid ? 1 : 0.4 }}>{valid ? d : ""}</span>
                  <span style={{ display: "flex", gap: 2, height: 4 }}>
                    {evs.slice(0, 3).map((e, k) => <span key={k} style={{ width: 4, height: 4, borderRadius: "50%", background: CATS[e.cat].color }} />)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel pad={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: 22, margin: 0, fontWeight: 700, color: "var(--text-strong)" }}>Octubre 2022</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {([["arrow-left", "Mes anterior"], ["arrow-right", "Mes siguiente"]] as [string, string][]).map(([ic, lb]) => (
                <button
                  key={ic}
                  type="button"
                  aria-label={lb}
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
            {dows.map((d) => <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: ".03em", color: "var(--text-muted)" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {days.map((d, i) => {
              const valid = d >= 1 && d <= 31;
              const evs = valid ? visible(d) : [];
              const shown = evs.slice(0, 3);
              const extra = evs.length - shown.length;
              const isToday = d === today;
              return (
                <div key={i} style={{ minHeight: 124, display: "flex", flexDirection: "column", padding: 8, gap: 4, borderRight: i % 7 !== 6 ? "1px solid var(--border-subtle)" : "none", borderBottom: i < 28 ? "1px solid var(--border-subtle)" : "none", background: valid ? "transparent" : "var(--surface-soft)" }}>
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
