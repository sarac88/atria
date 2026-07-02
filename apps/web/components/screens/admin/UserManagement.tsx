"use client";

import { DataTable, Avatar, Badge, Button, IconButton, Icon, Select, type Column } from "@/components/ui";
import { Page, PageHead, Chip } from "@/components/layout";
import { students } from "@/lib/data";

const roleSeq = ["Alumno", "Docente", "Alumno", "Alumno", "Docente", "Alumno", "Alumno", "Docente"];

export function UserManagement() {
  const rows = students.slice(0, 8).map((s, i) => ({ ...s, role: roleSeq[i], status: i % 4 === 3 ? "Inactivo" : "Activo" }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "name", label: "Usuario", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "email", label: "Correo", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "role", label: "Rol", render: (v) => <Badge color={v === "Docente" ? "info" : "draft"}>{v as string}</Badge> },
    { key: "status", label: "Estado", render: (v) => <Badge color={v === "Activo" ? "success" : "default"}>{v as string}</Badge> },
    {
      key: "actions", label: "", sortable: false, align: "right", render: () => (
        <span style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}>
          <IconButton size="small" variant="ghost" label="Editar" icon={<Icon name="pencil" size={18} />} />
          <IconButton size="small" variant="danger" label="Eliminar" icon={<Icon name="trash" size={18} />} />
        </span>
      ),
    },
  ];
  return (
    <Page>
      <PageHead
        title="Usuarios"
        subtitle="196 alumnos · 24 docentes"
        actions={
          <>
            <div style={{ width: 160 }}><Select placeholder="Todos los roles" options={["Todos", "Alumnos", "Docentes"]} /></div>
            <Button variant="accent" iconLeft={<Icon name="plus" />}>Añadir</Button>
          </>
        }
      />
      <DataTable rowKey="id" columns={cols} rows={rows} toolbar={<Chip icon="users">{rows.length} mostrados</Chip>} />
    </Page>
  );
}
