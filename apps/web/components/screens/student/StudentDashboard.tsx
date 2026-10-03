"use client";

import { useMemo } from "react";
import { Card, Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, StatTile, Panel, ProgressBar, EmptyState } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { useSettings } from "@/components/settings/SettingsContext";
import { useStudentTasks } from "@/lib/api/classwork";
import { activityTypeMeta } from "@/lib/activity-meta";
import { dueBadge, parseDue } from "@/lib/due";
import { firstName } from "@/lib/session";
import type { ClassInfo, StudentTaskDto } from "@/lib/types";

const UPCOMING = 3;

/** Pendientes ordenadas por plazo; las que no tienen fecha reconocible van al final. */
function upcoming(tasks: StudentTaskDto[]): StudentTaskDto[] {
  return tasks
    .filter((t) => !t.mySubmission)
    .map((t) => ({ task: t, at: parseDue(t.due)?.getTime() ?? Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.at - b.at)
    .slice(0, UPCOMING)
    .map((e) => e.task);
}

export function StudentDashboard({ classes, onOpenClass, onNav }: { classes: ClassInfo[]; onOpenClass: (c: ClassInfo) => void; onNav: (key: string) => void }) {
  const { user } = useSettings();
  const { data: tasks, isLoading } = useStudentTasks();

  const stats = useMemo(() => {
    const list = tasks ?? [];
    const done = list.filter((t) => !!t.mySubmission).length;
    const scores = list
      .map((t) => Number(t.mySubmission?.grade))
      .filter((n) => Number.isFinite(n));
    const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return {
      pending: list.length - done,
      average: average === null ? "—" : average.toFixed(1),
      progress: list.length ? `${Math.round((done / list.length) * 100)}%` : "—",
      next: upcoming(list),
    };
  }, [tasks]);

  const greeting = firstName(user);
  const subtitle = isLoading
    ? "Cargando tu actividad…"
    : stats.pending === 0
      ? "No tienes tareas pendientes. ¡Buen trabajo!"
      : stats.pending === 1
        ? "Tienes 1 tarea pendiente."
        : `Tienes ${stats.pending} tareas pendientes.`;

  return (
    <Page>
      <PageHead
        title={<span>Hola{greeting ? `, ${greeting}` : ""} <span style={{ fontFamily: "system-ui" }}>👋</span></span>}
        subtitle={subtitle}
      />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
        <StatTile icon="academic-cap" value={classes.length} label="Cursos" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="clipboard-check" value={stats.pending} label="Tareas pendientes" tint="var(--yellow-200)" fg="var(--yellow-700)" />
        <StatTile icon="star" value={stats.average} label="Nota media" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="check-circle" value={stats.progress} label="Progreso" tint="var(--info-100)" fg="var(--info-600)" />
      </div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 20, margin: 0 }}>Mis cursos</h3>
          {classes.length > 4 ? <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todos</Button> : null}
        </div>
        {classes.length ? (
          <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {classes.slice(0, 4).map((c) => (
              <Card key={c.id} title={c.name} subtitle={c.code} interactive media={<ClassThumb thumb={c.thumb} cover={c.coverUrl} color={c.color} icon={c.icon} name={c.name} iconSize={46} />} onClick={() => onOpenClass(c)} footer={<div style={{ width: "100%" }}><ProgressBar value={c.progress} showLabel /></div>} />
            ))}
          </div>
        ) : (
          <EmptyState illo="sin-cursos" title="Aún no estás en ningún curso" text="Cuando te matriculen en un curso aparecerá aquí." />
        )}
      </div>
      <Panel title="Próximas entregas">
        {stats.next.length ? (
          <div className="atria-classgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {stats.next.map((task) => {
              const [icon, color] = activityTypeMeta(task.type);
              const badge = dueBadge(task.due);
              return (
                <button
                  key={task.id}
                  onClick={() => onNav("tareas")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%" }}
                >
                  <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${color} 16%, var(--surface-card))`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={19} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.className}</div>
                  </div>
                  <Badge color={badge.color}>{badge.label}</Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "4px 2px" }}>
            {isLoading ? "Cargando…" : "No tienes entregas pendientes."}
          </div>
        )}
      </Panel>
    </Page>
  );
}
