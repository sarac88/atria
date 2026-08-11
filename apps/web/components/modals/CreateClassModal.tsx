"use client";

import { useState } from "react";
import { Input, RichText, Button, Icon, Switch } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useCreateClass, useUpdateClass } from "@/lib/api/classes";
import type { ClassInfo } from "@/lib/types";

const colors: [string, string][] = [
  ["var(--primary-500)", "academic-cap"],
  ["var(--yellow-500)", "book-open"],
  ["var(--info-500)", "folder"],
  ["var(--success-500)", "document-text"],
  ["var(--warning-500)", "star"],
];
const subjects: [string, string][] = [
  ["grid", "Matemáticas"],
  ["academic-cap", "Ciencias"],
  ["users", "Humanidades"],
  ["book-open", "Lengua"],
  ["pencil", "Arte"],
];

export function CreateClassModal({ klass, onClose, onDone }: { klass?: ClassInfo | null; onClose: () => void; onDone: (id: string) => void }) {
  const editing = !!klass;
  const create = useCreateClass();
  const update = useUpdateClass(klass?.id ?? "");
  const busy = create.isPending || update.isPending;

  const initColor = klass ? Math.max(0, colors.findIndex(([col]) => col === klass.color)) : 0;
  const [sel, setSel] = useState(initColor);
  const [subj, setSubj] = useState<number | null>(null);
  const [name, setName] = useState(klass?.name ?? "");
  const [code, setCode] = useState(klass && klass.code !== "—" ? klass.code : "");
  const [room, setRoom] = useState(klass?.room ?? "");
  const [desc, setDesc] = useState(klass?.desc ?? "");
  const [publish, setPublish] = useState(klass ? klass.status[0] !== "Borrador" : true);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("El nombre de la clase es obligatorio.");
      return;
    }
    setError(null);
    const base = {
      name: name.trim(),
      code: code.trim() || "—",
      room: room.trim(),
      color: colors[sel][0],
      icon: colors[sel][1],
      desc: desc.trim(),
      publish,
    };
    try {
      if (editing) {
        // En edición sólo enviamos la asignatura si se ha elegido, para no borrarla.
        const cls = await update.mutateAsync(subj != null ? { ...base, subject: subjects[subj][1] } : base);
        onDone(cls.id);
      } else {
        const cls = await create.mutateAsync({ ...base, subject: subj != null ? subjects[subj][1] : "" });
        onDone(cls.id);
      }
    } catch {
      setError(editing ? "No se pudo guardar la clase." : "No se pudo crear la clase.");
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button variant="accent" onClick={submit} disabled={busy}>
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear clase"}
      </Button>
    </>
  );

  return (
    <Modal title={editing ? "Editar clase" : "Crear clase"} onClose={onClose} footer={footer} width={620}>
      <div className="atria-formcard" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--ring-hairline)" }}>
          <div style={{ height: 96, background: colors[sel][0], display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.92)" }}>
            <Icon name={colors[sel][1]} size={40} />
          </div>
        </div>

        {error ? <div style={{ fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}

        <Input label="Nombre de la clase" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cálculo II" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Código" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT-204" />
          <Input label="Aula" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Aula 345" />
        </div>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Asignatura</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {subjects.map(([ic, lb], i) => {
              const on = subj === i;
              return (
                <button key={i} type="button" onClick={() => setSubj(i)} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 14px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--primary-100)" : "var(--gray-100)", boxShadow: on ? "inset 0 0 0 2px var(--brand-primary)" : "inset 0 0 0 2px var(--border-default)", color: on ? "var(--primary-700)" : "var(--text-strong)", fontSize: 14, fontWeight: 600, transition: "background .15s ease, box-shadow .15s ease" }}>
                  <Icon name={ic} size={18} />{lb}
                </button>
              );
            })}
          </div>
        </div>
        <RichText
          label="Descripción"
          minHeight={130}
          value={desc}
          onChange={setDesc}
          placeholder="Breve descripción del temario y objetivos."
        />
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Color e icono</label>
          <div style={{ display: "flex", gap: 10 }}>
            {colors.map(([col, ic], i) => (
              <button key={i} type="button" onClick={() => setSel(i)} style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: col, color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: sel === i ? "0 0 0 3px var(--surface-card), 0 0 0 5px var(--brand-primary)" : "none" }}>
                <Icon name={ic} size={20} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Publicar de inmediato</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Si está desactivado, se guarda como borrador.</div>
          </div>
          <Switch checked={publish} onChange={(v) => setPublish(v)} />
        </div>
      </div>
    </Modal>
  );
}
