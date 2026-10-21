"use client";

import { Fragment, useMemo, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Icon, Avatar } from "@/components/ui";
import { DASH_GAP, UpcomingSessionsCard, WeekSchedule, ellipsis } from "@/components/dashboard/DashboardBlocks";
import { Page, PageHead, Panel, Chip, EmptyState } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { useSettings } from "@/components/settings/SettingsContext";
import { useTeacherOverview, useUpcomingSessions } from "@/lib/api/classes";
import { useCalendarEvents } from "@/lib/api/calendar";
import { resourceUrl } from "@/lib/api/client";
import { useNotifications } from "@/lib/api/notifications";
import { classSubtitle } from "@/lib/class-label";
import { firstName } from "@/lib/session";
import type { CalendarEventDto, ClassInfo, NotificationType, OverviewStudentDto } from "@/lib/types";

const TYPE_META: Record<NotificationType, { icon: string; tint: string; fg: string }> = {
  submission: { icon: "document-add", tint: "var(--info-100)", fg: "var(--info-600)" },
  grade: { icon: "star", tint: "var(--success-100)", fg: "var(--success-600)" },
  deadline: { icon: "clock", tint: "var(--warning-200)", fg: "var(--warning-600)" },
  invite: { icon: "envelope", tint: "var(--yellow-200)", fg: "var(--yellow-700)" },
  system: { icon: "bell", tint: "var(--primary-100)", fg: "var(--primary-600)" },
};

/** Clases que caben en «Mis clases» antes de mandar a la lista completa. */
const CLASS_LIST = 5;

/** Alumnos que enseña el tablero; el resto se ve en cada clase. */
const STUDENT_LIST = 6;

/** Altura común de la fila inferior (actividad, clases, alumnos); lo que no cabe hace scroll. */
const BOTTOM_ROW_HEIGHT = 340;

/** Separador entre filas de una lista, más suave que el borde de los paneles. */
const ROW_DIVIDER: CSSProperties = { height: 1, background: "color-mix(in srgb, var(--border-subtle) 55%, transparent)", margin: "3px 0" };

/** Verde, ámbar o rojo según lo bien que va el alumno. */
function participationColor(p: number): string {
  if (p >= 0.75) return "var(--status-success)";
  if (p >= 0.4) return "var(--status-warning)";
  return "var(--status-error)";
}

function IconTile({ icon, tint, fg, size = 40 }: { icon: string; tint: string; fg: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, flexShrink: 0, borderRadius: "var(--radius-md)", background: tint, color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

function StudentRow({ s }: { s: OverviewStudentDto }) {
  const pct = Math.round(s.participation * 100);
  const color = participationColor(s.participation);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <Avatar name={s.name} src={s.avatarUrl ? resourceUrl(s.avatarUrl) : undefined} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", ...ellipsis }}>{s.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", ...ellipsis }}>{s.classes.join(" · ")}</div>
      </div>
      <div style={{ width: 64, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }} title={`${s.submitted} de ${s.total} actividades entregadas`}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
        <span style={{ width: "100%", height: 4, borderRadius: 999, background: "var(--surface-sunken)", overflow: "hidden" }}>
          <span style={{ display: "block", width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
        </span>
      </div>
    </div>
  );
}

function StudentsPanel({ students }: { students: OverviewStudentDto[] }) {
  const avg = students.length ? students.reduce((n, s) => n + s.participation, 0) / students.length : 0;
  const atRisk = students.filter((s) => s.participation < 0.4).length;
  return (
    <Panel title="Alumnos inscritos" action={<Badge color="default">{students.length}</Badge>} scroll style={{ height: BOTTOM_ROW_HEIGHT }}>
      {students.length ? (
        <>
          <div style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--ring-hairline)", padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1 }}>{Math.round(avg * 100)}%</span>
              <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text-strong)" }}>participación</strong> media
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: atRisk ? "var(--status-error)" : "var(--text-muted)", marginTop: 8 }}>
              {atRisk ? `${atRisk} ${atRisk === 1 ? "alumno entrega" : "alumnos entregan"} menos del 40 % de las actividades` : "Todos entregan al menos el 40 % de las actividades"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {students.slice(0, STUDENT_LIST).map((s) => <StudentRow key={s.id} s={s} />)}
          </div>
        </>
      ) : (
        <EmptyState compact illo="foro-tranquilo" text="Todavía no hay alumnos matriculados en tus clases." />
      )}
    </Panel>
  );
}

/** Una clase con entregas sin nota, al estilo de las tarjetas de «Próximas entregas» del alumno. */
function ReviewCard({ c, onOpen }: { c: ClassInfo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%" }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "var(--radius-sm)", overflow: "hidden", display: "inline-flex" }}>
        <ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", display: "block", ...ellipsis }}>{c.name}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1, display: "block", ...ellipsis }}>{c.pending === 1 ? "entrega sin nota" : "entregas sin nota"}</span>
      </span>
      <Badge color="warning">{c.pending}</Badge>
    </button>
  );
}

