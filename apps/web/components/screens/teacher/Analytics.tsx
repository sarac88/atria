"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge } from "@/components/ui";
import { Page, PageHead, StatTile, Panel, ProgressBar, EmptyState } from "@/components/layout";
import { ClassFilter } from "@/components/classes/ClassFilter";
import { BarChart } from "@/components/charts";
import { useClasses } from "@/lib/api/classes";
import { useActivities, useRoster } from "@/lib/api/classwork";
import type { Student } from "@/lib/types";

/** Tramos de nota, de mejor a peor. */
const BANDS: [string, (n: number) => boolean, string][] = [
  ["9–10", (n) => n >= 9, "var(--success-500)"],
  ["7–8.9", (n) => n >= 7 && n < 9, "var(--info-500)"],
  ["5–6.9", (n) => n >= 5 && n < 7, "var(--warning-500)"],
  ["< 5", (n) => n < 5, "var(--status-error)"],
];

/** Cuánto del grupo ha entregado una actividad, de más a menos. Da color a su barra. */
const LEVELS: [string, number, string][] = [
  ["Casi todo el grupo", 0.66, "var(--info-500)"],
  ["Parte del grupo", 0.33, "var(--warning-500)"],
  ["Pocas entregas", 0, "var(--status-error)"],
];

const levelColor = (submitted: number, total: number) => {
  const ratio = total ? submitted / total : 0;
  return (LEVELS.find(([, min]) => ratio >= min) ?? LEVELS[LEVELS.length - 1])[2];
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function Analytics() {
  const { data: classes } = useClasses();
  const list = useMemo(() => classes ?? [], [classes]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (!classId && list.length) setClassId(list[0].id);
  }, [list, classId]);

  const current = list.find((c) => c.id === classId);
  const { data: rosterData } = useRoster(classId);
  const { data: activitiesData } = useActivities(classId);

  const roster = useMemo(() => rosterData ?? [], [rosterData]);
  const activities = useMemo(() => activitiesData ?? [], [activitiesData]);

  const graded = useMemo(
    () => roster.filter((s): s is Student & { avg: number } => s.avg != null),
    [roster],
  );

  const stats = useMemo(() => {
    const progress = roster.length ? roster.reduce((n, s) => n + s.progress, 0) / roster.length : null;
    const average = graded.length ? graded.reduce((n, s) => n + s.avg, 0) / graded.length : null;
    const submitted = activities.reduce((n, a) => n + a.submitted, 0);
    const expected = activities.reduce((n, a) => n + a.total, 0);
    const active = roster.filter((s) => s.submitted > 0).length;
    return {
      progress: progress == null ? "—" : pct(progress),
      average: average == null ? "—" : average.toFixed(1),
      rate: expected ? pct(submitted / expected) : "—",
      participation: roster.length ? pct(active / roster.length) : "—",
    };
  }, [roster, graded, activities]);

  /** Entregas recibidas por actividad, en el orden en que se publicaron. El título va en el tooltip. */
  const perActivity = useMemo(
    () => activities.map((a, i) => ({
      label: `Actividad ${i + 1}`,
      value: a.submitted,
      hint: a.title,
      color: levelColor(a.submitted, a.total),
    })),
    [activities],
  );

  const distribution = useMemo(
    () => BANDS.map(([label, test, color]) => {
      const n = graded.filter((s) => test(s.avg)).length;
      return { label, color, share: graded.length ? n / graded.length : 0, count: n };
    }),
    [graded],
  );

  const top = useMemo(() => [...graded].sort((a, b) => b.avg - a.avg).slice(0, 5), [graded]);
  const risk = useMemo(() => [...graded].filter((s) => s.avg < 5).sort((a, b) => a.avg - b.avg).slice(0, 5), [graded]);

  if (!list.length) {
    return (
      <Page>
        <PageHead title="Progreso del aprendizaje" />
        <EmptyState illo="empty-classes" title="Todavía no tienes clases" text="Crea una clase para ver el seguimiento del grupo." />
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Progreso del aprendizaje"
        subtitle={current ? `${current.name} · seguimiento del grupo` : "Seguimiento del grupo"}
        actions={<ClassFilter classes={list} value={classId} onChange={setClassId} />}
      />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="grid" value={stats.progress} label="Progreso del grupo" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="users" value={stats.participation} label="Alumnos con entregas" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="document-text" value={stats.rate} label="Tasa de entrega" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="star" value={stats.average} label="Nota media" tint="var(--yellow-200)" fg="var(--yellow-700)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel title="Entregas por actividad">
          {perActivity.length ? (
            <>
              <BarChart data={perActivity} minBarWidth={78} highlightLast={false} />
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 14 }}>
                {LEVELS.map(([label, , color]) => (
                  <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-muted)" }}>
                    <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    {label}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "8px 0 0" }}>
                Entregas recibidas en cada actividad publicada, sobre {roster.length} {roster.length === 1 ? "alumno" : "alumnos"}.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Esta clase todavía no tiene actividades.</p>
          )}
        </Panel>
        <Panel title="Distribución de notas">
          {graded.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {distribution.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 52, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{d.label}</span>
                  <ProgressBar value={d.share} color={d.color} showLabel />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Aún no hay notas puestas en esta clase.</p>
          )}
        </Panel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }} className="atria-2col">
        <Panel title="Mejor rendimiento">
          {top.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {top.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                  <span style={{ width: 22, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>
                  <Avatar name={s.name} size="sm" />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</span>
                  <Badge color={s.avg >= 7 ? "success" : "info"}>{s.avg.toFixed(1)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Sin notas todavía.</p>
          )}
        </Panel>
        <Panel title="Necesitan apoyo">
          {risk.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {risk.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                  <Avatar name={s.name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Progreso {pct(s.progress)} · {s.submitted} {s.submitted === 1 ? "entrega" : "entregas"}</div>
                  </div>
                  <Badge color="error">{s.avg.toFixed(1)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Ningún alumno por debajo del 5.</p>
          )}
        </Panel>
      </div>
    </Page>
  );
}
