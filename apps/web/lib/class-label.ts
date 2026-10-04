// Texto secundario de las tarjetas de clase: la asignatura, no los códigos.

import { classThumbPreset } from "@/lib/class-thumbs";
import { CLASS_STAGE_LABEL, type ClassInfo } from "@/lib/types";

/**
 * Qué se lee bajo el nombre de la clase. Se prefiere la asignatura elegida al
 * crearla; si no la tiene, se deduce de la ilustración de la miniatura (que el
 * docente escoge por asignatura) y, en último caso, se cae al código y el aula.
 * Si la clase tiene etapa, va detrás («Matemáticas · Bachillerato»).
 */
export function classSubtitle(c: Pick<ClassInfo, "subject" | "stage" | "thumb" | "code" | "room">): string {
  const stage = c.stage ? CLASS_STAGE_LABEL[c.stage] : "";
  const subject = c.subject || classThumbPreset(c.thumb)?.label || "";
  if (subject) return [subject, stage].filter(Boolean).join(" · ");
  return [stage, c.code, c.room].filter((v) => v && v !== "—").join(" · ");
}
