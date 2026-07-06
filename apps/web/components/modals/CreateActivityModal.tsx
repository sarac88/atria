"use client";

import { useState, type ReactNode } from "react";
import { Input, Textarea, Select, Button, Icon, Switch } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useCreateActivity, useModules } from "@/lib/api/classwork";
import type { ClassInfo, CreateActivityInput } from "@/lib/types";

const types: [string, string, string][] = [
  ["document-text", "Tarea", "var(--success-500)"],
  ["clipboard-check", "Cuestionario", "var(--info-500)"],
  ["folder", "Proyecto", "var(--warning-500)"],
  ["chat", "Debate", "var(--primary-500)"],
];
const TYPE_ENUM: CreateActivityInput["type"][] = ["tarea", "cuestionario", "proyecto", "debate"];

const linkGlyph = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 15l6-6" />
    <path d="M11 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L17 11.5" />
    <path d="M13 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L7 12.5" />
  </svg>
);

export function CreateActivityModal({ klass, onClose, onDone }: { klass?: ClassInfo | null; onClose: () => void; onDone: () => void }) {
  const classId = klass?.id ?? "";
  const { data: modules } = useModules(classId);
  const createActivity = useCreateActivity(classId);
  const [ty, setTy] = useState(0);
  const [fmt, setFmt] = useState(0);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [points, setPoints] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formats: [ReactNode, string][] = [
    [<Icon key="f0" name="document-add" size={24} />, "Archivo"],
    [<Icon key="f1" name="pencil" size={24} />, "Texto"],
    [linkGlyph, "Enlace"],
    [<Icon key="f3" name="clipboard-check" size={24} />, "Examen"],
  ];
  const tColor = types[ty][2];
  const tint = (col: string) => `color-mix(in srgb, ${col} 14%, #fff)`;

  const submit = async (status: "live" | "draft") => {
    if (!classId) return;
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError(null);
    try {
      await createActivity.mutateAsync({
        type: TYPE_ENUM[ty],
        title: title.trim(),
        instructions: instructions.trim(),
        dueAt: dueAt.trim(),
        points: parseInt(points, 10) || 0,
        format: formats[fmt][1],
        status,
      });
      onDone();
    } catch {
      setError("No se pudo crear la actividad.");
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={() => submit("draft")} disabled={createActivity.isPending}>Borrador</Button>
      <Button variant="accent" onClick={() => submit("live")} disabled={createActivity.isPending}>{createActivity.isPending ? "Publicando…" : "Publicar"}</Button>
    </>
  );

  return (
    <Modal title="Nueva actividad" onClose={onClose} footer={footer} width={620}>
      <div className="atria-formcard" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -4 }}>{klass ? klass.name : ""}</div>

        {error ? <div style={{ fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}

        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Tipo de actividad</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {types.map(([ic, lb, col], i) => {
              const on = ty === i;
              return (
                <button key={i} type="button" onClick={() => setTy(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 8px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? tint(col) : "var(--gray-100)", boxShadow: on ? `inset 0 0 0 2px ${col}` : "inset 0 0 0 2px var(--border-default)", color: on ? col : "var(--text-muted)", transition: "background .15s ease, box-shadow .15s ease, color .15s ease" }}>
                  <Icon name={ic} size={24} /><span style={{ fontSize: 13, fontWeight: 700 }}>{lb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Explica tu idea: límites" />
        <Textarea label="Instrucciones" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Describe qué deben hacer los alumnos…" />

        <div className="atria-selectwrap">
          <Select label="Módulo" options={(modules ?? []).map((m) => m.title)} placeholder="Selecciona un módulo" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Fecha límite" value={dueAt} onChange={(e) => setDueAt(e.target.value)} placeholder="30 / 10 / 2022" iconRight={<Icon name="calendar" size={18} color="var(--text-muted)" />} />
          <Input label="Puntos" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="10" type="number" />
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Formato de entrega</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {formats.map(([glyph, lb], i) => {
              const on = fmt === i;
              return (
                <button key={i} type="button" onClick={() => setFmt(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 8px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--primary-100)" : "var(--gray-100)", boxShadow: on ? "inset 0 0 0 2px var(--brand-primary)" : "inset 0 0 0 2px var(--border-default)", color: on ? "var(--primary-700)" : "var(--text-muted)", transition: "background .15s ease, box-shadow .15s ease, color .15s ease" }}>
                  {glyph}<span style={{ fontSize: 13, fontWeight: 700 }}>{lb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Permitir entregas atrasadas</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Se marcarán como «Atrasado».</div>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </Modal>
  );
}
