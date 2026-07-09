"use client";

import { useState } from "react";
import { Badge, Icon } from "@/components/ui";
import { ResourceThumb } from "./ResourceThumb";
import { openResource } from "@/lib/resources";
import type { BadgeColor, ModuleItem } from "@/lib/types";

const MOD_BADGE: Record<string, BadgeColor> = { Nuevo: "new", Abierto: "info", Visto: "default", Completado: "success" };

export function ResourceCard({
  item,
  canDelete,
  onView,
  onDelete,
  extra,
}: {
  item: ModuleItem;
  canDelete?: boolean;
  onView: (item: ModuleItem) => void;
  onDelete?: (item: ModuleItem) => void;
  extra?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const clickable = !!item.url || !!item.type;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        boxShadow: hovered && clickable ? "var(--ring-hairline), var(--shadow-md)" : "var(--ring-hairline), var(--shadow-sm)",
        background: "var(--surface-card)",
        overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        transform: hovered && clickable ? "translateY(-1px)" : "none",
        transition: "box-shadow .15s ease, transform .15s ease",
      }}
      onClick={() => openResource(item, onView)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ResourceThumb item={item} />

      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.label}
        </div>
        {item.meta ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.meta}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, minHeight: 24 }}>
          {item.state ? <Badge color={MOD_BADGE[item.state] || "default"}>{item.state}</Badge> : null}
          {extra}
        </div>
      </div>

      {canDelete && onDelete ? (
        <button
          type="button"
          aria-label="Eliminar recurso"
          title="Eliminar recurso"
          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            background: "rgba(255,255,255,0.92)",
            color: "var(--status-error)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
            opacity: hovered ? 1 : 0,
            transition: "opacity .15s ease",
          }}
        >
          <Icon name="trash" size={16} />
        </button>
      ) : null}
    </div>
  );
}
