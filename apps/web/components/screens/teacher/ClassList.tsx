"use client";

import { useState } from "react";
import { Badge, Icon } from "@/components/ui";
import { Page, PageHead, Chip } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { classSubtitle } from "@/lib/class-label";
import type { ClassInfo } from "@/lib/types";

function CardAction({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: 32, height: 32, borderRadius: "8px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)", color: danger ? "var(--status-error)" : "var(--text-strong)", boxShadow: "var(--shadow-sm)", transition: "background .15s ease, color .15s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "var(--status-error-soft)" : "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.92)"; }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function ClassCard({ c, onOpen, onEdit, onDelete }: { c: ClassInfo; onOpen: () => void; onEdit?: () => void; onDelete?: () => void }) {
  const hasActions = !!(onEdit || onDelete);
  return (
    <div
      onClick={onOpen}
      style={{ display: "flex", flexDirection: "column", padding: 15, background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", cursor: "pointer", transition: "box-shadow .18s ease, transform .18s ease", overflow: "hidden" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-lg)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-md)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", height: 170, background: "var(--surface-sunken)" }}>
        <ClassThumb thumb={c.thumb} cover={c.coverUrl} color={c.color} icon={c.icon} name={c.name} iconSize={48} />
        {hasActions ? (
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 8 }}>
            {onEdit ? <CardAction icon="pencil" label="Editar clase" onClick={(e) => { e.stopPropagation(); onEdit(); }} /> : null}
            {onDelete ? <CardAction icon="trash" label="Eliminar clase" danger onClick={(e) => { e.stopPropagation(); onDelete(); }} /> : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "15px 5px 5px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: "var(--text-strong)" }}>{c.name}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: "var(--text-muted)" }}>{classSubtitle(c)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 4 }}>
          <Chip icon="users">{c.students} alumnos</Chip>
          <Badge color={c.status[1]}>{c.status[0]}</Badge>
        </div>
      </div>
    </div>
  );
}

/** Ghost card matching ClassCard dimensions for "Crear clase". */
function CreateClassCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        padding: 13,
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "var(--radius-xl)",
        border: `2px dashed ${hovered ? "var(--brand-primary)" : "var(--border-strong)"}`,
        background: hovered ? "var(--state-hover-tint)" : "transparent",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "background .18s ease, transform .18s ease, border-color .18s ease",
      }}
    >
      <div
        style={{
          height: 170,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md)",
          background: hovered ? "color-mix(in srgb, var(--brand-primary) 8%, transparent)" : "var(--surface-sunken)",
          color: hovered ? "var(--brand-primary)" : "var(--text-muted)",
          transition: "background .18s ease, color .18s ease",
        }}
      >
        <Icon name="plus" size={40} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "15px 5px 5px" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: hovered ? "var(--brand-primary)" : "var(--text-strong)", transition: "color .18s ease" }}>Crear clase</span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: "var(--text-muted)" }}>Añade una nueva clase</span>
      </div>
    </button>
  );
}

export function ClassList({
  classes,
  onOpenClass,
  onCreate,
  onEdit,
  onDelete,
}: {
  classes: ClassInfo[];
  onOpenClass: (c: ClassInfo) => void;
  onCreate: () => void;
  onEdit?: (c: ClassInfo) => void;
  onDelete?: (c: ClassInfo) => void;
}) {
  const totalStudents = classes.reduce((n, c) => n + c.students, 0);
  return (
    <Page>
      <PageHead
        title="Mis clases"
        subtitle={`${classes.length} ${classes.length === 1 ? "clase" : "clases"} · ${totalStudents} alumnos en total`}
      />
      <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        <CreateClassCard onClick={onCreate} />
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            c={c}
            onOpen={() => onOpenClass(c)}
            onEdit={onEdit ? () => onEdit(c) : undefined}
            onDelete={onDelete ? () => onDelete(c) : undefined}
          />
        ))}
      </div>
    </Page>
  );
}
