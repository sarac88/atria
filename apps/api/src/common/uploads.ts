import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { diskStorage } from "multer";
import { BadRequestException } from "@nestjs/common";

/** Carpeta local donde se guardan los ficheros subidos (recursos, entregas…). */
export const UPLOADS_DIR = join(process.cwd(), "uploads");
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

/** Ruta pública (servida como estática) desde la que se descarga un fichero. */
export const uploadUrl = (key: string) => `/uploads/${key}`;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Config de Multer para recursos de módulo: guarda en disco con nombre aleatorio. */
export const resourceUploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req: unknown, file: { originalname: string; mimetype: string }, cb: (err: Error | null, ok: boolean) => void) => {
    const ext = extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.has(ext) && ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    return cb(new BadRequestException("Solo se admiten ficheros PDF, DOC o DOCX."), false);
  },
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Config de Multer para imágenes (portada de curso). */
export const imageUploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req: unknown, file: { originalname: string; mimetype: string }, cb: (err: Error | null, ok: boolean) => void) => {
    const ext = extname(file.originalname).toLowerCase();
    if (IMAGE_EXT.has(ext) && IMAGE_MIME.has(file.mimetype)) return cb(null, true);
    return cb(new BadRequestException("Solo se admiten imágenes JPG, PNG, WEBP o GIF."), false);
  },
};

/** Tamaño legible (p. ej. "1.2 MB") para el texto meta del recurso. */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
