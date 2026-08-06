"use client";

import { RichView } from "@/components/ui";

/** Descripción guardada de la unidad, en un recuadro azul suave, encima de Recursos y Actividades. */
export function UnitDescription({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div
      style={{
        margin: "0 0 20px",
        padding: "14px 18px",
        borderRadius: "var(--radius-md)",
        background: "var(--info-100)",
        boxShadow: "inset 0 0 0 1px var(--info-200)",
      }}
    >
      <RichView html={text} style={{ marginTop: 0 }} />
    </div>
  );
}
