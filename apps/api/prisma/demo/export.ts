// Vuelca la base de datos actual a prisma/demo/data.json y copia a
// prisma/demo/files los ficheros subidos que esos datos usan. Es la foto de la
// demo que restaura seed.ts: rellena la demo desde la interfaz y ejecuta
// `npm run db:export-demo` (desde apps/api) para fijarla.
import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { MODEL_ORDER } from "./models";

const prisma = new PrismaClient();
const UPLOADS_DIR = join(process.cwd(), "uploads");
const FILES_DIR = join(__dirname, "files");

async function main() {
  const tables: Record<string, unknown[]> = {};
  for (const model of MODEL_ORDER) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tables[model] = await (prisma as any)[model].findMany({ orderBy: { createdAt: "asc" } });
  }
  // Las sesiones abiertas no forman parte de la demo.
  for (const u of tables.user as { hashedRefreshToken: string | null }[]) u.hashedRefreshToken = null;

  writeFileSync(
    join(__dirname, "data.json"),
    JSON.stringify({ exportedAt: new Date().toISOString(), tables }, null, 2) + "\n",
  );

  // Cualquier "/uploads/<key>" que aparezca en los datos, más las claves de File.
  const keys = new Set<string>((tables.file as { key: string }[]).map((f) => f.key));
  for (const m of JSON.stringify(tables).matchAll(/\/uploads\/([\w.-]+)/g)) keys.add(m[1]);

  rmSync(FILES_DIR, { recursive: true, force: true });
  mkdirSync(FILES_DIR, { recursive: true });
  const missing: string[] = [];
  for (const key of keys) {
    const src = join(UPLOADS_DIR, key);
    if (existsSync(src)) copyFileSync(src, join(FILES_DIR, key));
    else missing.push(key);
  }

  const counts = Object.entries(tables).map(([m, rows]) => `${m}: ${rows.length}`).join(", ");
  console.log(`Demo exportada. ${counts}. Ficheros: ${keys.size - missing.length}.`);
  if (missing.length) console.warn(`Faltan en uploads/: ${missing.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
