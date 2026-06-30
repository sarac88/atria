"use client";

import { Avatar, Badge, Button, Icon } from "@/components/ui";
import { Page, PageHead, StatTile, Panel } from "@/components/layout";
import { BarChart } from "@/components/charts";
import { students } from "@/lib/data";
import type { BadgeColor } from "@/lib/types";

const enroll = [
  { label: "Sep", value: 120 }, { label: "Oct", value: 160 }, { label: "Nov", value: 175 },
  { label: "Dic", value: 168 }, { label: "Ene", value: 184 }, { label: "Feb", value: 196 },
];

const platform: [string, string, BadgeColor][] = [
  ["Servidores", "Operativo", "success"],
  ["Almacenamiento", "68% usado", "warning"],
  ["Copias de seguridad", "Hoy 03:00", "success"],
  ["Integraciones", "3 activas", "info"],
];

export function AdminDashboard({ onNav }: { onNav: (key: string) => void }) {
  return (
    <Page>
      <PageHead title="Panel del centro" subtitle="Atria · curso 2024–2025" actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={() => onNav("usuarios")}>Añadir usuario</Button>} />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="users" value="196" label="Alumnos" tint="var(--primary-100)" fg="var(--primary-600)" delta="+12" />
        <StatTile icon="academic-cap" value="24" label="Docentes" tint="var(--info-100)" fg="var(--info-600)" delta="+1" />
        <StatTile icon="book-open" value="38" label="Clases activas" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="check-circle" value="94%" label="Actividad semanal" tint="var(--yellow-200)" fg="var(--yellow-700)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel title="Matrículas por mes">
          <BarChart data={enroll} />
        </Panel>
        <Panel title="Estado de la plataforma">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {platform.map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "var(--text-body)" }}>{k}</span>
                <Badge color={c}>{v}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div style={{ marginTop: 22 }}>
        <Panel title="Altas recientes" action={<Button variant="link" size="small" onClick={() => onNav("usuarios")}>Ver todos</Button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {students.slice(0, 5).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                <Avatar name={s.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.email}</div>
                </div>
                <Badge color="draft">Alumno</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
