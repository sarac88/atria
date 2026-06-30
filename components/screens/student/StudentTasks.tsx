"use client";

import { Badge, Button, Icon } from "@/components/ui";
import { Page, PageHead, Panel } from "@/components/layout";
import type { BadgeColor } from "@/lib/types";

const tasks: { t: string; c: string; due: string; col: BadgeColor; icon: string; submit?: boolean }[] = [
  { t: "Cuestionario 4 — Integrales", c: "Cálculo II", due: "Vence mañana", col: "error", icon: "clipboard-check" },
  { t: "Ensayo de derivadas", c: "Cálculo II", due: "En 3 días", col: "warning", icon: "document-text", submit: true },
  { t: "Comentario de texto", c: "Lengua y Literatura", due: "En 5 días", col: "info", icon: "document-text" },
  { t: "Proyecto: aplicación real", c: "Cálculo II", due: "En 12 días", col: "default", icon: "folder" },
];

export function StudentTasks({ onSubmit }: { onSubmit: () => void }) {
  return (
    <Page width={900}>
      <PageHead title="Tareas" subtitle="4 tareas pendientes" />
      <Panel pad={0}>
        {tasks.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
            <span style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "var(--surface-soft)", color: "var(--primary-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={x.icon} size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{x.t}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{x.c}</div>
            </div>
            <Badge color={x.col}>{x.due}</Badge>
            <Button size="small" variant={x.submit ? "accent" : "outline"} onClick={onSubmit}>{x.submit ? "Entregar" : "Abrir"}</Button>
          </div>
        ))}
      </Panel>
    </Page>
  );
}
