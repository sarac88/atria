"use client";

import { useEffect, useState } from "react";
import { DataTable, Badge, Button, Icon, Avatar, Select, RichText, HorizontalTabs, type Column } from "@/components/ui";
import { Chip, Panel, EmptyState, ClassShell, ProgressBar } from "@/components/layout";
import { Donut } from "@/components/charts";
import { GradebookTable } from "./GradebookTable";
import { GradeModal } from "@/components/modals/GradeModal";
import { AddResourceModal } from "@/components/modals/AddResourceModal";
import { ActivityDetailModal } from "@/components/modals/ActivityDetailModal";
import { CreateActivityModal } from "@/components/modals/CreateActivityModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { InviteStudentsModal } from "@/components/modals/InviteStudentsModal";
import { ABOUT_UNIT, AboutRailItem, ClassAbout, RAIL_DIVIDER } from "@/components/classes/ClassAbout";
import { ClassInvitations } from "@/components/classes/ClassInvitations";
import { ClassChatPanel } from "@/components/classes/ClassChatPanel";
import { ClassIdentityPanel, ClassUnitProgressPanel } from "@/components/classes/ClassSidePanels";
import { ModuleResourceGrid } from "@/components/modules/ModuleResourceGrid";
import { ModuleSessions } from "@/components/modules/ModuleSessions";
import { UnitDescription } from "@/components/modules/UnitDescription";
import { ActivityPill, AddActivityPill } from "@/components/activities/ActivityPill";
import { DebateBoard } from "@/components/activities/DebateBoard";
import {
  useActivities,
  useCreateModule,
  useDebateThread,
  useDeleteActivity,
  useDeleteModule,
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
import { stripEmptyParagraphs } from "@/lib/rich-text";
import type { Activity, BadgeColor, ClassInfo, Module, SubmissionDto } from "@/lib/types";

const SECTION_LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 };

/** "Actividades" section for a unit — simple clickable rows, ghost add pill at the end. */
function UnitActivities({ activities, onOpen, onAdd }: { activities: Activity[]; onOpen: (a: Activity) => void; onAdd?: () => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={SECTION_LABEL}>Actividades</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {activities.map((a) => <ActivityPill key={a.id} activity={a} onOpen={() => onOpen(a)} />)}
        {onAdd ? <AddActivityPill onClick={onAdd} /> : null}
      </div>
    </div>
  );
}

const statusMap: Record<string, BadgeColor> = { Entregado: "success", Pendiente: "warning", Atrasado: "error", Borrador: "default" };

