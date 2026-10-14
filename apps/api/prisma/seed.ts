// Restaura la demo: borra todo y vuelve a cargar la foto de prisma/demo
// (data.json + files/), generada con `npm run db:export-demo`. Se puede relanzar
// tantas veces como haga falta; es lo que hace el reset de la demo.
import { Prisma, PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { MODEL_ORDER } from "./demo/models";

const prisma = new PrismaClient();
const DEMO_DIR = join(__dirname, "demo");
// Igual que common/uploads.ts: la carpeta que sirve la API.
const UPLOADS_DIR = join(process.cwd(), "uploads");
const DAY = 24 * 60 * 60 * 1000;
// Las invitaciones pendientes caducan; en la demo siempre deben verse pendientes.
const INVITATION_TTL_DAYS = 7;

type Row = Record<string, unknown>;

/** Campos de un tipo dado ("DateTime", "Json") del modelo, con su nombre del cliente ("classInvitation"). */
const fieldsOf = (model: string, type: string): string[] => {
  const dm = Prisma.dmmf.datamodel.models.find((m) => m.name.toLowerCase() === model.toLowerCase());
  return dm ? dm.fields.filter((f) => f.type === type).map((f) => f.name) : [];
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const shiftIsoDay = (s: string, days: number) =>
  new Date(Date.parse(`${s}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

async function main() {
  const { exportedAt, tables } = JSON.parse(readFileSync(join(DEMO_DIR, "data.json"), "utf8")) as {
    exportedAt: string;
    tables: Record<string, Row[]>;
  };
  // Todas las fechas se adelantan los días que han pasado desde la exportación,
  // para que plazos, entregas y avisos sigan viéndose igual de recientes.
  const shiftDays = Math.max(0, Math.floor((Date.now() - Date.parse(exportedAt)) / DAY));

  for (const model of [...MODEL_ORDER].reverse()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[model].deleteMany();
  }

  for (const model of MODEL_ORDER) {
    const dates = fieldsOf(model, "DateTime");
    const jsons = fieldsOf(model, "Json");
    let rows = (tables[model] ?? []).map((row) => {
      const out: Row = { ...row };
      for (const f of dates) {
        if (typeof out[f] === "string") out[f] = new Date(Date.parse(out[f] as string) + shiftDays * DAY);
      }
      // Prisma no acepta null tal cual en un Json opcional.
      for (const f of jsons) if (out[f] === null) out[f] = Prisma.DbNull;
      return out;
    });
    if (model === "activity") {
      for (const r of rows) if (typeof r.dueAt === "string" && ISO_DAY.test(r.dueAt)) r.dueAt = shiftIsoDay(r.dueAt, shiftDays);
    }
    if (model === "classInvitation") {
      for (const r of rows) if (r.status === "pending") r.expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * DAY);
    }
    // Las respuestas de un debate apuntan a su post raíz: primero las raíces.
    if (model === "debatePost") rows = [...rows].sort((a, b) => Number(a.parentId != null) - Number(b.parentId != null));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (rows.length) await (prisma as any)[model].createMany({ data: rows });
  }

  // Ficheros: uploads/ queda sólo con los de la demo.
  mkdirSync(UPLOADS_DIR, { recursive: true });
  for (const name of readdirSync(UPLOADS_DIR)) {
    if (!name.startsWith(".")) rmSync(join(UPLOADS_DIR, name), { recursive: true, force: true });
  }
  const filesDir = join(DEMO_DIR, "files");
  const files = existsSync(filesDir) ? readdirSync(filesDir) : [];
  for (const name of files) copyFileSync(join(filesDir, name), join(UPLOADS_DIR, name));

  const counts = MODEL_ORDER.map((m) => `${m}: ${tables[m]?.length ?? 0}`).join(", ");
  console.log(`Demo restaurada (fechas +${shiftDays} días). ${counts}. Ficheros: ${files.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
