"use client";

import { Button, Icon, Badge } from "@/components/ui";
import { Modal, Eyebrow, ProgressBar } from "@/components/layout";
import { activityTypeMeta } from "@/lib/activity-meta";
import type { Activity, Role } from "@/lib/types";

const HTML_RE = /<\/?[a-z][\s\S]*>/i;

/** Renders rich-text HTML (from the activity editor), or plain text with preserved line breaks for legacy content. */
function RichView({ html, lineHeight }: { html: string; lineHeight: number }) {
  if (!HTML_RE.test(html)) {
    return <p style={{ fontSize: 14, lineHeight, color: "var(--text-body)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{html}</p>;
  }
  return (
    <>
      <div
        className="atria-richview"
        style={{ fontSize: 14, lineHeight, color: "var(--text-body)", marginTop: 8 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style jsx global>{`
        .atria-richview > * {
          margin: 0 0 8px;
        }
        .atria-richview > *:last-child {
          margin-bottom: 0;
        }
        .atria-richview h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-strong);
        }
        .atria-richview ul,
        .atria-richview ol {
          padding-left: 22px;
        }
        .atria-richview ul {
          list-style: disc;
        }
        .atria-richview ol {
          list-style: decimal;
        }
        .atria-richview li {
          margin: 2px 0;
        }
        .atria-richview li > p {
          margin: 0;
        }
        .atria-richview a {
          color: var(--primary-600);
          text-decoration: underline;
        }
        .atria-richview img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 4px 0;
        }
      `}</style>
    </>
  );
}

function configSummary(a: Activity): string | null {
  const c = a.config;
  if (!c) return null;
  if (a.type === "Cuestionario" && c.questions?.length) {
    const parts = [`${c.questions.length} pregunta${c.questions.length === 1 ? "" : "s"}`];
    if (c.quiz?.timeLimitMin) parts.push(`${c.quiz.timeLimitMin} min`);
    if (c.quiz?.attempts) parts.push(`${c.quiz.attempts} intento(s)`);
    return parts.join(" · ");
  }
  if (a.type === "Debate" && c.debate?.openingQuestion) return c.debate.openingQuestion;
  return null;
}

export function ActivityDetailModal({
  activity,
  role,
  onClose,
  onSubmit,
  onGrade,
}: {
  activity: Activity;
  role: Role;
  onClose: () => void;
  onSubmit?: (activityId: string) => void;
  onGrade?: (activityId: string) => void;
}) {
  const [icon, color] = activityTypeMeta(activity.type);
  const summary = configSummary(activity);
  const isTeacher = role !== "alumno";
  const pct = activity.total ? activity.submitted / activity.total : 0;

  const footer = isTeacher ? (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      {onGrade ? <Button variant="accent" iconLeft={<Icon name="clipboard-check" size={16} />} onClick={() => onGrade(activity.id)}>Ver entregas y calificar</Button> : null}
    </>
  ) : (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      {onSubmit ? <Button variant="accent" iconLeft={<Icon name="upload" size={16} />} onClick={() => onSubmit(activity.id)}>Entregar</Button> : null}
    </>
  );

  return (
    <Modal title="Actividad" onClose={onClose} footer={footer} width={900}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 14%, #fff)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={22} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{activity.title}</h2>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            {activity.type}{activity.points ? ` · ${activity.points} pts` : ""}{activity.due ? ` · vence ${activity.due}` : ""}
          </div>
        </div>
        <Badge color={activity.status[1]}>{activity.status[0]}</Badge>
      </div>

      {activity.desc ? (
        <div style={{ marginTop: 18 }}>
          <Eyebrow>Instrucciones</Eyebrow>
          <RichView html={activity.desc} lineHeight={1.6} />
        </div>
      ) : null}

      {summary ? (
        <div style={{ marginTop: 18 }}>
          <Eyebrow>{activity.type === "Debate" ? "Pregunta de apertura" : "Detalles"}</Eyebrow>
          <RichView html={summary} lineHeight={1.5} />
        </div>
      ) : null}

      {isTeacher ? (
        <div style={{ marginTop: 20, padding: 16, borderRadius: "var(--radius-lg)", background: "var(--surface-sunken)", boxShadow: "var(--ring-hairline)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <Eyebrow>Entregas</Eyebrow>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{activity.submitted} de {activity.total} entregadas</span>
          </div>
          <ProgressBar value={pct} />
        </div>
      ) : null}
    </Modal>
  );
}
