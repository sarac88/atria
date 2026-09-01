// Ilustraciones de la miniatura de una clase. La clase guarda sólo el
// identificador (ClassInfo.thumb); la imagen vive en public/thumbs.

import type { ClassThumbId } from "@atria/types";

export interface ClassThumbPreset {
  id: ClassThumbId;
  label: string;
  src: string;
  /** Color de fondo de la ilustración: se usa mientras carga y en los bordes. */
  tint: string;
}

export const CLASS_THUMB_PRESETS: ClassThumbPreset[] = [
  { id: "math", label: "Matemáticas", src: "/thumbs/math.webp", tint: "#a8ccf5" },
  { id: "science", label: "Naturales", src: "/thumbs/science.webp", tint: "#c8e6a0" },
  { id: "physics", label: "Física y Química", src: "/thumbs/physics.webp", tint: "#a9ddcf" },
  { id: "literature", label: "Lengua", src: "/thumbs/literature.webp", tint: "#c3a8f2" },
  { id: "history", label: "Historia", src: "/thumbs/history.webp", tint: "#fbd684" },
  { id: "art", label: "Arte", src: "/thumbs/art.webp", tint: "#f9bcd0" },
];

const BY_ID = new Map(CLASS_THUMB_PRESETS.map((t) => [t.id as string, t]));

/** Devuelve la ilustración guardada, o null si la clase usa color + icono. */
export function classThumbPreset(thumb: string | undefined): ClassThumbPreset | null {
  return thumb ? BY_ID.get(thumb) ?? null : null;
}

/** Estrecha lo que llega de la API a una ilustración conocida. */
export function isClassThumb(thumb: string | undefined): thumb is ClassThumbId {
  return !!thumb && BY_ID.has(thumb);
}

export type { ClassThumbId };