/** Card-style activity tabs above the Entregas table. Icons follow activity type. */
function ActivityTabs({
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
      role="tablist"
      aria-label="Actividades"
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "10px 10px 0",
        background: "var(--gray-100)",
        scrollbarWidth: "thin",
      }}
    >
      {activities.map((a) => {
        const active = a.id === value;
        const [icon, color] = activityTypeMeta(a.type);
        const count = a.ungraded > 0 ? a.ungraded : a.submitted;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(a.id)}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: "0 0 210px",
              width: 210,
              padding: "12px 14px",
              border: "none",
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
              cursor: "pointer",
              background: active ? "var(--surface-card)" : "var(--gray-200)",
              boxShadow: "none",
              zIndex: active ? 1 : 0,
              transition: "background .15s ease, color .15s ease",
              textAlign: "left",
            }}
          >
            <span style={{ color, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <Icon name={icon} size={22} />
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12.5,
                fontWeight: active ? 700 : 600,
                color: active ? "var(--text-strong)" : "var(--text-muted)",
                textAlign: "left",
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {a.title}
            </span>
            {count > 0 ? (
              <span
                style={{
                  flex: "0 0 auto",
                  minWidth: 22,
                  height: 20,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: a.ungraded > 0 ? "var(--warning-600)" : "var(--gray-600)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {count}
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

/** Fila del carril de unidades: selecciona la unidad y, al pasar por encima, ofrece borrarla. */
function UnitRailItem({
  unit,
  active,
  onSelect,
  onDelete,
}: {
  unit: Module;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [lead, sub] = modParts(unit.title);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 6px 0 0", borderRadius: "var(--radius-md)", background: active ? "var(--primary-100)" : hover ? "var(--state-hover-tint)" : "transparent", transition: "background .15s ease" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", cursor: "pointer", flex: 1, minWidth: 0, padding: "10px 0 10px 14px", background: "transparent" }}
      >
        <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: unit.done ? "var(--success-100)" : "var(--surface-soft)", color: unit.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={unit.done ? "check" : "book-open"} size={16} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "var(--brand-primary)" : "var(--text-strong)" }}>{lead}</span>
          {sub ? <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{sub}</span> : null}
        </span>
      </button>
      {onDelete ? (
        <button
          type="button"
          aria-label={`Eliminar unidad ${unit.title}`}
          title="Eliminar unidad"
          onClick={onDelete}
          style={{ width: 28, height: 28, flexShrink: 0, border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "transparent", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: hover ? 1 : 0, pointerEvents: hover ? "auto" : "none", transition: "opacity .15s ease, color .15s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--status-error)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <Icon name="trash" size={16} />
        </button>
      ) : null}
    </div>
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
  const [desc, setDesc] = useState(() => stripEmptyParagraphs(description));
  const commit = () => {
    const v = val.trim();
    if (!v) return;
    onSave(v, stripEmptyParagraphs(desc).trim());
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
        style={{ ["--atria-rich-gap" as string]: "16px" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="small" variant="accent" disabled={!val.trim() || pending} onClick={commit}>Guardar</Button>
        <Button size="small" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function ModulesRailLayout({ klass, flat, aside, onGrade }: { klass: ClassInfo; flat?: boolean; aside?: React.ReactNode; onGrade: (activityId: string) => void }) {
  const classId = klass.id;
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const createModule = useCreateModule(classId);
  const updateModule = useUpdateModule(classId);
  const deleteModule = useDeleteModule(classId);
  const list = modules ?? [];
  const { units, actsOf } = buildUnits(list, activities ?? []);
  const [editing, setEditing] = useState<string | null>(null);
  // El carril abre por «Sobre el curso»: es la portada del temario.
  const [sel, setSel] = useState<string>(ABOUT_UNIT);
  const [addTo, setAddTo] = useState<{ id: string; title: string } | null>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const [detail, setDetail] = useState<Activity | null>(null);
  useEffect(() => {
    // Si la unidad seleccionada desaparece (se borró), vuelve al principio.
    if (sel !== ABOUT_UNIT && !units.some((m) => m.id === sel)) setSel(units.length ? units[0].id : ABOUT_UNIT);
  }, [units, sel]);
  const showAbout = sel === ABOUT_UNIT;
  const current = showAbout ? undefined : units.find((m) => m.id === sel) || units[0];
  const chrome = flat
    ? { background: "#fff", boxShadow: "none", borderRadius: 0, padding: "8px 0" }
    : { background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", padding: "24px 28px" };

  return (
    <>
    <div className="atria-2col atria-modules" style={{ display: "grid", gridTemplateColumns: aside ? "256px minmax(0, 1fr) 320px" : "256px 1fr", gap: 0, alignItems: "start", ...chrome }}>
      <div className="atria-modules-rail" style={{ display: "flex", flexDirection: "column", paddingRight: 28, borderRight: "1px solid var(--border-subtle)", position: "sticky", top: 0, borderColor: "rgb(237, 236, 236)" }}>
        <AboutRailItem active={showAbout} onSelect={() => setSel(ABOUT_UNIT)} />
        <div style={RAIL_DIVIDER} />
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 12px" }}>Unidades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {units.map((m) => (
            <UnitRailItem
              key={m.id}
              unit={m}
              active={m.id === (current?.id ?? "")}
              onSelect={() => setSel(m.id)}
              onDelete={m.id !== NONE_UNIT ? () => setDeleting({ id: m.id, title: m.title }) : undefined}
            />
          ))}
          {units.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "4px 8px" }}>Aún no hay unidades.</div> : null}
        </div>
        <AddInline label="Añadir unidad" pending={createModule.isPending} onAdd={(title) => createModule.mutate({ title })} />
      </div>

      {showAbout ? (
        <div className="atria-modmain" style={{ paddingLeft: 28 }}>
          <ClassAbout c={klass} canEdit embedded />
        </div>
      ) : current ? (
        <div key={current.id} className="atria-modmain" style={{ paddingLeft: 28 }}>
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
              <UnitDescription
                text={current.description}
                coverUrl={current.coverUrl}
                classId={classId}
                moduleId={current.id !== NONE_UNIT ? current.id : undefined}
                canEdit={current.id !== NONE_UNIT}
              />
            </>
          )}
          {current.id !== NONE_UNIT ? (
            <>
              <div style={SECTION_LABEL}>Sesión online</div>
              <div style={{ marginBottom: 22 }}>
                <ModuleSessions
                  classId={classId}
                  moduleId={current.id}
                  moduleTitle={current.title}
                  sessions={current.sessions}
                  canManage
                />
              </div>
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
          <UnitActivities
            activities={actsOf(current.id)}
            onOpen={setDetail}
            onAdd={() => setCreatingIn(current.id === NONE_UNIT ? "" : current.id)}
          />
        </div>
      ) : (
        <div className="atria-modmain" style={{ paddingLeft: 28, color: "var(--text-muted)", fontSize: 14 }}>Crea la primera unidad para empezar.</div>
      )}

      {aside ? (
        <div className="atria-modaside" style={{ paddingLeft: 28, borderLeft: "1px solid rgb(237, 236, 236)", position: "sticky", top: 0 }}>{aside}</div>
      ) : null}
    </div>
    {addTo ? <AddResourceModal classId={classId} moduleId={addTo.id} moduleTitle={addTo.title} onClose={() => setAddTo(null)} onDone={() => setAddTo(null)} /> : null}
    {creatingIn !== null ? (
      <CreateActivityModal
        klass={klass}
        defaultModuleId={creatingIn || undefined}
        onClose={() => setCreatingIn(null)}
        onDone={() => setCreatingIn(null)}
      />
    ) : null}
    {deleting ? (
      <ConfirmDialog
        title="Eliminar unidad"
        message={<>¿Seguro que quieres eliminar «{deleting.title}»? Se borrarán sus recursos. Las actividades de la unidad no se borran: pasarán a «Sin unidad».</>}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await deleteModule.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    ) : null}
    {detail ? <ActivityDetailModal activity={detail} role="docente" onClose={() => setDetail(null)} onGrade={(id) => { setDetail(null); onGrade(id); }} /> : null}
    </>
  );
}

function ModulesAccordion({ klass, onGrade }: { klass: ClassInfo; onGrade: (activityId: string) => void }) {
  const classId = klass.id;
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const createModule = useCreateModule(classId);
  const updateModule = useUpdateModule(classId);
  const list = modules ?? [];
  const { units, actsOf } = buildUnits(list, activities ?? []);
  // Abre por «Sobre el curso», igual que el carril.
  const [open, setOpen] = useState<string | null>(ABOUT_UNIT);
  const [editing, setEditing] = useState<string | null>(null);
  const [addTo, setAddTo] = useState<{ id: string; title: string } | null>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [detail, setDetail] = useState<Activity | null>(null);
  const aboutOpen = open === ABOUT_UNIT;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setOpen(aboutOpen ? null : ABOUT_UNIT)}
          style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: "transparent", padding: "16px 20px", transition: "background .15s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%", background: "var(--yellow-200)", color: "var(--yellow-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="home" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>Sobre el curso</span>
          <span style={{ color: "var(--text-muted)", display: "inline-flex", transition: "transform .15s ease", transform: aboutOpen ? "rotate(180deg)" : "none" }}>
            <Icon name="chevron-down" size={20} />
          </span>
        </button>
        {aboutOpen ? (
          <div style={{ padding: "16px 20px 18px", borderTop: "1px solid var(--border-subtle)" }}>
            <ClassAbout c={klass} canEdit embedded />
          </div>
        ) : null}
      </div>
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
                        <UnitDescription
                          text={m.description}
                          coverUrl={m.coverUrl}
                          classId={classId}
                          moduleId={m.id}
                          canEdit
                        />
                      </div>
                      <UnitEditButton onClick={() => setEditing(m.id)} />
                    </div>
                  )
                ) : null}
                {!isNone ? (
                  <>
                    <div style={SECTION_LABEL}>Sesión online</div>
                    <ModuleSessions
                      classId={classId}
                      moduleId={m.id}
                      moduleTitle={m.title}
                      sessions={m.sessions}
                      canManage
                    />
                  </>
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
                <UnitActivities
                  activities={actsOf(m.id)}
                  onOpen={setDetail}
                  onAdd={() => setCreatingIn(m.id === NONE_UNIT ? "" : m.id)}
                />
              </div>
            ) : null}
          </div>
        );
      })}
      {units.length === 0 ? <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Aún no hay unidades.</div> : null}
      <AddInline label="Añadir unidad" pending={createModule.isPending} onAdd={(title) => createModule.mutate({ title })} />
      {addTo ? <AddResourceModal classId={classId} moduleId={addTo.id} moduleTitle={addTo.title} onClose={() => setAddTo(null)} onDone={() => setAddTo(null)} /> : null}
      {creatingIn !== null ? (
        <CreateActivityModal
          klass={klass}
          defaultModuleId={creatingIn || undefined}
          onClose={() => setCreatingIn(null)}
          onDone={() => setCreatingIn(null)}
        />
      ) : null}
      {detail ? <ActivityDetailModal activity={detail} role="docente" onClose={() => setDetail(null)} onGrade={(id) => { setDetail(null); onGrade(id); }} /> : null}
    </div>
  );
}

