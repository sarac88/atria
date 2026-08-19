import { Injectable } from "@nestjs/common";
import type { CalendarEventDto } from "@atria/types";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { parseDueAt, toDateKey, toTimeLabel } from "../common/due";

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /calendar — entregas, exámenes y sesiones online de las clases que ve el
   * usuario. Devuelve todo el histórico: el cliente recorta por mes, y el volumen
   * por usuario es pequeño.
   */
  async list(user: AuthUser): Promise<CalendarEventDto[]> {
    const classes = await this.visibleClasses(user);
    if (classes.length === 0) return [];
    const classIds = classes.map((c) => c.id);
    const nameOf = new Map(classes.map((c) => [c.id, c.name]));

    // Los alumnos no ven borradores; el docente dueño y admin sí.
    const activityWhere = user.role === "alumno" ? { classId: { in: classIds }, status: { not: "draft" as const } } : { classId: { in: classIds } };

    const [activities, sessions] = await Promise.all([
      this.prisma.activity.findMany({
        where: activityWhere,
        select: { id: true, classId: true, title: true, type: true, dueAt: true },
      }),
      this.prisma.onlineSession.findMany({
        where: { startsAt: { not: null }, module: { classId: { in: classIds } } },
        select: { id: true, label: true, startsAt: true, module: { select: { classId: true } } },
      }),
    ]);

    const events: CalendarEventDto[] = [];

    for (const a of activities) {
      const date = parseDueAt(a.dueAt);
      if (!date) continue; // sin fecha reconocible no se puede situar en el calendario
      events.push({
        id: `activity:${a.id}`,
        kind: a.type === "cuestionario" ? "examen" : "entrega",
        title: a.title,
        classId: a.classId,
        className: nameOf.get(a.classId) ?? "",
        date: toDateKey(date),
        time: "",
      });
    }

    for (const s of sessions) {
      const startsAt = s.startsAt!;
      events.push({
        id: `session:${s.id}`,
        kind: "sesion",
        title: s.label,
        classId: s.module.classId,
        className: nameOf.get(s.module.classId) ?? "",
        date: toDateKey(startsAt),
        time: toTimeLabel(startsAt),
      });
    }

    return events.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }

  /** Las clases que el usuario puede ver, con el mismo criterio que GET /classes. */
  private visibleClasses(user: AuthUser) {
    const where =
      user.role === "admin"
        ? {}
        : user.role === "docente"
          ? { ownerId: user.userId }
          : { enrollments: { some: { userId: user.userId } } };
    return this.prisma.class.findMany({ where, select: { id: true, name: true } });
  }
}
