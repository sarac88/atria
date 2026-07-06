"use client";

import type { ReactNode } from "react";
import { Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, Chip } from "@/components/layout";
import type { ClassInfo } from "@/lib/types";

function cover(bg: string, icon: string): ReactNode {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: "rgba(255,255,255,0.92)" }}>
      <Icon name={icon} size={48} />
    </div>
  );
}

function CardAction({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: 32, height: 32, borderRadius: "8px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--gray-100)", color: danger ? "var(--status-error)" : "var(--text-muted)", transition: "background .15s ease, color .15s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "var(--status-error-soft)" : "var(--gray-200)"; e.currentTarget.style.color = danger ? "var(--status-error)" : "var(--text-strong)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gray-100)"; e.currentTarget.style.color = danger ? "var(--status-error)" : "var(--text-muted)"; }}
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
      {hasActions ? (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, height: 32, marginBottom: 12 }}>
          {onEdit ? <CardAction icon="pencil" label="Editar clase" onClick={(e) => { e.stopPropagation(); onEdit(); }} /> : null}
          {onDelete ? <CardAction icon="trash" label="Eliminar clase" danger onClick={(e) => { e.stopPropagation(); onDelete(); }} /> : null}
        </div>
      ) : null}

      <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", height: 170, background: "var(--surface-sunken)" }}>
        {cover(c.color, c.icon)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "15px 5px 5px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24, lineHeight: 1.2, color: "var(--text-strong)" }}>{c.name}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, lineHeight: 1.3, color: "var(--text-muted)" }}>{c.code + " · " + c.room}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 4 }}>
          <Chip icon="users">{c.students} alumnos</Chip>
          <Badge color={c.status[1]}>{c.status[0]}</Badge>
        </div>
      </div>
    </div>
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
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={onCreate}>Crear clase</Button>}
      />
      <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
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