function ClassModules({ klass, layout, aside, onGrade }: { klass: ClassInfo; layout: ModLayout; aside?: React.ReactNode; onGrade: (activityId: string) => void }) {
  if (layout === "plano") return <ModulesRailLayout klass={klass} flat aside={aside} onGrade={onGrade} />;
  // El acordeón no tiene un bloque blanco único donde meter la columna: va al lado.
  if (layout === "acordeon") {
    return (
      <div className="atria-modsplit" style={{ display: "grid", gridTemplateColumns: aside ? "minmax(0, 1fr) 320px" : "1fr", gap: 40, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}><ModulesAccordion klass={klass} onGrade={onGrade} /></div>
        {aside ? (
          <div className="atria-modaside" style={{ paddingLeft: 28, borderLeft: "1px solid rgb(237, 236, 236)", position: "sticky", top: 0 }}>{aside}</div>
        ) : null}
      </div>
    );
  }
  return <ModulesRailLayout klass={klass} aside={aside} onGrade={onGrade} />;
}

function ClassStudents({ klass }: { klass: ClassInfo }) {
  const classId = klass.id;
  const { data: roster } = useRoster(classId);
  const [inviting, setInviting] = useState(false);
  const rows = (roster ?? []).map((s) => ({ ...s, avgStr: s.avg == null ? "—" : s.avg.toFixed(1) }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "name", label: "Alumno", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "email", label: "Correo", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "progress", label: "Progreso", render: (v) => <div style={{ width: 120 }}><ProgressBar value={v as number} showLabel /></div> },
    { key: "avgStr", label: "Media", render: (v) => <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{v as string}</span> },
  ];
  const inviteButton = (
    <Button size="small" variant="outline" onClick={() => setInviting(true)} iconLeft={<Icon name="plus" size={16} />}>
      Invitar
    </Button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {rows.length === 0 ? (
        <EmptyState
          illo="learning"
          title="Todavía no hay alumnos en la clase"
          text="Invítalos por correo: recibirán un enlace para unirse y aparecerán aquí en cuanto lo acepten. Puedes invitar a varios a la vez."
          action={
            <Button variant="accent" onClick={() => setInviting(true)} iconLeft={<Icon name="plus" size={16} />}>
              Invitar alumnos
            </Button>
          }
        />
      ) : (
        <DataTable title={`Alumnos · ${rows.length}`} rowKey="id" columns={cols} rows={rows} selectable={false} toolbar={inviteButton} />
      )}
      <ClassInvitations classId={classId} />
      {inviting ? (
        <InviteStudentsModal classId={classId} className={klass.name} onClose={() => setInviting(false)} />
      ) : null}
    </div>
  );
}

function OverviewActivityCard({
  activity,
  moduleLabel,
  showModule = true,
  onOpen,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  moduleLabel: string;
  showModule?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [tIcon, tColor] = typeMeta(activity.type);
  // La unidad sale como etiqueta junto al estado, no en la línea de metadatos.
  const meta = [
    activity.type,
    activity.points ? `${activity.points} pts` : "",
    activity.due ? `vence ${activity.due}` : "",
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
        {showModule ? (
          <Badge
            color={moduleLabel ? "draft" : "default"}
            style={{ fontSize: 12.5, padding: "4px 10px", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
            title={moduleLabel || "Sin unidad"}
          >
            {moduleLabel || "Sin unidad"}
          </Badge>
        ) : null}
        <Badge type="solid" color={activity.status[1]}>{activity.status[0]}</Badge>
      </div>
    </div>
  );
}

const ALL_ACTIVITIES = "all";

function ClassOverview({ c, onGrade }: { c: ClassInfo; onGrade: (activityId: string) => void }) {
  const { data: activities } = useActivities(c.id);
  const { data: modules } = useModules(c.id);
  const deleteActivity = useDeleteActivity(c.id);
  const [detail, setDetail] = useState<Activity | null>(null);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const [moduleTab, setModuleTab] = useState(ALL_ACTIVITIES);

  const list = activities ?? [];
  const { units, actsOf } = buildUnits(modules ?? [], list);
  const moduleTabs = units.filter((u) => actsOf(u.id).length > 0);
  const showTabs = moduleTabs.length > 1;
  const activeTab = !showTabs || moduleTab === ALL_ACTIVITIES || moduleTabs.some((u) => u.id === moduleTab)
    ? (showTabs ? moduleTab : ALL_ACTIVITIES)
    : ALL_ACTIVITIES;
  const visible = activeTab === ALL_ACTIVITIES ? list : actsOf(activeTab);

  /** Nombre corto de la unidad; vacío si la actividad no cuelga de ninguna. */
  const moduleLabelOf = (moduleId?: string) => {
    const mod = moduleId ? (modules ?? []).find((m) => m.id === moduleId) : undefined;
    return mod ? modParts(mod.title)[0] : "";
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

      {/* alignItems start: con muchas actividades, el panel de progreso se estiraba
          y dejaba un hueco enorme bajo el donut. Ahora se queda arriba y acompaña. */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22, alignItems: "start" }} className="atria-2col">
        <Panel title="Actividades">
          {showTabs ? (
            <HorizontalTabs
              value={activeTab}
              onChange={setModuleTab}
              aria-label="Filtrar actividades por unidad"
              style={{ gap: 22, margin: "-4px 0 16px" }}
              tabs={[
                { label: "Todas", value: ALL_ACTIVITIES, count: list.length },
                ...moduleTabs.map((u) => ({
                  label: modParts(u.title)[0],
                  value: u.id,
                  count: actsOf(u.id).length,
                })),
              ]}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Aún no hay actividades.</div>
            ) : (
              visible.map((a) => (
                <OverviewActivityCard
                  key={a.id}
                  activity={a}
                  moduleLabel={moduleLabelOf(a.moduleId)}
                  showModule={activeTab === ALL_ACTIVITIES}
                  onOpen={() => setDetail(a)}
                  onEdit={() => setEditing(a)}
                  onDelete={() => setDeleting(a)}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel title="Progreso de la clase" style={{ position: "sticky", top: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20 }}>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>2 de 3 unidades completadas. Próxima sesión {c.nextSession}.</p>
            <Donut value={c.progress} size={200} stroke={18} color={c.color} sub="del temario" />
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
        // Distintivo y datos de la clase viven ahora en la ficha de la columna
        // lateral de Contenido, así que la cabecera solo lleva nombre y estado.
        showIcon={false}
        badge={c.status}
        actions={
          <>
            <HeaderAction icon="pencil" label="Editar clase" onClick={() => onEdit(c)} />
            <HeaderAction icon="trash" label="Eliminar clase" danger onClick={() => onDelete(c)} />
          </>
        }
        tab={tab}
        onTab={setTab}
        tabs={[
          { label: "Resumen", value: "resumen" },
          // El valor sigue siendo "modulos" (URL y notificaciones); solo cambia el
          // rótulo, para llamarlo igual que en la vista del alumno.
          { label: "Contenido", value: "modulos" },
          { label: "Entregas", value: "entregas" },
          { label: "Calificaciones", value: "calificaciones" },
          { label: "Alumnos", value: "alumnos" },
          { label: "Foro", value: "foro" },
        ]}
      >
        {tab === "resumen" ? <ClassOverview c={c} onGrade={(id) => { setActivityId(id); setTab("entregas"); }} /> : null}
        {tab === "modulos" ? (
          <ClassModules
            klass={c}
            layout={modLayout}
            onGrade={(id) => { setActivityId(id); setTab("entregas"); }}
            aside={
              <div className="atria-modaside-card">
                <ClassIdentityPanel c={c} />
                <ClassUnitProgressPanel classId={c.id} onReview={() => setTab("entregas")} />
                <ClassChatPanel classId={c.id} />
              </div>
            }
          />
        ) : null}
        {tab === "entregas" ? (
          <div
            style={{
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              background: "var(--surface-card)",
              boxShadow: "var(--ring-hairline), var(--shadow-md)",
            }}
          >
            <ActivityTabs
              activities={activities ?? []}
              value={activityId}
              onChange={setActivityId}
            />
            <DataTable
              title={selectedActivity?.title ?? "Entregas"}
              rowKey="id"
              columns={subCols}
              rows={rows}
              selectable={false}
              style={{ boxShadow: "none", borderRadius: 0 }}
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
        {tab === "alumnos" ? <ClassStudents klass={c} /> : null}
        {tab === "foro" ? (
          debates.length ? (
            currentDebate ? (
              <DebateBoard
                activity={currentDebate}
                role={role}
                debates={debates}
                onSelectDebate={setDebateId}
              />
            ) : null
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
