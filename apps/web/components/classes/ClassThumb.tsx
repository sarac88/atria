"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui";
import { classThumbPreset } from "@/lib/class-thumbs";

/**
 * Miniatura de una clase: la ilustración elegida o, si no hay ninguna, el par
 * color + icono de siempre. Rellena el hueco que le den (las tarjetas ya fijan
 * alto y recorte), así que se ve igual en el listado, el panel y el modal.
 */
export function ClassThumb({
  thumb,
  color,
  icon,
  name,
  iconSize = 46,
  style,
}: {
  thumb?: string;
  color?: string;
  icon?: string;
  /** Nombre de la clase, para el texto alternativo de la ilustración. */
  name?: string;
  iconSize?: number;
  style?: CSSProperties;
}) {
  const preset = classThumbPreset(thumb);
  const base: CSSProperties = { width: "100%", height: "100%", display: "block", ...style };

  if (preset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preset.src}
        alt={name ? `Miniatura de ${name}` : ""}
        style={{ ...base, objectFit: "cover", background: preset.tint }}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color || "var(--primary-500)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      <Icon name={icon || "academic-cap"} size={iconSize} />
    </div>
  );
}
