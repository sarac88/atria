"use client";

import { Button, Select, Icon } from "@/components/ui";
import { Page, PageHead, StatTile } from "@/components/layout";
import { GradebookTable } from "./GradebookTable";

export function Gradebook() {
  return (
    <Page>
      <PageHead
        title="Calificaciones"
        subtitle="Libro de notas por clase y actividad"
        actions={
          <>
            <div style={{ width: 200 }}>
              <Select defaultValue="calc2" options={[{ label: "Cálculo II", value: "calc2" }, { label: "Física General", value: "fisica" }, { label: "Lengua y Literatura", value: "lengua" }]} />
            </div>
            <Button variant="outline" iconLeft={<Icon name="download" size={16} />}>Exportar</Button>
          </>
        }
      />
      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatTile icon="star" value="7.6" label="Media de la clase" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="check-circle" value="88%" label="Tasa de entrega" tint="var(--success-100)" fg="var(--success-600)" />
        <StatTile icon="clipboard-check" value="3" label="Actividades calificadas" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="clock" value="8" label="Notas pendientes" tint="var(--yellow-200)" fg="var(--yellow-700)" />
      </div>
      <GradebookTable />
    </Page>
  );
}
