"use client";

import { DataTable, Badge, Button, Icon, type Column } from "@/components/ui";
import { Page, PageHead } from "@/components/layout";
import { classes } from "@/lib/data";
import type { ClassInfo, StatusTuple } from "@/lib/types";

export function AdminClasses({ onOpenClass }: { onOpenClass: (c: ClassInfo) => void }) {
  const rows = classes.map((c) => ({ ...c, teacher: "Elena Ruiz" }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "name", label: "Clase", render: (v, r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: r.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={r.icon} size={16} /></span><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "code", label: "Código" },
    { key: "teacher", label: "Docente" },
    { key: "students", label: "Alumnos", render: (v) => <span style={{ fontWeight: 700 }}>{v as number}</span> },
    { key: "status", label: "Estado", sortable: false, render: (v) => { const t = v as StatusTuple; return <Badge color={t[1]}>{t[0]}</Badge>; } },
  ];
  return (
    <Page>
      <PageHead title="Clases" />
      <DataTable
        title="Clases · 38"
        rowKey="id"
        columns={cols}
        rows={rows}
        selectable={false}
        toolbar={<Button size="small" variant="accent" iconLeft={<Icon name="plus" size={16} />}>Nueva clase</Button>}
      />
    </Page>
  );
}
