"use client";

import { useState } from "react";
import { Input, Textarea, Button, Icon, Switch } from "@/components/ui";
import { Modal } from "@/components/layout";

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

export function CreateClassModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [sel, setSel] = useState(0);
  const [subj, setSubj] = useState<number | null>(null);

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button variant="accent" onClick={onDone}>Crear clase</Button>
    </>
  );

  return (
    <Modal title="Crear clase" onClose={onClose} footer={footer} width={620}>
      <div className="atria-formcard" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--ring-hairline)" }}>
          <div style={{ height: 96, background: colors[sel][0], display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.92)" }}>
            <Icon name={colors[sel][1]} size={40} />
          </div>
        </div>

        <Input label="Nombre de la clase" required defaultValue="" placeholder="Ej. Cálculo II" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Código" placeholder="MAT-204" />
          <Input label="Aula" placeholder="Aula 345" />
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
        <Textarea label="Descripción" rows={3} placeholder="Breve descripción del temario y objetivos." />
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
          <Switch defaultChecked />
        </div>
      </div>
    </Modal>
  );
}
