"use client";

import { Icon, Badge } from "@/components/ui";
import { activityTypeMeta } from "@/lib/activity-meta";
import type { Activity } from "@/lib/types";

/** Compact clickable row for an activity inside a unit (Módulos / Contenido). */
export function ActivityPill({ activity, onOpen }: { activity: Activity; onOpen: () => void }) {
  const [icon, color] = activityTypeMeta(activity.type);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: "transparent", padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", transition: "background .15s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${color} 14%, #fff)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activity.title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
          {activity.type}
          {activity.points ? ` · ${activity.points} pts` : ""}
          {activity.due ? ` · vence ${activity.due}` : ""}
        </span>
      </span>
      <Badge color={activity.status[1]}>{activity.status[0]}</Badge>
      <Icon name="chevron-right" size={18} color="var(--text-muted)" />
    </button>
  );
}
