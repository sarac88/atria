"use client";

import { DataTable, Badge, type Column } from "@/components/ui";

interface GradeRow {
  id: number;
  act: string;
  date: string;
  grade: string;
  fb: string;
}

const rows: GradeRow[] = [
  { id: 1, act: "Ensayo límites", date: "12 / 10 / 2022", grade: "8.0", fb: "Buen razonamiento" },
  { id: 2, act: "Derivadas", date: "10 / 10 / 2022", grade: "5.0", fb: "Repasa la regla de la cadena" },
  { id: 3, act: "Cuestionario 4", date: "18 / 10 / 2022", grade: "7.0", fb: "—" },
];

export function StudentGradesTable() {
  const cols: Column<GradeRow>[] = [
    { key: "act", label: "Actividad", render: (v) => <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{v as string}</span> },
    { key: "date", label: "Fecha" },
    { key: "fb", label: "Comentario", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "grade", label: "Nota", align: "right", render: (v) => <Badge color={+(v as string) >= 7 ? "success" : +(v as string) >= 5 ? "warning" : "error"}>{v as string}</Badge> },
  ];
  return <DataTable title="Mis notas" rowKey="id" columns={cols} rows={rows} selectable={false} />;
}
