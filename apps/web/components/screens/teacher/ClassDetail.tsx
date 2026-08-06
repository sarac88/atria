"use client";

import { useEffect, useState } from "react";
import { DataTable, Badge, Button, Icon, Avatar, Select, RichText, type Column } from "@/components/ui";
import { Chip, Panel, EmptyState, ClassShell, ProgressBar } from "@/components/layout";
import { Donut } from "@/components/charts";
import { GradebookTable } from "./GradebookTable";
import { GradeModal } from "@/components/modals/GradeModal";
import { AddResourceModal } from "@/components/modals/AddResourceModal";
import { ActivityDetailModal } from "@/components/modals/ActivityDetailModal";
import { CreateActivityModal } from "@/components/modals/CreateActivityModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { ModuleResourceGrid } from "@/components/modules/ModuleResourceGrid";
import { UnitDescription } from "@/components/modules/UnitDescription";
import { ActivityPill } from "@/components/activities/ActivityPill";
import { DebateBoard } from "@/components/activities/DebateBoard";
import {
  useActivities,
  useCreateModule,
  useDebateThread,
  useDeleteActivity,
  useGradebook,
  useGradeSubmission,
  useModules,
  useRoster,
  useSubmissions,
  useUpdateModule,
} from "@/lib/api/classwork";
import { useSettings, type ModLayout } from "@/components/settings/SettingsContext";
import { activityTypeMeta } from "@/lib/activity-meta";
import { buildUnits, NONE_UNIT } from "@/lib/units";
import type { Activity, BadgeColor, ClassInfo, SubmissionDto } from "@/lib/types";

const SECTION_LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 };

/** "Actividades" section for a unit — simple clickable rows, empty note if none. */
function UnitActivities({ activities, onOpen }: { activities: Activity[]; onOpen: (a: Activity) => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={SECTION_LABEL}>Actividades</div>
      {activities.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activities.map((a) => <ActivityPill key={a.id} activity={a} onOpen={() => onOpen(a)} />)}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No hay actividades en esta unidad.</div>
      )}
    </div>
  );
}

const statusMap: Record<string, BadgeColor> = { Entregado: "success", Pendiente: "warning", Atrasado: "error", Borrador: "default" };

