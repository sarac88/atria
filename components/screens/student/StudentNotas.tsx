"use client";

import { Page, PageHead, StatTile } from "@/components/layout";
import { StudentGradesTable } from "./StudentGradesTable";

export function StudentNotas() {
  return (
    <Page>
      <PageHead title="Mis notas" subtitle="Cálculo II · media 6.7" />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="star" value="6.7" label="Media del curso" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="check-circle" value="3/4" label="Actividades entregadas" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="clipboard-check" value="1" label="Pendiente de nota" tint="var(--yellow-200)" fg="var(--yellow-700)" />
        <StatTile icon="grid" value="82%" label="Progreso" tint="var(--info-100)" fg="var(--info-600)" />
      </div>
      <StudentGradesTable />
    </Page>
  );
}
