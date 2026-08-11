"use client";

import { useState } from "react";
import { Badge, Icon } from "@/components/ui";
import { ResourceThumb } from "./ResourceThumb";
import { openResource } from "@/lib/resources";
import type { BadgeColor, ModuleItem } from "@/lib/types";

const MOD_BADGE: Record<string, BadgeColor> = { Nuevo: "new", Abierto: "info", Visto: "default", Completado: "success" };

const actionStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.92)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--shadow-sm)",
};

export function ResourceCard({
  item,
  canDelete,
  onView,
  onEdit,
  onDelete,
  extra,
}: {
  item: ModuleItem;
  canDelete?: boolean;
  onView: (item: ModuleItem) => void;
  onEdit?: (item: ModuleItem) => void;
  onDelete?: (item: ModuleItem) => void;
  extra?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const clickable = !!item.url || !!item.type;
  // Los enlaces antiguos guardaban la URL en `meta`: en la card solo queremos el título.
  const meta = item.meta && !/^https?:\/\//i.test(item.meta) ? item.meta : null;

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
        {meta ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta}
          </div>
        ) : null}
        {item.state || extra ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, minHeight: 24 }}>
            {item.state ? <Badge color={MOD_BADGE[item.state] || "default"}>{item.state}</Badge> : null}
            {extra}
          </div>
        ) : null}
      </div>

      {canDelete && (onEdit || onDelete) ? (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, opacity: hovered ? 1 : 0, transition: "opacity .15s ease" }}>
          {onEdit ? (
            <button
              type="button"
              aria-label="Editar recurso"
              title="Editar recurso"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              style={{ ...actionStyle, color: "var(--text-body)" }}
            >
              <Icon name="pencil" size={16} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              aria-label="Eliminar recurso"
              title="Eliminar recurso"
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              style={{ ...actionStyle, color: "var(--status-error)" }}
            >
              <Icon name="trash" size={16} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
