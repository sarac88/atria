// Texto secundario de las tarjetas de clase: la asignatura, no los códigos.

import { classThumbPreset } from "@/lib/class-thumbs";
import type { ClassInfo } from "@/lib/types";

/**
 * Qué se lee bajo el nombre de la clase. Se prefiere la asignatura elegida al
 * crearla; si no la tiene, se deduce de la ilustración de la miniatura (que el
 * docente escoge por asignatura) y, en último caso, se cae al código y el aula.
 */
export function classSubtitle(c: Pick<ClassInfo, "subject" | "thumb" | "code" | "room">): string {
  if (c.subject) return c.subject;
  const preset = classThumbPreset(c.thumb);
  if (preset) return preset.label;
  return [c.code, c.room].filter((v) => v && v !== "—").join(" · ");
}
