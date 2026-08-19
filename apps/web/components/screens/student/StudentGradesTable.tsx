"use client";

import { DataTable, Badge, type Column } from "@/components/ui";
import type { SubmissionDto } from "@/lib/types";

/** Una entrega propia; `className` solo se usa en la vista global de "Mis notas". */
export type GradeRow = SubmissionDto & { className?: string };

export function StudentGradesTable({
  rows,
  showClass = false,
  title = "Mis notas",
}: {
  rows: GradeRow[];
  showClass?: boolean;
  title?: string;
}) {
  const cols: Column<GradeRow>[] = [
    { key: "activity", label: "Actividad", render: (v) => <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{v as string}</span> },
    ...(showClass ? [{ key: "className", label: "Curso" } as Column<GradeRow>] : []),
    { key: "date", label: "Fecha" },
    { key: "feedback", label: "Comentario", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{(v as string) || "—"}</span> },
    {
      key: "grade", label: "Nota", align: "right",
      render: (v) => {
        const g = v as string;
        if (g === "—") return <Badge color="default">—</Badge>;
        const n = +g;
        return <Badge color={n >= 7 ? "success" : n >= 5 ? "warning" : "error"}>{g}</Badge>;
      },
    },
  ];
  return <DataTable title={title} rowKey="id" columns={cols} rows={rows} selectable={false} />;
}
