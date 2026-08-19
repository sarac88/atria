"use client";

import { useMemo, useState } from "react";
import { DataTable, Avatar, Badge, Select, type Column } from "@/components/ui";
import { Page, PageHead, Chip, EmptyState } from "@/components/layout";
import { useAdminUsers } from "@/lib/api/users";
import { roleLabel } from "@/lib/session";
import type { AdminUserDto, Role } from "@/lib/types";

const FILTERS: { label: string; value: string }[] = [
  { label: "Todos los roles", value: "" },
  { label: "Alumnos", value: "alumno" },
  { label: "Docentes", value: "docente" },
  { label: "Administración", value: "admin" },
];

const ROLE_COLOR: Record<Role, "info" | "draft" | "warning"> = {
  docente: "info",
  alumno: "draft",
  admin: "warning",
};

export function UserManagement() {
  const { data, isLoading } = useAdminUsers();
  const [filter, setFilter] = useState("");

  const all = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => (filter ? all.filter((u) => u.role === filter) : all), [all, filter]);

  const counts = useMemo(() => {
    const students = all.filter((u) => u.role === "alumno").length;
    const teachers = all.filter((u) => u.role === "docente").length;
    return { students, teachers };
  }, [all]);

  const cols: Column<AdminUserDto>[] = [
    { key: "name", label: "Usuario", render: (v, r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "email", label: "Correo", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "role", label: "Rol", render: (v) => { const r = v as Role; return <Badge color={ROLE_COLOR[r] ?? "draft"}>{roleLabel(r)}</Badge>; } },
    { key: "classes", label: "Clases", align: "right", render: (v) => <span style={{ fontWeight: 700 }}>{v as number}</span> },
    { key: "joined", label: "Alta", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
  ];

  const subtitle = isLoading
    ? "Cargando usuarios…"
    : `${counts.students} ${counts.students === 1 ? "alumno" : "alumnos"} · ${counts.teachers} ${counts.teachers === 1 ? "docente" : "docentes"}`;

  return (
    <Page>
      <PageHead
        title="Usuarios"
        subtitle={subtitle}
        actions={
          <div style={{ width: 190 }}>
            <Select value={filter} onChange={setFilter} options={FILTERS} />
          </div>
        }
      />
      {rows.length ? (
        <DataTable
          rowKey="id"
          columns={cols}
          rows={rows}
          selectable={false}
          toolbar={<Chip icon="users">{rows.length} mostrados</Chip>}
        />
      ) : !isLoading ? (
        <EmptyState illo="learning" title="No hay usuarios que mostrar" text="Prueba a cambiar el filtro de rol." />
      ) : null}
    </Page>
  );
}
