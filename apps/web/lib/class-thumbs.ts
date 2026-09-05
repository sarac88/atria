// Ilustraciones de la miniatura de una clase. La clase guarda sólo el
// identificador (ClassInfo.thumb); la imagen vive en public/thumbs.

import type { ClassThumbId } from "@atria/types";

export interface ClassThumbPreset {
  id: ClassThumbId;
  label: string;
  src: string;
  /** Banner de la cabecera de la clase (misma temática que la miniatura). */
  headerSrc: string;
  /** Color de fondo de la ilustración: se usa mientras carga y en los bordes. */
  tint: string;
  /** Tono oscuro del mismo color: raya de pestaña y acentos sobre el pastel. */
  ink: string;
}

export const CLASS_THUMB_PRESETS: ClassThumbPreset[] = [
  { id: "math", label: "Matemáticas", src: "/thumbs/math.webp", headerSrc: "/headers/math.png", tint: "#a8ccf5", ink: "#1e4a8c" },
  { id: "science", label: "Naturales", src: "/thumbs/science.webp", headerSrc: "/headers/science.png", tint: "#c8e6a0", ink: "#3d6b1e" },
  { id: "physics", label: "Física y Química", src: "/thumbs/physics.webp", headerSrc: "/headers/physics.png", tint: "#a9ddcf", ink: "#1a6b5a" },
  { id: "literature", label: "Lengua", src: "/thumbs/literature.webp", headerSrc: "/headers/literature.png", tint: "#c3a8f2", ink: "#5b2d9e" },
  { id: "history", label: "Historia", src: "/thumbs/history.webp", headerSrc: "/headers/history.png", tint: "#fbd684", ink: "#8a5a12" },
  { id: "art", label: "Arte", src: "/thumbs/art.webp", headerSrc: "/headers/art.png", tint: "#f9bcd0", ink: "#9b2d5a" },
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