/** Horizontal chip strip to switch between activities in the Entregas tab. */
function ActivityChipStrip({
  activities,
  value,
  onChange,
}: {
  activities: Activity[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (!activities.length) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "4px 2px 12px",
        scrollbarWidth: "thin",
      }}
    >
      {activities.map((a) => {
        const active = a.id === value;
        const nuevas = a.ungraded ?? 0;
        const [icon, color] = activityTypeMeta(a.type);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              maxWidth: 260,
              padding: "8px 14px",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: active ? "var(--primary-100)" : "var(--surface-card)",
              boxShadow: active ? "inset 0 0 0 1.5px var(--brand-primary)" : "var(--ring-hairline), var(--shadow-sm)",
              transition: "background .15s ease, box-shadow .15s ease",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "var(--primary-100)" : "var(--surface-card)"; }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                borderRadius: "var(--radius-sm)",
                background: `color-mix(in srgb, ${color} 14%, #fff)`,
                color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={icon} size={16} />
            </span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: active ? 700 : 600,
                color: active ? "var(--brand-primary)" : "var(--text-strong)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {a.title}
            </span>
            {nuevas > 0 ? (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 20,
                  height: 20,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: active ? "var(--brand-primary)" : "var(--warning-100)",
                  color: active ? "#fff" : "var(--warning-700)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {nuevas}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const TYPE_META: Record<string, [string, string]> = {
  Tarea: ["document-text", "var(--success-500)"],
  Cuestionario: ["clipboard-check", "var(--info-500)"],
  Proyecto: ["folder", "var(--warning-500)"],
  Ensayo: ["document-text", "var(--primary-500)"],
  Debate: ["chat", "var(--primary-500)"],
};
const typeMeta = (t: string): [string, string] => TYPE_META[t] || ["document-text", "var(--primary-500)"];

function modParts(title: string): [string, string] {
  const ix = title.indexOf("·");
  return ix === -1 ? [title, ""] : [title.slice(0, ix).trim(), title.slice(ix + 1).trim()];
}
/** Ghost button that expands into a small inline text field (crear unidad/recurso). */
function AddInline({ label, onAdd, pending }: { label: string; onAdd: (value: string) => void; pending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const commit = () => {
    const v = val.trim();
    if (!v) return;
    onAdd(v);
    setVal("");
    setOpen(false);
  };
  if (!open) {
    return (
      <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start", marginTop: 6 }} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Escribe y pulsa Enter…"
        style={{ flex: 1, minWidth: 200, maxWidth: 320, height: 36, padding: "0 12px", border: "none", borderRadius: "var(--radius-sm)", boxShadow: "inset 0 0 0 1px var(--border-default)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", background: "#fff" }}
      />
      <Button size="small" variant="accent" disabled={!val.trim() || pending} onClick={commit}>Añadir</Button>
      <Button size="small" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
    </div>
  );
}

const UNIT_FIELD: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border-default)",
  fontFamily: "var(--font-sans)",
  color: "var(--text-strong)",
  background: "#fff",
};

/** Botón discreto para abrir la edición de una unidad. */
function UnitEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Editar unidad"
      title="Editar unidad"
      onClick={onClick}
      style={{ width: 32, height: 32, flexShrink: 0, border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: "transparent", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .15s ease, color .15s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; e.currentTarget.style.color = "var(--primary-600)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
    >
      <Icon name="pencil" size={16} />
    </button>
  );
}

/** Formulario en línea para renombrar la unidad y editar su descripción. */
function UnitEditForm({
  title,
  description,
  pending,
  onSave,
  onCancel,
}: {
  title: string;
  description: string;
  pending?: boolean;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(title);
  const [desc, setDesc] = useState(description);
  const commit = () => {
    const v = val.trim();
    if (!v) return;
    onSave(v, desc.trim());
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Nombre de la unidad"
        aria-label="Nombre de la unidad"
        style={{ ...UNIT_FIELD, height: 42, padding: "0 12px", fontSize: 16, fontWeight: 700 }}
      />
      <RichText
        value={desc}
        onChange={setDesc}
        placeholder="Descripción de la unidad (opcional)"
        minHeight={110}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="small" variant="accent" disabled={!val.trim() || pending} onClick={commit}>Guardar</Button>
        <Button size="small" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function ModulesRailLayout({ classId, flat, onGrade }: { classId: string; flat?: boolean; onGrade: (activityId: string) => void }) {
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const createModule = useCreateModule(classId);
  const updateModule = useUpdateModule(classId);
  const list = modules ?? [];
  const { units, actsOf } = buildUnits(list, activities ?? []);
  const [editing, setEditing] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [addTo, setAddTo] = useState<{ id: string; title: string } | null>(null);
  const [detail, setDetail] = useState<Activity | null>(null);
  useEffect(() => {
    if ((!sel || !units.some((m) => m.id === sel)) && units.length) setSel(units[0].id);
  }, [units, sel]);
  const current = units.find((m) => m.id === sel) || units[0];
  const chrome = flat
    ? { background: "#fff", boxShadow: "none", borderRadius: 0, padding: "8px 0" }
    : { background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", padding: "24px 28px" };

  return (
    <>
    <div className="atria-2col atria-modules" style={{ display: "grid", gridTemplateColumns: "256px 1fr", gap: 0, alignItems: "start", ...chrome }}>
      <div className="atria-modules-rail" style={{ display: "flex", flexDirection: "column", paddingRight: 28, borderRight: "1px solid var(--border-subtle)", position: "sticky", top: 0, borderColor: "rgb(237, 236, 236)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 12px" }}>Unidades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {units.map((m) => {
            const active = m.id === (current?.id ?? "");
            const [lead, sub] = modParts(m.title);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSel(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", cursor: "pointer", width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", background: active ? "var(--primary-100)" : "transparent", transition: "background .15s ease" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: m.done ? "var(--success-100)" : "var(--surface-soft)", color: m.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={m.done ? "check" : "book-open"} size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "var(--brand-primary)" : "var(--text-strong)" }}>{lead}</span>
                  {sub ? <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{sub}</span> : null}
                </span>
              </button>
            );
          })}
          {units.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 8px" }}>Aún no hay unidades.</div> : null}
        </div>
        <AddInline label="Añadir unidad" pending={createModule.isPending} onAdd={(title) => createModule.mutate({ title })} />
      </div>

      {current ? (
        <div key={current.id} style={{ paddingLeft: 28 }}>
          {editing === current.id ? (
            <UnitEditForm
              title={current.title}
              description={current.description}
              pending={updateModule.isPending}
              onCancel={() => setEditing(null)}
              onSave={(title, description) => {
                updateModule.mutate({ id: current.id, title, description });
                setEditing(null);
              }}
            />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: current.done ? "var(--success-100)" : "var(--surface-soft)", color: current.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={current.done ? "check" : "book-open"} size={18} />
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                  <h3 style={{ fontSize: 18, margin: 0 }}>{current.title}</h3>
                  {current.id !== NONE_UNIT ? <UnitEditButton onClick={() => setEditing(current.id)} /> : null}
                </span>
                <span style={{ flex: 1 }} />
                {current.id !== NONE_UNIT ? <Chip>{current.items.length} recursos</Chip> : null}
              </div>
              <UnitDescription text={current.description} />
            </>
          )}
          {current.id !== NONE_UNIT ? (
            <>
              <div style={SECTION_LABEL}>Recursos</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ModuleResourceGrid
                  classId={classId}
                  items={current.items}
                  canDelete
                  onAdd={() => setAddTo({ id: current.id, title: current.title })}
                />
              </div>
            </>
          ) : null}
          <UnitActivities activities={actsOf(current.id)} onOpen={setDetail} />
        </div>
      ) : (
        <div style={{ paddingLeft: 28, color: "var(--text-muted)", fontSize: 14 }}>Crea la primera unidad para empezar.</div>
      )}
    </div>
    {addTo ? <AddResourceModal classId={classId} moduleId={addTo.id} moduleTitle={addTo.title} onClose={() => setAddTo(null)} onDone={() => setAddTo(null)} /> : null}
    {detail ? <ActivityDetailModal activity={detail} role="docente" onClose={() => setDetail(null)} onGrade={(id) => { setDetail(null); onGrade(id); }} /> : null}
    </>
  );
}

function ModulesAccordion({ classId, onGrade }: { classId: string; onGrade: (activityId: string) => void }) {
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const createModule = useCreateModule(classId);
  const updateModule = useUpdateModule(classId);
  const list = modules ?? [];
  const { units, actsOf } = buildUnits(list, activities ?? []);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [addTo, setAddTo] = useState<{ id: string; title: string } | null>(null);
  const [detail, setDetail] = useState<Activity | null>(null);
  useEffect(() => {
    if (!open && units.length) setOpen(units[0].id);
  }, [units, open]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {units.map((m) => {
        const expanded = m.id === open;
        const isNone = m.id === NONE_UNIT;
        const [lead, sub] = modParts(m.title);
        return (
          <div key={m.id} style={{ background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : m.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: "transparent", padding: "16px 20px", transition: "background .15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%", background: m.done ? "var(--success-100)" : "var(--surface-soft)", color: m.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={m.done ? "check" : "book-open"} size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{lead}</span>
                {sub ? <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>{sub}</span> : null}
              </span>
              <Chip>{isNone ? `${actsOf(m.id).length} actividades` : `${m.items.length} recursos`}</Chip>
              <span style={{ color: "var(--text-muted)", display: "inline-flex", transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "none" }}>
                <Icon name="chevron-down" size={20} />
              </span>
            </button>
            {expanded ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px 18px", borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                {!isNone ? (
                  editing === m.id ? (
                    <UnitEditForm
                      title={m.title}
                      description={m.description}
                      pending={updateModule.isPending}
                      onCancel={() => setEditing(null)}
                      onSave={(title, description) => {
                        updateModule.mutate({ id: m.id, title, description });
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {m.description.trim()
                          ? <UnitDescription text={m.description} />
                          : <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-muted)" }}>Sin descripción.</p>}
                      </div>
                      <UnitEditButton onClick={() => setEditing(m.id)} />
                    </div>
                  )
                ) : null}
                {!isNone ? (
                  <>
                    <div style={SECTION_LABEL}>Recursos</div>
                    <ModuleResourceGrid
                      classId={classId}
                      items={m.items}
                      canDelete
                      onAdd={() => setAddTo({ id: m.id, title: m.title })}
                    />
                  </>
                ) : null}
                <UnitActivities activities={actsOf(m.id)} onOpen={setDetail} />
              </div>
            ) : null}
          </div>
        );
      })}
      {units.length === 0 ? <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Aún no hay unidades.</div> : null}
      <AddInline label="Añadir unidad" pending={createModule.isPending} onAdd={(title) => createModule.mutate({ title })} />
      {addTo ? <AddResourceModal classId={classId} moduleId={addTo.id} moduleTitle={addTo.title} onClose={() => setAddTo(null)} onDone={() => setAddTo(null)} /> : null}
      {detail ? <ActivityDetailModal activity={detail} role="docente" onClose={() => setDetail(null)} onGrade={(id) => { setDetail(null); onGrade(id); }} /> : null}
    </div>
  );
}

function ClassModules({ classId, layout, onGrade }: { classId: string; layout: ModLayout; onGrade: (activityId: string) => void }) {
  if (layout === "plano") return <ModulesRailLayout classId={classId} flat onGrade={onGrade} />;
  if (layout === "acordeon") return <ModulesAccordion classId={classId} onGrade={onGrade} />;
  return <ModulesRailLayout classId={classId} onGrade={onGrade} />;
}

function ClassStudents({ classId }: { classId: string }) {
  const { data: roster } = useRoster(classId);
  const rows = (roster ?? []).map((s) => ({ ...s, avgStr: s.avg.toFixed(1) }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "name", label: "Alumno", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "email", label: "Correo", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "progress", label: "Progreso", render: (v) => <div style={{ width: 120 }}><ProgressBar value={v as number} showLabel /></div> },
    { key: "avgStr", label: "Media", render: (v) => <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{v as string}</span> },
  ];
  return <DataTable title={`Alumnos · ${rows.length}`} rowKey="id" columns={cols} rows={rows} selectable={false} toolbar={<Button size="small" variant="outline" iconLeft={<Icon name="plus" size={16} />}>Invitar</Button>} />;
}

function OverviewActivityCard({
  activity,
  moduleLabel,
  onOpen,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  moduleLabel: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [tIcon, tColor] = typeMeta(activity.type);
  const meta = [
    activity.type,
    activity.points ? `${activity.points} pts` : "",
    activity.due ? `vence ${activity.due}` : "",
    moduleLabel,
  ].filter(Boolean).join(" · ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-card)",
        boxShadow: hovered ? "var(--ring-hairline), var(--shadow-md)" : "var(--ring-hairline), var(--shadow-sm)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "box-shadow .15s ease, transform .15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <span style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${tColor} 14%, #fff)`, color: tColor, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={tIcon} size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{activity.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            opacity: hovered ? 1 : 0,
            transition: "opacity .15s ease",
          }}
        >
          <button
            type="button"
            aria-label="Editar actividad"
            title="Editar actividad"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: "rgba(255,255,255,0.92)",
              color: "var(--primary-600)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Icon name="pencil" size={16} />
          </button>
          <button
            type="button"
            aria-label="Eliminar actividad"
            title="Eliminar actividad"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
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
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{activity.submitted}/{activity.total}</span>
        <Badge type="solid" color={activity.status[1]}>{activity.status[0]}</Badge>
      </div>
    </div>
  );
}

function ClassOverview({ c, onGrade }: { c: ClassInfo; onGrade: (activityId: string) => void }) {
  const { data: activities } = useActivities(c.id);
  const { data: modules } = useModules(c.id);
  const deleteActivity = useDeleteActivity(c.id);
  const [detail, setDetail] = useState<Activity | null>(null);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);

  const moduleLabelOf = (moduleId?: string) => {
    if (!moduleId) return "Sin módulo";
    const mod = (modules ?? []).find((m) => m.id === moduleId);
    if (!mod) return "Sin módulo";
    const [lead] = modParts(mod.title);
    return lead;
  };

  const details = [
    { icon: "academic-cap", label: "Código", value: c.code, tint: "var(--primary-100)", fg: "var(--primary-600)" },
    { icon: "home", label: "Aula", value: c.room, tint: "var(--info-100)", fg: "var(--info-600)" },
    { icon: "users", label: "Alumnos", value: c.students, tint: "var(--success-100)", fg: "var(--success-600)" },
    { icon: "clipboard-check", label: "Entregas pendientes", value: c.pending, tint: "var(--yellow-200)", fg: "var(--yellow-700)" },
    { icon: "calendar", label: "Próxima sesión", value: c.nextSession, tint: "var(--info-100)", fg: "var(--info-600)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {details.map((x) => (
          <div key={x.label} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: x.tint, color: x.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={x.icon} size={24} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.1 }}>{x.value}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>{x.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22, alignItems: "stretch" }} className="atria-2col">
        <Panel title="Actividades">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(activities ?? []).map((a) => (
              <OverviewActivityCard
                key={a.id}
                activity={a}
                moduleLabel={moduleLabelOf(a.moduleId)}
                onOpen={() => setDetail(a)}
                onEdit={() => setEditing(a)}
                onDelete={() => setDeleting(a)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Progreso de la clase">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20, height: "100%" }}>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>2 de 3 unidades completadas. Próxima sesión {c.nextSession}.</p>
            <Donut value={c.progress} size={200} stroke={18} color={c.color} sub="del temario" />
            <p style={{ fontSize: 13.5, color: "var(--text-body)", margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
          </div>
        </Panel>
      </div>

      {detail ? (
        <ActivityDetailModal
          activity={detail}
          role="docente"
          onClose={() => setDetail(null)}
          onGrade={(id) => { setDetail(null); onGrade(id); }}
        />
      ) : null}

      {editing ? (
        <CreateActivityModal
          klass={c}
          activity={editing}
          onClose={() => setEditing(null)}
          onDone={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Eliminar actividad"
          message={<>¿Seguro que quieres eliminar «{deleting.title}»? Esta acción no se puede deshacer.</>}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteActivity.mutateAsync(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}
    </div>
  );
}

const CLASS_TABS = ["resumen", "modulos", "entregas", "calificaciones", "alumnos"];

export interface ClassDetailProps {
  klass: ClassInfo;
  /** Pestaña inicial (p. ej. desde una notificación de entrega). */
  initialTab?: string;
  /** Actividad preseleccionada para la pestaña de Entregas. */
  initialActivityId?: string;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onNewActivity: (c: ClassInfo) => void;
  onEdit: (c: ClassInfo) => void;
  onDelete: (c: ClassInfo) => void;
}

function HeaderAction({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: "rgba(255,255,255,0.12)", color: danger ? "var(--red-200, #fecaca)" : "#fff", transition: "background .15s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

export function ClassDetail({ klass, initialTab, initialActivityId, onBack, onProfile, onLogout, onNewActivity, onEdit, onDelete }: ClassDetailProps) {
  const { role, modLayout } = useSettings();
  const [tab, setTab] = useState(initialTab && CLASS_TABS.includes(initialTab) ? initialTab : "resumen");
  const [gradeSub, setGradeSub] = useState<SubmissionDto | null>(null);
  const c = klass;

  const { data: activities } = useActivities(c.id);
  const [activityId, setActivityId] = useState<string>(initialActivityId ?? "");
  useEffect(() => {
    if (!activityId && activities && activities.length) setActivityId(activities[0].id);
  }, [activities, activityId]);
  // Al llegar desde una notificación (la URL cambia), salta a esa pestaña/actividad.
  useEffect(() => {
    if (initialTab && CLASS_TABS.includes(initialTab)) setTab(initialTab);
    if (initialActivityId) setActivityId(initialActivityId);
  }, [initialTab, initialActivityId]);
  const { data: subs } = useSubmissions(activityId || undefined);
  const gradebook = useGradebook(c.id);
  const gradeMut = useGradeSubmission(activityId || undefined, c.id);

  const rows = subs ?? [];
  const porRevisar = rows.filter((r) => !r.id.startsWith("pending-") && r.grade === "—").length;
  const selectedActivity = (activities ?? []).find((a) => a.id === activityId);

  const debates = (activities ?? []).filter((a) => a.type === "Debate");
  const [debateId, setDebateId] = useState<string>("");
  const currentDebate = debates.find((a) => a.id === debateId) ?? debates[0];

  // Para calificar un debate hay que ver las intervenciones del alumno en el hilo.
  const { data: gradedDebate } = useDebateThread(selectedActivity?.type === "Debate" ? activityId : undefined);

  const subCols: Column<SubmissionDto>[] = [
    { key: "student", label: "Alumno", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /> <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{v as string}</span></span> },
    { key: "date", label: "Entrega" },
    { key: "status", label: "Estado", render: (v) => <Badge color={statusMap[v as string]}>{v as string}</Badge> },
    { key: "grade", label: "Nota", render: (v) => <span style={{ fontWeight: 700, color: v === "—" ? "var(--text-muted)" : "var(--text-strong)" }}>{v as string}</span> },
    { key: "actions", label: "", sortable: false, align: "right", render: (_, r) => (r.id.startsWith("pending-") ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span> : <Button size="small" variant={r.grade === "—" ? "accent" : "outline"} onClick={() => setGradeSub(r)}>{r.grade === "—" ? "Calificar" : "Revisar"}</Button>) },
  ];

  return (
    <>
      <ClassShell
        klass={c}
        role={role}
        onBack={onBack}
        onProfile={onProfile}
        onLogout={onLogout}
        meta={`${c.code} · ${c.room} · ${c.students} alumnos · ${c.openActivities} actividades abiertas`}
        badge={c.status}
        actions={
          <>
            <HeaderAction icon="pencil" label="Editar clase" onClick={() => onEdit(c)} />
            <HeaderAction icon="trash" label="Eliminar clase" danger onClick={() => onDelete(c)} />
            <Button variant="accent" iconLeft={<Icon name="plus" />} onClick={() => onNewActivity(c)}>Nueva actividad</Button>
          </>
        }
        tab={tab}
        onTab={setTab}
        tabs={[
          { label: "Resumen", value: "resumen" },
          { label: "Módulos", value: "modulos" },
          { label: "Entregas", value: "entregas" },
          { label: "Calificaciones", value: "calificaciones" },
          { label: "Alumnos", value: "alumnos" },
          { label: "Foro", value: "foro" },
        ]}
      >
        {tab === "resumen" ? <ClassOverview c={c} onGrade={(id) => { setActivityId(id); setTab("entregas"); }} /> : null}
        {tab === "modulos" ? <ClassModules classId={c.id} layout={modLayout} onGrade={(id) => { setActivityId(id); setTab("entregas"); }} /> : null}
        {tab === "entregas" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <ActivityChipStrip
              activities={activities ?? []}
              value={activityId}
              onChange={setActivityId}
            />
            <DataTable
              title={`Entregas · ${selectedActivity?.title ?? "Actividad"}`}
              rowKey="id"
              columns={subCols}
              rows={rows}
              selectable={false}
              toolbar={
                <>
                  <Chip icon="document-add">{porRevisar} por revisar</Chip>
                  <Button size="small" variant="outline" iconLeft={<Icon name="download" size={16} />}>Exportar</Button>
                </>
              }
            />
          </div>
        ) : null}
        {tab === "calificaciones" ? <GradebookTable data={gradebook.data} /> : null}
        {tab === "alumnos" ? <ClassStudents classId={c.id} /> : null}
        {tab === "foro" ? (
          debates.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="atria-selectwrap" style={{ width: 320 }}>
                <Select
                  value={currentDebate?.id ?? debateId}
                  options={debates.map((a) => ({ label: a.title, value: a.id }))}
                  onChange={setDebateId}
                  placeholder="Debate"
                />
              </div>
              {currentDebate ? <DebateBoard activity={currentDebate} role={role} /> : null}
            </div>
          ) : (
            <EmptyState
              illo="empty-messages"
              title="Aún no hay debates abiertos"
              text="Crea una actividad de tipo Debate y su hilo aparecerá aquí para que participen tus alumnos."
              action={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={() => onNewActivity(c)}>Nueva actividad</Button>}
            />
          )
        ) : null}
      </ClassShell>
      {gradeSub ? (
        <GradeModal
          submission={gradeSub}
          questions={selectedActivity?.config?.questions}
          debatePosts={gradedDebate?.posts}
          maxPoints={selectedActivity?.points}
          onClose={() => setGradeSub(null)}
          onSave={async (score, feedback) => {
            await gradeMut.mutateAsync({ id: gradeSub.id, score, feedback });
          }}
        />
      ) : null}
    </>
  );
}
