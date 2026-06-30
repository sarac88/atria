"use client";

import type { ReactNode } from "react";
import { Card, Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, StatTile, Panel, ProgressBar } from "@/components/layout";
import { classes } from "@/lib/data";
import type { BadgeColor, ClassInfo } from "@/lib/types";

function cover(bg: string, icon: string): ReactNode {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: "rgba(255,255,255,0.92)" }}>
      <Icon name={icon} size={46} />
    </div>
  );
}

const due: { title: string; cls: string; in: string; color: BadgeColor; icon: string }[] = [
  { title: "Cuestionario 4 — Integrales", cls: "Cálculo II", in: "Vence mañana", color: "error", icon: "clipboard-check" },
  { title: "Ensayo de derivadas", cls: "Cálculo II", in: "En 3 días", color: "warning", icon: "document-text" },
  { title: "Comentario de texto", cls: "Lengua y Literatura", in: "En 5 días", color: "info", icon: "document-text" },
];

export function StudentDashboard({ onOpenClass, onNav }: { onOpenClass: (c: ClassInfo) => void; onNav: (key: string) => void }) {
  return (
    <Page>
      <PageHead title={<span>Hola, Marc <span style={{ fontFamily: "system-ui" }}>👋</span></span>} subtitle="Tienes 3 tareas pendientes esta semana." />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
        <StatTile icon="academic-cap" value="5" label="Cursos" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="clipboard-check" value="3" label="Tareas pendientes" tint="var(--yellow-200)" fg="var(--yellow-700)" />
        <StatTile icon="star" value="7.4" label="Nota media" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="check-circle" value="82%" label="Progreso" tint="var(--info-100)" fg="var(--info-600)" />
      </div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 20, margin: 0 }}>Mis cursos</h3>
          <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todos</Button>
        </div>
        <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {classes.slice(0, 4).map((c) => (
            <Card key={c.id} title={c.name} subtitle={c.code} interactive media={cover(c.color, c.icon)} onClick={() => onOpenClass(c)} footer={<div style={{ width: "100%" }}><ProgressBar value={c.progress} showLabel /></div>} />
          ))}
        </div>
      </div>
      <Panel title="Próximas entregas">
        <div className="atria-classgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {due.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)" }}>
              <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--surface-soft)", color: "var(--primary-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={d.icon} size={19} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{d.cls}</div>
              </div>
              <Badge color={d.color}>{d.in}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}
