"use client";

import { Icon, Badge } from "@/components/ui";
import { activityTypeMeta } from "@/lib/activity-meta";
import type { Activity, BadgeColor } from "@/lib/types";

/**
 * Clickable card for an activity inside a unit (Módulos / Contenido).
 * `badge` overrides the default (teacher) status pill — pass a value for the student's submission
 * state, or `null` to hide the pill entirely. Leave undefined for the teacher's activity status.
 */
export function ActivityPill({
  activity,
  onOpen,
  badge,
}: {
  activity: Activity;
  onOpen: () => void;
  badge?: { label: string; color: BadgeColor } | null;
}) {
  const [icon, color] = activityTypeMeta(activity.type);
  const pill = badge === undefined ? { label: activity.status[0], color: activity.status[1] } : badge;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--surface-card)",
        border: "none",
        borderLeft: `4px solid ${color}`,
        padding: "14px 18px",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--ring-hairline), var(--shadow-sm)",
        transition: "box-shadow .18s ease, transform .18s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}
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
      {pill ? <Badge color={pill.color}>{pill.label}</Badge> : null}
      <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: "var(--surface-sunken)", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="chevron-right" size={16} />
      </span>
    </button>
  );
}
