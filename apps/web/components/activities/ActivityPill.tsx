"use client";

import { useState } from "react";
import { Icon, Badge } from "@/components/ui";
import { activityTypeMeta } from "@/lib/activity-meta";
import type { Activity, BadgeColor } from "@/lib/types";

/**
 * Clickable card for an activity inside a unit (Módulos / Contenido).
 * `badge` overrides the default (teacher) status pill — pass a value for the student's submission
 * state, or `null` to hide the pill entirely. Leave undefined for the teacher's activity status.
 * Con `onEdit`/`onDelete` muestra, al pasar el ratón, los botones de editar y eliminar.
 */
export function ActivityPill({
  activity,
  onOpen,
  badge,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  onOpen: () => void;
  badge?: { label: string; color: BadgeColor } | null;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [icon, color] = activityTypeMeta(activity.type);
  const pill = badge === undefined ? { label: activity.status[0], color: activity.status[1] } : badge;
  // Un <div> con rol de botón: dentro van los botones de editar/eliminar, y un
  // <button> no puede contener otros.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--surface-card)",
        border: "none",
        borderLeft: `10px solid ${color}`,
        padding: "14px 18px",
        borderRadius: "var(--radius-sm)",
        boxShadow: hovered ? "var(--ring-hairline), var(--shadow-md)" : "var(--ring-hairline), var(--shadow-sm)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "box-shadow .18s ease, transform .18s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false); }}
    >
      <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 16%, #fff)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activity.title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12.5, color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
            {activity.type}
          </span>
          {activity.points ? <span>· {activity.points} pts</span> : null}
          {activity.due ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>· <Icon name="calendar" size={13} /> {activity.due}</span> : null}
        </span>
      </span>
      {onEdit || onDelete ? (
        <span style={{ display: "flex", gap: 6, opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none", transition: "opacity .15s ease" }}>
          {onEdit ? <PillAction icon="pencil" label="Editar actividad" color="var(--primary-600)" onClick={onEdit} /> : null}
          {onDelete ? <PillAction icon="trash" label="Eliminar actividad" color="var(--status-error)" onClick={onDelete} /> : null}
        </span>
      ) : null}
      {pill ? <Badge color={pill.color}>{pill.label}</Badge> : null}
      <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: "var(--surface-sunken)", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="chevron-right" size={16} />
      </span>
    </div>
  );
}

function PillAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ width: 32, height: 32, border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: "rgba(255,255,255,0.92)", color, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/** Ghost pill matching ActivityPill dimensions for "Nueva actividad". */
export function AddActivityPill({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const fg = hovered ? "var(--primary-600)" : "var(--text-muted)";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: hovered ? "var(--state-hover-tint)" : "transparent",
        border: "2px dashed var(--border-strong)",
        /* left padding keeps the icon aligned with ActivityPill's (10px colour bar + 18px) */
        padding: "12px 18px 12px 26px",
        borderRadius: "var(--radius-sm)",
        transition: "background .18s ease, transform .18s ease, border-color .18s ease",
        transform: hovered ? "translateY(-1px)" : "none",
        ...(hovered ? { borderColor: "var(--brand-primary)" } : {}),
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: "var(--radius-md)",
          background: hovered ? "color-mix(in srgb, var(--brand-primary) 14%, #fff)" : "var(--surface-sunken)",
          color: fg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background .18s ease, color .18s ease",
        }}
      >
        <Icon name="plus" size={22} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 700,
            color: fg,
            transition: "color .18s ease",
          }}
        >
          Nueva actividad
        </span>
      </span>
    </button>
  );
}
