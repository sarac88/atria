"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

/** Ghost card matching ResourceCard dimensions for "Añadir recurso". */
export function AddResourceCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Flex column: los <button> centran su contenido en vertical, y al estirarse
        // en la rejilla el bloque gris se despegaba de la parte de arriba.
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "var(--radius-lg)",
        border: "2px dashed var(--border-strong)",
        background: hovered ? "var(--state-hover-tint)" : "transparent",
        overflow: "hidden",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "background .15s ease, transform .15s ease, border-color .15s ease",
        ...(hovered ? { borderColor: "var(--brand-primary)" } : {}),
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 9",
          width: "100%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hovered ? "color-mix(in srgb, var(--brand-primary) 8%, transparent)" : "var(--surface-sunken)",
          borderRadius: "calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0",
          color: hovered ? "var(--brand-primary)" : "var(--text-muted)",
          transition: "background .15s ease, color .15s ease",
        }}
      >
        <Icon name="plus" size={32} />
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: hovered ? "var(--brand-primary)" : "var(--text-muted)",
            lineHeight: 1.3,
            transition: "color .15s ease",
          }}
        >
          Añadir recurso
        </div>
      </div>
    </button>
  );
}
