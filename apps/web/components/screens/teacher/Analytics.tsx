"use client";

import { Avatar, Badge } from "@/components/ui";
import { Page, PageHead, StatTile, Panel, ProgressBar } from "@/components/layout";
import { BarChart } from "@/components/charts";
import { students } from "@/lib/data";

const weekly = [
  { label: "S1", value: 72 }, { label: "S2", value: 80 }, { label: "S3", value: 68 },
  { label: "S4", value: 85 }, { label: "S5", value: 90 }, { label: "S6", value: 88 },
];

const distribution: [string, number, string][] = [
  ["9–10", 0.28, "var(--success-500)"],
  ["7–8.9", 0.34, "var(--info-500)"],
  ["5–6.9", 0.25, "var(--warning-500)"],
  ["< 5", 0.13, "var(--status-error)"],
];

export function Analytics() {
  const top = [...students].sort((a, b) => b.avg - a.avg).slice(0, 5);
  const risk = [...students].filter((s) => s.avg < 6).slice(0, 3);
  return (
    <Page>
      <PageHead title="Progreso del aprendizaje" subtitle="Cálculo II · seguimiento del grupo" />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="grid" value="62%" label="Temario completado" tint="var(--primary-100)" fg="var(--primary-600)" delta="+6%" />
        <StatTile icon="users" value="91%" label="Participación" tint="var(--success-100)" fg="var(--success-600)" delta="+3%" />
        <StatTile icon="document-text" value="88%" label="Entregas a tiempo" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="star" value="7.6" label="Nota media" tint="var(--yellow-200)" fg="var(--yellow-700)" delta="-0.2" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel title="Entregas por semana">
          <BarChart data={weekly} />
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "14px 0 0" }}>Porcentaje de alumnos que entregan dentro de plazo cada semana.</p>
        </Panel>
        <Panel title="Distribución de notas">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {distribution.map(([r, v, col]) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 52, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{r}</span>
                <ProgressBar value={v} color={col} showLabel />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }} className="atria-2col">
        <Panel title="Mejor rendimiento">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {top.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                <span style={{ width: 22, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>
                <Avatar name={s.name} size="sm" />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</span>
                <Badge color="success">{s.avg.toFixed(1)}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Necesitan apoyo">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {risk.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                <Avatar name={s.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Asistencia {Math.round(s.attendance * 100)}% · {s.submitted} entregas</div>
                </div>
                <Badge color="error">{s.avg.toFixed(1)}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
