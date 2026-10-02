// Ilustraciones de una clase. La clase guarda sólo el identificador
// (ClassInfo.thumb); la imagen vive en public/class-art y sirve a la vez de
// miniatura y de cabecera. Se generan y preparan con scripts/class-art-prompts.md
// y scripts/process-class-art.py.

import { CLASS_THUMBS, type ClassThumbId } from "@atria/types";

export type ClassThumbSubject = "math" | "science" | "physics" | "literature" | "history" | "art";

export const CLASS_THUMB_SUBJECTS: { id: ClassThumbSubject; label: string }[] = [
  { id: "math", label: "Matemáticas" },
  { id: "science", label: "Naturales" },
  { id: "physics", label: "Física y Química" },
  { id: "literature", label: "Lengua" },
  { id: "history", label: "Historia" },
  { id: "art", label: "Arte" },
];

export interface ClassThumbPreset {
  id: ClassThumbId;
  subject: ClassThumbSubject;
  /** Nombre de la asignatura de la ilustración. */
  label: string;
  src: string;
  /** Color liso del fondo de la imagen (medido por el script): fondo de la cabecera. */
  bg: string;
}

/** Fondo medido en cada imagen; si se regeneran, copiar la salida del script. */
const BACKGROUNDS: Record<ClassThumbId, string> = {
  "math-1": "#2e59a8", "math-2": "#314459", "math-3": "#be285e",
  "science-1": "#2a7752", "science-2": "#176b89", "science-3": "#5d6524",
  "physics-1": "#1d7772", "physics-2": "#5b3b93", "physics-3": "#26477f",
  "literature-1": "#6847a6", "literature-2": "#8b3234", "literature-3": "#295b62",
  "history-1": "#9d4f28", "history-2": "#704729", "history-3": "#435e3b",
  "art-1": "#b34024", "art-2": "#b2326c", "art-3": "#395898",
};

const SUBJECT_LABEL = new Map(CLASS_THUMB_SUBJECTS.map((s) => [s.id, s.label]));

export const CLASS_THUMB_PRESETS: ClassThumbPreset[] = CLASS_THUMBS.map((id) => {
  const subject = id.slice(0, id.lastIndexOf("-")) as ClassThumbSubject;
  return { id, subject, label: SUBJECT_LABEL.get(subject)!, src: `/class-art/${id}.webp`, bg: BACKGROUNDS[id] };
});

/** Cabecera cuando la clase usa color + icono: fondo oscuro y raya pastel. */
const COLOR_HEADERS: Record<string, { ink: string; tint: string }> = {
  "var(--primary-500)": { ink: "var(--primary-500)", tint: "var(--brand-accent)" },
  "var(--yellow-500)": { ink: "var(--yellow-700)", tint: "var(--yellow-300)" },
  "var(--info-500)": { ink: "var(--info-700)", tint: "var(--info-300)" },
  "var(--success-500)": { ink: "var(--success-600)", tint: "var(--success-200)" },
  "var(--warning-500)": { ink: "var(--warning-600)", tint: "var(--warning-300)" },
};

const FALLBACK_HEADER = { ink: "var(--primary-500)", tint: "var(--brand-accent)" };

/** Fondo y raya de la cabecera: el fondo de la ilustración si hay, si no el par color. */
export function classHeaderTheme(thumb: string | undefined, color: string | undefined): { ink: string; tint: string } {
  const preset = classThumbPreset(thumb);
  if (preset) return { ink: preset.bg, tint: "#fff" };
  return (color && COLOR_HEADERS[color]) || FALLBACK_HEADER;
}

const BY_ID = new Map(CLASS_THUMB_PRESETS.map((t) => [t.id as string, t]));

/**
 * Devuelve la ilustración guardada, o null si la clase usa color + icono. Las
 * clases anteriores a las variantes guardan sólo la asignatura ("math"): se
 * leen como su primera variante.
 */
export function classThumbPreset(thumb: string | undefined): ClassThumbPreset | null {
  if (!thumb) return null;
  return BY_ID.get(thumb) ?? BY_ID.get(`${thumb}-1`) ?? null;
}

export type { ClassThumbId };
