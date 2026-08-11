// Copia el worker de pdf.js a public/ para poder servirlo con una ruta fija
// (/pdf.worker.min.mjs) sin depender de cómo empaquete Next los assets.
import { copyFile, mkdir } from "fs/promises";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "public", "pdf.worker.min.mjs");
const src = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");

await mkdir(dirname(dest), { recursive: true });
await copyFile(src, dest);
