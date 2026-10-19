"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, Panel, ProgressBar, EmptyState } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { DASH_GAP, UpcomingSessionsCard, WeekSchedule, ellipsis } from "@/components/dashboard/DashboardBlocks";
import { useSettings } from "@/components/settings/SettingsContext";
import { useUpcomingSessions } from "@/lib/api/classes";
import { useCalendarEvents } from "@/lib/api/calendar";
import { useStudentTasks } from "@/lib/api/classwork";
import { activityTypeMeta } from "@/lib/activity-meta";
import { dueBadge, parseDue } from "@/lib/due";
import { firstName } from "@/lib/session";
import type { CalendarEventDto, ClassInfo, StudentTaskDto } from "@/lib/types";

const UPCOMING = 3;

/** Cursos que caben en la fila inferior antes de mandar a la lista completa. */
const COURSE_LIST = 4;

/** Pendientes ordenadas por plazo; las que no tienen fecha reconocible van al final. */
function upcoming(tasks: StudentTaskDto[]): StudentTaskDto[] {
  return tasks
    .filter((t) => !t.mySubmission)
    .map((t) => ({ task: t, at: parseDue(t.due)?.getTime() ?? Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.at - b.at)
    .slice(0, UPCOMING)
    .map((e) => e.task);
}

function TaskCard({ task, onOpen }: { task: StudentTaskDto; onOpen: () => void }) {
  const [icon, color] = activityTypeMeta(task.type);
  const badge = dueBadge(task.due);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%" }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${color} 16%, var(--surface-card))`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", display: "block", ...ellipsis }}>{task.title}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1, display: "block", ...ellipsis }}>{task.className}</span>
      </span>
      <Badge color={badge.color}>{badge.label}</Badge>
    </button>
  );
}

export function StudentDashboard({ classes, onOpenClass, onNav }: { classes: ClassInfo[]; onOpenClass: (c: ClassInfo) => void; onNav: (key: string) => void }) {
  const router = useRouter();
  const { user } = useSettings();
  const { data: tasks, isLoading } = useStudentTasks();
  const { data: sessions } = useUpcomingSessions();
  const { data: events } = useCalendarEvents();

  const stats = useMemo(() => {
    const list = tasks ?? [];
    return { pending: list.filter((t) => !t.mySubmission).length, next: upcoming(list) };
  }, [tasks]);

  const greeting = firstName(user);
  const subtitle = isLoading
    ? "Cargando tu actividad…"
    : stats.pending === 0
      ? "No tienes tareas pendientes. ¡Buen trabajo!"
      : stats.pending === 1
        ? "Tienes 1 tarea pendiente."
        : `Tienes ${stats.pending} tareas pendientes.`;

  // Las entregas y exámenes se gestionan desde «Tareas»; las videollamadas, desde la clase.
  const openEvent = (e: CalendarEventDto) => (e.kind === "sesion" ? router.push(`/clase/${e.classId}`) : onNav("tareas"));

  return (
    <Page width={1320}>
      <PageHead
        title={<span>Hola{greeting ? `, ${greeting}` : ""} <span style={{ fontFamily: "system-ui" }}>👋</span></span>}
      />

      {/* La misma rejilla que el inicio del docente: cada fila alinea la altura de sus dos columnas. */}
      <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: DASH_GAP }}>
        <div style={{ minWidth: 0 }}>
          <Panel title="Próximas entregas" action={<span style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "right" }}>{subtitle}</span>}>
            {stats.next.length ? (
              <div className="atria-classgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {stats.next.map((task) => <TaskCard key={task.id} task={task} onOpen={() => onNav("tareas")} />)}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "4px 2px" }}>
                {isLoading ? "Cargando…" : "No tienes entregas pendientes."}
              </div>
            )}
          </Panel>
        </div>

        <div style={{ minWidth: 0 }}>
          <WeekSchedule events={events ?? []} onOpenEvent={openEvent} onCalendar={() => onNav("calendario")} />
        </div>

        <UpcomingSessionsCard sessions={sessions ?? []} />

        <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 20, margin: 0 }}>Mis cursos</h3>
            {classes.length > COURSE_LIST ? <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todos</Button> : null}
          </div>
          {classes.length ? (
            <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: `repeat(${COURSE_LIST}, minmax(0, 1fr))`, gap: DASH_GAP }}>
              {classes.slice(0, COURSE_LIST).map((c) => (
                <Card key={c.id} title={c.name} subtitle={c.code} interactive media={<ClassThumb thumb={c.thumb} cover={c.coverUrl} color={c.color} icon={c.icon} name={c.name} iconSize={46} />} onClick={() => onOpenClass(c)} footer={<div style={{ width: "100%" }}><ProgressBar value={c.progress} showLabel /></div>} />
              ))}
            </div>
          ) : (
            <EmptyState illo="sin-cursos" title="Aún no estás en ningún curso" text="Cuando te matriculen en un curso aparecerá aquí." />
          )}
        </div>
      </div>
    </Page>
  );
}
