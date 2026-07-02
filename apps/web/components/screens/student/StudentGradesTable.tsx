"use client";

import { DataTable, Badge, type Column } from "@/components/ui";
import { useMyGrades } from "@/lib/api/classwork";
import type { SubmissionDto } from "@/lib/types";

export function StudentGradesTable({ classId = "calc2" }: { classId?: string }) {
  const { data } = useMyGrades(classId);
  const rows = data ?? [];
  const cols: Column<SubmissionDto>[] = [
    { key: "activity", label: "Actividad", render: (v) => <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{v as string}</span> },
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
  return <DataTable title="Mis notas" rowKey="id" columns={cols} rows={rows} selectable={false} />;
}
