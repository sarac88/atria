"use client";

import { useState } from "react";
import { Icon, Badge, Button } from "@/components/ui";
import { Chip, EmptyState, ClassShell } from "@/components/layout";
import { StudentGradesTable } from "./StudentGradesTable";
import { modules } from "@/lib/data";
import { useSettings } from "@/components/settings/SettingsContext";
import type { BadgeColor, ClassInfo } from "@/lib/types";

const badgeColor: Record<string, BadgeColor> = { Nuevo: "new", Abierto: "info", Visto: "default", Completado: "success" };

function modParts(title: string): [string, string] {
  const ix = title.indexOf("·");
  return ix === -1 ? [title, ""] : [title.slice(0, ix).trim(), title.slice(ix + 1).trim()];
}

export interface StudentClassProps {
  klass: ClassInfo;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onSubmit: () => void;
}

export function StudentClass({ klass, onBack, onProfile, onLogout, onSubmit }: StudentClassProps) {
  const { role } = useSettings();
  const c = klass;
  const [tab, setTab] = useState("contenido");
  const [selMod, setSelMod] = useState<string | null>(modules[0]?.id ?? null);
  const curMod = modules.find((m) => m.id === selMod) || modules[0];

  const progress = (
    <div key="prog" style={{ minWidth: 180 }}>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", marginBottom: 6 }}>Tu progreso · {Math.round(c.progress * 100)}%</div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: c.progress * 100 + "%", height: "100%", background: "#fff", borderRadius: 999 }} />
      </div>
    </div>
  );

  return (
    <ClassShell
      klass={c}
      role={role}
      onBack={onBack}
      onProfile={onProfile}
      onLogout={onLogout}
      meta={`${c.code} · Prof. Elena Ruiz`}
      rightExtra={progress}
      tab={tab}
      onTab={setTab}
      tabs={[{ label: "Contenido", value: "contenido" }, { label: "Tareas", value: "tareas" }, { label: "Notas", value: "notas" }, { label: "Foro", value: "foro" }]}
    >
      {tab === "contenido" ? (
        <div className="atria-2col atria-modules" style={{ display: "grid", gridTemplateColumns: "256px 1fr", gap: 0, alignItems: "start", background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", padding: "24px 28px" }}>
          <div className="atria-modules-rail" style={{ display: "flex", flexDirection: "column", paddingRight: 28, borderRight: "1px solid var(--border-subtle)", position: "sticky", top: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 12px" }}>Unidades</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {modules.map((m) => {
                const active = m.id === curMod.id;
                const [lead, sub] = modParts(m.title);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelMod(m.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", cursor: "pointer", width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", background: active ? "var(--primary-100)" : "transparent", transition: "background .15s ease" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: m.done ? "var(--success-100)" : "var(--surface-soft)", color: m.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={m.done ? "check" : "book-open"} size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "var(--brand-primary)" : "var(--text-strong)" }}>{lead}</span>
                      {sub ? <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{sub}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {curMod ? (
            <div key={curMod.id} style={{ paddingLeft: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: curMod.done ? "var(--success-100)" : "var(--surface-soft)", color: curMod.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={curMod.done ? "check" : "book-open"} size={18} />
                </span>
                <h3 style={{ fontSize: 18, margin: 0, flex: 1 }}>{curMod.title}</h3>
                <Chip>{curMod.items.length} recursos</Chip>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {curMod.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", cursor: "pointer" }}>
                    <Icon name={it.type} size={20} color="var(--text-muted)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{it.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{it.meta}</div>
                    </div>
                    {it.label.includes("Ensayo") ? (
                      <Button size="small" variant="accent" onClick={onSubmit}>Entregar</Button>
                    ) : it.state ? (
                      <Badge color={badgeColor[it.state] || "default"}>{it.state}</Badge>
                    ) : (
                      <Icon name="chevron-right" size={18} color="var(--text-muted)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : tab === "notas" ? (
        <StudentGradesTable />
      ) : (
        <EmptyState
          illo={tab === "foro" ? "empty-messages" : "empty-submissions"}
          title={tab === "foro" ? "El foro está tranquilo" : "No tienes tareas abiertas"}
          text="Cuando tu profesora publique algo nuevo aparecerá aquí."
        />
      )}
    </ClassShell>
  );
}
