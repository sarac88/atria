"use client";

import { useMemo } from "react";
import { Page, PageHead, StatTile, EmptyState } from "@/components/layout";
import { StudentGradesTable, type GradeRow } from "./StudentGradesTable";
import { useStudentTasks } from "@/lib/api/classwork";

/** Notas de todos los cursos del alumno, derivadas de sus entregas. */
export function StudentNotas() {
  const { data: tasks, isLoading } = useStudentTasks();

  const { rows, courses, average, submitted, total, awaiting } = useMemo(() => {
    const list = tasks ?? [];
    const rows: GradeRow[] = list
      .filter((t) => !!t.mySubmission)
      .map((t) => ({ ...t.mySubmission!, className: t.className }));
    const scores = rows.map((r) => Number(r.grade)).filter((n) => Number.isFinite(n));
    return {
      rows,
      courses: new Set(list.map((t) => t.className)).size,
      average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—",
      submitted: rows.length,
      total: list.length,
      awaiting: rows.length - scores.length,
    };
  }, [tasks]);

  const subtitle = isLoading
    ? "Cargando tus notas…"
    : total === 0
      ? "Todavía no tienes actividades"
      : `${courses} ${courses === 1 ? "curso" : "cursos"} · media ${average}`;

  return (
    <Page>
      <PageHead title="Mis notas" subtitle={subtitle} />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="star" value={average} label="Nota media" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="check-circle" value={`${submitted}/${total}`} label="Actividades entregadas" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="clipboard-check" value={awaiting} label="Pendiente de nota" tint="var(--yellow-200)" fg="var(--yellow-700)" />
        <StatTile icon="grid" value={total ? `${Math.round((submitted / total) * 100)}%` : "—"} label="Progreso" tint="var(--info-100)" fg="var(--info-600)" />
      </div>
      {rows.length ? (
        <StudentGradesTable rows={rows} showClass />
      ) : !isLoading ? (
        <EmptyState
          illo="empty-submissions"
          title="Aún no tienes notas"
          text="Cuando entregues una actividad y tu profesorado la califique, la verás aquí."
        />
      ) : null}
    </Page>
  );
}
