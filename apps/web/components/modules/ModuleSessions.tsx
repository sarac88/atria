"use client";

import { useState } from "react";
import { Badge, Button, Icon } from "@/components/ui";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { OnlineSessionModal } from "@/components/modals/OnlineSessionModal";
import { MEETING_BRAND } from "@/components/icons/brand-glyphs";
import { useDeleteOnlineSession } from "@/lib/api/classwork";
import { sessionSchedule, type SessionTone } from "@/lib/online-sessions";
import { MEETING_PROVIDER_LABEL, type BadgeColor, type OnlineSessionDto } from "@/lib/types";

const TONE_BADGE: Partial<Record<SessionTone, { label: string; color: BadgeColor }>> = {
  live: { label: "En directo", color: "success" },
  soon: { label: "Próxima", color: "info" },
  past: { label: "Finalizada", color: "default" },
};

function openMeeting(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Botón discreto (lápiz, papelera, copiar) que aparece al pasar por la fila. */
function RowAction({ icon, label, danger, visible, onClick }: { icon: string; label: string; danger?: boolean; visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        background: "transparent",
        color: danger ? "var(--status-error)" : "var(--text-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity .15s ease, background .15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function SessionRow({
  session,
  canManage,
  onEdit,
  onDelete,
}: {
  session: OnlineSessionDto;
  canManage?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const brand = MEETING_BRAND[session.provider];
  const color = brand?.color ?? "var(--primary-500)";
  const schedule = sessionSchedule(session.startsAt);
  const badge = TONE_BADGE[schedule.tone];
  const past = schedule.tone === "past";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso de portapapeles: el enlace sigue accesible desde «Entrar» */
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--surface-card)",
        borderLeft: `10px solid ${color}`,
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        boxShadow: hover ? "var(--ring-hairline), var(--shadow-md)" : "var(--ring-hairline), var(--shadow-sm)",
        opacity: past ? 0.72 : 1,
        transition: "box-shadow .18s ease, opacity .18s ease",
      }}
    >
      <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 16%, #fff)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {brand ? brand.glyph(24) : <Icon name="video-camera" size={22} />}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {session.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12.5, color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
            {MEETING_PROVIDER_LABEL[session.provider]}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            · <Icon name={session.startsAt ? "calendar" : "clock"} size={13} /> {schedule.label}
          </span>
        </div>
      </div>

      {badge ? <Badge color={badge.color}>{badge.label}</Badge> : null}

      <RowAction icon={copied ? "check" : "clipboard"} label={copied ? "Enlace copiado" : "Copiar enlace"} visible={hover || copied} onClick={copy} />
      {canManage ? (
        <>
          <RowAction icon="pencil" label="Editar sesión" visible={hover} onClick={onEdit} />
          <RowAction icon="trash" label="Eliminar sesión" danger visible={hover} onClick={onDelete} />
        </>
      ) : null}

      <Button
        size="small"
        variant={past ? "outline" : "accent"}
        iconLeft={<Icon name="external-link" size={16} />}
        onClick={() => openMeeting(session.url)}
      >
        Entrar
      </Button>
    </div>
  );
}

/** Fila fantasma para añadir una sesión, al estilo de AddActivityPill. */
function AddSessionRow({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const fg = hover ? "var(--primary-600)" : "var(--text-muted)";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: hover ? "var(--state-hover-tint)" : "transparent",
        border: "2px dashed var(--border-strong)",
        /* el padding izquierdo alinea el icono con el de SessionRow (barra de 10px + 16px) */
        padding: "10px 16px 10px 24px",
        borderRadius: "var(--radius-sm)",
        transition: "background .18s ease, border-color .18s ease",
        ...(hover ? { borderColor: "var(--brand-primary)" } : {}),
      }}
    >
      <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", background: hover ? "color-mix(in srgb, var(--brand-primary) 14%, #fff)" : "var(--surface-sunken)", color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .18s ease, color .18s ease" }}>
        <Icon name="plus" size={22} />
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: fg, transition: "color .18s ease" }}>Añadir sesión online</span>
    </button>
  );
}

/**
 * Enlaces de videollamada de una unidad. Con `canManage` el docente puede
 * añadir, editar y borrar; el alumno sólo entra o copia el enlace.
 */
export function ModuleSessions({
  classId,
  moduleId,
  moduleTitle,
  sessions,
  canManage,
}: {
  classId: string;
  moduleId: string;
  moduleTitle?: string;
  sessions: OnlineSessionDto[];
  canManage?: boolean;
}) {
  const deleteSession = useDeleteOnlineSession(classId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<OnlineSessionDto | null>(null);
  const [deleting, setDeleting] = useState<OnlineSessionDto | null>(null);

  if (!sessions.length && !canManage) return null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            canManage={canManage}
            onEdit={() => setEditing(s)}
            onDelete={() => setDeleting(s)}
          />
        ))}
        {canManage ? <AddSessionRow onClick={() => setAdding(true)} /> : null}
      </div>

      {adding ? (
        <OnlineSessionModal classId={classId} moduleId={moduleId} moduleTitle={moduleTitle} onClose={() => setAdding(false)} />
      ) : null}

      {editing ? (
        <OnlineSessionModal classId={classId} moduleId={moduleId} session={editing} onClose={() => setEditing(null)} />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Eliminar sesión online"
          message={<>¿Seguro que quieres eliminar «{deleting.label}»? Tus alumnos dejarán de ver el enlace.</>}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteSession.mutateAsync(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}
    </>
  );
}
