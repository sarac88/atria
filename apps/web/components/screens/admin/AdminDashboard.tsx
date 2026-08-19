"use client";

import { useMemo } from "react";
import { Avatar, Badge, Button, Icon } from "@/components/ui";
import { Page, PageHead, StatTile, Panel } from "@/components/layout";
import { BarChart } from "@/components/charts";
import { useAdminUsers } from "@/lib/api/users";
import { useClasses } from "@/lib/api/classes";
import { roleLabel } from "@/lib/session";
import type { BadgeColor, Role } from "@/lib/types";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const ROLE_COLOR: Record<Role, "info" | "draft" | "warning"> = {
  docente: "info",
  alumno: "draft",
  admin: "warning",
};

export function AdminDashboard({ onNav }: { onNav: (key: string) => void }) {
  const { data: usersData } = useAdminUsers();
  const { data: classesData } = useClasses();

  const users = useMemo(() => usersData ?? [], [usersData]);
  const classes = useMemo(() => classesData ?? [], [classesData]);

  const stats = useMemo(() => ({
    students: users.filter((u) => u.role === "alumno").length,
    teachers: users.filter((u) => u.role === "docente").length,
    active: classes.filter((c) => c.state === "live").length,
    enrolments: classes.reduce((n, c) => n + c.students, 0),
  }), [users, classes]);

  /** Altas de usuarios en los últimos 6 meses, del más antiguo al actual. */
  const signups = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: MONTHS[d.getMonth()], value: 0, key: `${d.getFullYear()}-${d.getMonth()}` });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const u of users) {
      const d = new Date(u.createdAt);
      const at = index.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (at != null) buckets[at].value += 1;
    }
    return buckets.map(({ label, value }) => ({ label, value }));
  }, [users]);

  /** Reparto de clases por estado, reutilizando la etiqueta y el color que ya da la API. */
  const byStatus = useMemo(() => {
    const map = new Map<string, { label: string; color: BadgeColor; count: number }>();
    for (const c of classes) {
      const [label, color] = c.status;
      const cur = map.get(label);
      if (cur) cur.count += 1;
      else map.set(label, { label, color, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [classes]);

  const recent = users.slice(0, 5);

  return (
    <Page>
      <PageHead
        title="Panel del centro"
        subtitle={`${users.length} ${users.length === 1 ? "usuario" : "usuarios"} · ${classes.length} ${classes.length === 1 ? "clase" : "clases"}`}
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={() => onNav("usuarios")}>Ver usuarios</Button>}
      />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="users" value={stats.students} label="Alumnos" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="academic-cap" value={stats.teachers} label="Docentes" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="book-open" value={stats.active} label="Clases activas" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="check-circle" value={stats.enrolments} label="Matriculaciones" tint="var(--yellow-200)" fg="var(--yellow-700)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel title="Altas por mes">
          <BarChart data={signups} />
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "14px 0 0" }}>Usuarios dados de alta en cada uno de los últimos seis meses.</p>
        </Panel>
        <Panel title="Clases por estado">
          {byStatus.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {byStatus.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "var(--text-body)" }}>{s.label}</span>
                  <Badge color={s.color}>{s.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Todavía no hay clases creadas.</p>
          )}
        </Panel>
      </div>
      <div style={{ marginTop: 22 }}>
        <Panel title="Altas recientes" action={<Button variant="link" size="small" onClick={() => onNav("usuarios")}>Ver todos</Button>}>
          {recent.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recent.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px" }}>
                  <Avatar name={u.name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email} · alta {u.joined}</div>
                  </div>
                  <Badge color={ROLE_COLOR[u.role] ?? "draft"}>{roleLabel(u.role)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>Todavía no hay usuarios dados de alta.</p>
          )}
        </Panel>
      </div>
    </Page>
  );
}
