"use client";

import { useEffect, useMemo, useState } from "react";
import { Page, PageHead, StatTile, EmptyState } from "@/components/layout";
import { ClassFilter } from "@/components/classes/ClassFilter";
import { GradebookTable } from "./GradebookTable";
import { useClasses } from "@/lib/api/classes";
import { useActivities, useGradebook } from "@/lib/api/classwork";

export function Gradebook() {
  const { data: classes } = useClasses();
  const list = useMemo(() => classes ?? [], [classes]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (!classId && list.length) setClassId(list[0].id);
  }, [list, classId]);

  const current = list.find((c) => c.id === classId);
  const { data: gradebook } = useGradebook(classId);
  const { data: activities } = useActivities(classId);

  const stats = useMemo(() => {
    const cells = (gradebook?.rows ?? []).flatMap((r) => r.cells);
    const scores = cells.filter((c): c is number => c != null);
    const acts = activities ?? [];
    const submitted = acts.reduce((n, a) => n + a.submitted, 0);
    const expected = acts.reduce((n, a) => n + a.total, 0);
    return {
      average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—",
      rate: expected ? `${Math.round((submitted / expected) * 100)}%` : "—",
      activities: acts.length,
      ungraded: acts.reduce((n, a) => n + a.ungraded, 0),
    };
  }, [gradebook, activities]);

  if (!list.length) {
    return (
      <Page>
        <PageHead title="Calificaciones" subtitle="Libro de notas por clase y actividad" />
        <EmptyState illo="sin-clases" title="Todavía no tienes clases" text="Crea una clase para empezar a calificar." />
      </Page>
    );
  }

  return (
    <Page>
      <PageHead
        title="Calificaciones"
        subtitle="Libro de notas por clase y actividad"
        actions={<ClassFilter classes={list} value={classId} onChange={setClassId} />}
      />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="star" value={stats.average} label="Media de la clase" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="check-circle" value={stats.rate} label="Tasa de entrega" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="clipboard-check" value={stats.activities} label="Actividades" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="clock" value={stats.ungraded} label="Notas pendientes" tint="var(--yellow-200)" fg="var(--yellow-700)" />
      </div>
      <GradebookTable data={gradebook} courseName={current?.name ?? ""} />
    </Page>
  );
}
