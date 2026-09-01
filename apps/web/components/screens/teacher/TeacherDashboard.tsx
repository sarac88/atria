"use client";

import { useMemo } from "react";
import { Card, Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, StatTile, Chip, Panel, EmptyState } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { useSettings } from "@/components/settings/SettingsContext";
import { useConversations } from "@/lib/api/messaging";
import { useNotifications } from "@/lib/api/notifications";
import { firstName } from "@/lib/session";
import type { ClassInfo, NotificationType } from "@/lib/types";

const TYPE_META: Record<NotificationType, { icon: string; tint: string; fg: string }> = {
  submission: { icon: "document-add", tint: "var(--info-100)", fg: "var(--info-600)" },
  grade: { icon: "star", tint: "var(--success-100)", fg: "var(--success-600)" },
  deadline: { icon: "clock", tint: "var(--warning-200)", fg: "var(--warning-600)" },
  invite: { icon: "envelope", tint: "var(--yellow-200)", fg: "var(--yellow-700)" },
  system: { icon: "bell", tint: "var(--primary-100)", fg: "var(--primary-600)" },
};

export function TeacherDashboard({ classes, onOpenClass, onCreate, onNav }: { classes: ClassInfo[]; onOpenClass: (c: ClassInfo) => void; onCreate: () => void; onNav: (key: string) => void }) {
  const { user } = useSettings();
  const { data: conversations } = useConversations();
  const { data: notifications } = useNotifications();

  const stats = useMemo(() => {
    return {
      active: classes.filter((c) => c.state === "live").length,
      review: classes.reduce((n, c) => n + c.pending, 0),
      students: classes.reduce((n, c) => n + c.students, 0),
      unread: (conversations ?? []).reduce((n, c) => n + c.unread, 0),
    };
  }, [classes, conversations]);

  /** Clases con entregas esperando nota — la lista de "pendiente" real del docente. */
  const toReview = useMemo(
    () => classes.filter((c) => c.pending > 0).sort((a, b) => b.pending - a.pending).slice(0, 5),
    [classes],
  );

  const feed = (notifications?.items ?? []).slice(0, 5);
  const greeting = firstName(user);
  const subtitle = stats.review === 0
    ? "No tienes entregas pendientes de revisar."
    : stats.review === 1
      ? "Tienes 1 entrega pendiente de revisar."
      : `Tienes ${stats.review} entregas pendientes de revisar.`;

  return (
    <Page>
      <PageHead
        title={<span>Hola{greeting ? `, ${greeting}` : ""} <span style={{ fontFamily: "system-ui" }}>👋</span></span>}
        subtitle={subtitle}
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={onCreate}>Crear clase</Button>}
      />

      <div className="atria-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "calc(18px * var(--d,1))", marginBottom: "calc(28px * var(--d,1))" }}>
        <StatTile icon="academic-cap" value={stats.active} label="Clases activas" tint="var(--primary-100)" fg="var(--primary-600)" />
        <StatTile icon="clipboard-check" value={stats.review} label="Entregas por revisar" tint="var(--yellow-200)" fg="var(--yellow-700)" />
        <StatTile icon="users" value={stats.students} label="Alumnos" tint="var(--info-100)" fg="var(--info-600)" />
        <StatTile icon="chat" value={stats.unread} label="Mensajes sin leer" tint="var(--success-100)" fg="var(--success-600)" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "calc(28px * var(--d,1))" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 20, margin: 0 }}>Mis clases</h3>
            {classes.length > 4 ? <Button variant="link" size="small" onClick={() => onNav("clases")}>Ver todas</Button> : null}
          </div>
          {classes.length ? (
            <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
              {classes.slice(0, 4).map((c) => (
                <Card
                  key={c.id}
                  title={c.name}
                  subtitle={c.room ? `${c.code} · ${c.room}` : c.code}
                  interactive
                  media={<ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={46} />}
                  onClick={() => onOpenClass(c)}
                  footer={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Chip icon="users">{c.students}</Chip>
                      <Badge color={c.status[1]}>{c.status[0]}</Badge>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              illo="empty-classes"
              title="Todavía no tienes clases"
              text="Crea tu primera clase para empezar a publicar contenido y actividades."
              action={<Button variant="accent" onClick={onCreate} iconLeft={<Icon name="plus" size={16} />}>Crear clase</Button>}
            />
          )}
        </div>

        <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "calc(20px * var(--d,1))", alignItems: "start" }}>
          <Panel title="Actividad reciente" pad={6}>
            {feed.length ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {feed.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.system;
                  return (
                    <div key={n.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", borderRadius: "var(--radius-md)" }}>
                      <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "var(--radius-sm)", background: meta.tint, color: meta.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={18} />
                      </span>
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
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "10px 14px" }}>Todavía no hay actividad en tus clases.</div>
            )}
          </Panel>

          <Panel title="Pendiente de revisar">
            {toReview.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {toReview.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenClass(c)}
                    style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "9px 6px", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)" }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--state-hover-tint)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "var(--radius-sm)", background: c.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={c.icon} size={17} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.pending} {c.pending === 1 ? "entrega sin nota" : "entregas sin nota"}</span>
                    </span>
                    <Badge color="warning">{c.pending}</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>No tienes entregas esperando nota.</div>
            )}
          </Panel>
        </div>
      </div>
    </Page>
  );
}
