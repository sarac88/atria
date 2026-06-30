"use client";

import type { ReactNode } from "react";
import { Card, Button, Badge, Icon, Checkbox } from "@/components/ui";
import { Page, PageHead, StatTile, Chip, Panel } from "@/components/layout";
import { classes, activityFeed } from "@/lib/data";
import type { ClassInfo } from "@/lib/types";

const stats = [
  { icon: "academic-cap", value: "6", label: "Clases activas", tint: "var(--primary-100)", fg: "var(--primary-600)" },
  { icon: "clipboard-check", value: "23", label: "Entregas por revisar", tint: "var(--yellow-200)", fg: "var(--yellow-700)", delta: "+5" },
  { icon: "users", value: "184", label: "Alumnos", tint: "var(--info-100)", fg: "var(--info-600)" },
  { icon: "chat", value: "5", label: "Mensajes sin leer", tint: "var(--success-100)", fg: "var(--success-600)" },
];

const todo = [
  { t: "Revisar «Explica tu idea»", c: "Cálculo II", icon: "clipboard-check" },
  { t: "Publicar Cuestionario 5", c: "Física General", icon: "document-add" },
  { t: "Responder a Lucía Romero", c: "Mensajes", icon: "chat" },
];

function cover(bg: string, icon: string): ReactNode {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: "rgba(255,255,255,0.92)" }}>
      <Icon name={icon} size={46} />
    </div>
  );
}

export function TeacherDashboard({ onOpenClass, onCreate, onNav }: { onOpenClass: (c: ClassInfo) => void; onCreate: () => void; onNav: (key: string) => void }) {
  return (
    <Page>
      <PageHead
        title={<span>Hola, Elena <span style={{ fontFamily: "system-ui" }}>👋</span></span>}
        subtitle="Tienes 23 entregas pendientes de revisar hoy."
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={onCreate}>Crear clase</Button>}
      />

      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "calc(18px * var(--d,1))", marginBottom: "calc(28px * var(--d,1))" }}>
        {stats.map((s) => <StatTile key={s.label} {...s} />)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "calc(28px * var(--d,1))" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 20, margin: 0 }}>Mis clases</h3>
            <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todas</Button>
          </div>
          <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {classes.slice(0, 4).map((c) => (
              <Card
                key={c.id}
                title={c.name}
                subtitle={c.code + " · " + c.room}
                interactive
                media={cover(c.color, c.icon)}
                onClick={() => onOpenClass(c)}
                footer={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <Chip icon="users">{c.students}</Chip>
                    <Badge color={c.status[1]}>{c.status[0]}</Badge>
                  </div>
                }
              />
            ))}
          </div>
        </div>

        <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "calc(20px * var(--d,1))", alignItems: "start" }}>
          <Panel title="Actividad reciente" pad={6}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {activityFeed.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", borderRadius: "var(--radius-md)" }}>
                  <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "var(--radius-sm)", background: a.tint, color: a.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={a.icon} size={18} />
                  </span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{a.who}</span> <span style={{ color: "var(--text-body)" }}>{a.what}</span>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Tareas de hoy">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todo.map((x, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <Checkbox />
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", display: "block" }}>{x.t}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{x.c}</span>
                  </span>
                  <Icon name={x.icon} size={18} color="var(--text-muted)" />
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