function ClassRow({ c, onOpen }: { c: ClassInfo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", border: "none", borderRadius: "var(--radius-lg)", background: "transparent", cursor: "pointer", padding: "10px 8px", fontFamily: "var(--font-sans)", transition: "background .15s ease" }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
    >
      <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-md)", overflow: "hidden", display: "inline-flex" }}>
        <ClassThumb thumb={c.thumb} cover={c.coverUrl} color={c.color} icon={c.icon} name={c.name} iconSize={20} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)", display: "block", ...ellipsis }}>{c.name}</span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", display: "block", ...ellipsis }}>{classSubtitle(c)}</span>
      </span>
      <Chip icon="users">{c.students}</Chip>
      <Badge color={c.status[1]}>{c.status[0]}</Badge>
    </button>
  );
}

export function TeacherDashboard({ classes, onOpenClass, onCreate, onNav }: { classes: ClassInfo[]; onOpenClass: (c: ClassInfo) => void; onCreate: () => void; onNav: (key: string) => void }) {
  const router = useRouter();
  const { user } = useSettings();
  const { data: overview } = useTeacherOverview();
  const { data: events } = useCalendarEvents();
  const { data: notifications } = useNotifications();

  const review = useMemo(() => classes.reduce((n, c) => n + c.pending, 0), [classes]);
  /** Clases con entregas esperando nota, las más cargadas primero. */
  const toReview = useMemo(() => classes.filter((c) => c.pending > 0).sort((a, b) => b.pending - a.pending), [classes]);
  const feed = (notifications?.items ?? []).slice(0, 5);
  const { data: sessions } = useUpcomingSessions();

  const greeting = firstName(user);
  const subtitle = review === 0
    ? "No tienes entregas pendientes de revisar."
    : review === 1
      ? "Tienes 1 entrega pendiente de revisar."
      : `Tienes ${review} entregas pendientes de revisar.`;

  const openEvent = (e: CalendarEventDto) => {
    const tab = e.kind === "sesion" ? "modulos" : "entregas";
    const activity = e.id.startsWith("activity:") ? `&activity=${e.id.slice("activity:".length)}` : "";
    router.push(`/clase/${e.classId}?tab=${tab}${activity}`);
  };
  const openReview = (c: ClassInfo) => router.push(`/clase/${c.id}?tab=entregas`);

  return (
    <Page width={1320}>
      <PageHead
        title={<span>Hola{greeting ? `, ${greeting}` : ""} <span style={{ fontFamily: "system-ui" }}>👋</span></span>}
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={onCreate}>Crear clase</Button>}
      />

      {/* Una sola rejilla: cada fila alinea la altura de sus dos columnas. */}
      <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: DASH_GAP }}>
        <div style={{ minWidth: 0 }}>
          <Panel
            title="Pendientes de revisar"
            action={review ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{subtitle}</span>
                <Badge color="warning">{review}</Badge>
              </span>
            ) : undefined}
          >
            {toReview.length ? (
              <div className="atria-classgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {toReview.map((c) => <ReviewCard key={c.id} c={c} onOpen={() => openReview(c)} />)}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "4px 2px" }}>{subtitle}</div>
            )}
          </Panel>
        </div>

        <div style={{ minWidth: 0 }}>
          <WeekSchedule events={events ?? []} onOpenEvent={openEvent} onCalendar={() => router.push("/calendario")} />
        </div>

        <UpcomingSessionsCard sessions={sessions ?? []} />

        <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)", gap: DASH_GAP, minWidth: 0 }}>
          <Panel title="Actividad reciente" pad={6} scroll style={{ height: BOTTOM_ROW_HEIGHT }}>
            {feed.length ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feed.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.system;
                  return (
                    <div key={n.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px" }}>
                      <IconTile icon={meta.icon} tint={meta.tint} fg={meta.fg} size={34} />
                      <div style={{ fontSize: 13.5, lineHeight: 1.4, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{n.title}</span>{" "}
                        <span style={{ color: "var(--text-body)" }}>{n.body}</span>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact illo="foro-tranquilo" text="Todavía no hay actividad en tus clases." />
            )}
          </Panel>

          <Panel title="Mis clases" pad={10} scroll style={{ height: BOTTOM_ROW_HEIGHT }} action={classes.length > CLASS_LIST ? <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todas</Button> : undefined}>
            {classes.length ? (
              // El padding lateral alinea las filas con la línea bajo el título del panel.
              <div style={{ display: "flex", flexDirection: "column", padding: "0 10px" }}>
                {classes.map((c, i) => (
                  <Fragment key={c.id}>
                    {i ? <span aria-hidden="true" style={ROW_DIVIDER} /> : null}
                    <ClassRow c={c} onOpen={() => onOpenClass(c)} />
                  </Fragment>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                illo="sin-clases"
                text="Todavía no tienes clases."
                action={<Button variant="accent" size="small" onClick={onCreate} iconLeft={<Icon name="plus" size={16} />}>Crear clase</Button>}
              />
            )}
          </Panel>
        </div>

        <StudentsPanel students={overview?.students ?? []} />
      </div>
    </Page>
  );
}
