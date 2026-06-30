"use client";

import { useState } from "react";
import { Button, Icon, Textarea, Badge } from "@/components/ui";
import { Modal, Eyebrow } from "@/components/layout";
import type { BadgeColor } from "@/lib/types";

interface Task {
  title: string;
  cls: string;
  due: string;
  color: BadgeColor;
}
interface UploadFile {
  name: string;
  size: string;
}

const FALLBACK: Task = { title: "Ensayo de derivadas", cls: "Cálculo II", due: "Vence en 3 días", color: "warning" };

export function SubmitModal({ task, onClose, onDone }: { task?: Task | null; onClose: () => void; onDone?: () => void }) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const t = task || FALLBACK;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Guardar borrador</Button>
      <Button variant="accent" disabled={files.length === 0} onClick={onDone || onClose}>Entregar tarea</Button>
    </>
  );

  return (
    <Modal title="Entregar tarea" onClose={onClose} footer={footer} width={620}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>{t.title}</h2>
        <Badge color={t.color || "warning"}>{t.due || "Vence en 3 días"}</Badge>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 20px" }}>{t.cls || "Cálculo II"} · 10 puntos · formato archivo</p>

      <Eyebrow>Instrucciones</Eyebrow>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-body)", margin: "10px 0 20px" }}>Resuelve los 8 ejercicios de derivadas del cuaderno. Sube un único PDF con el desarrollo completo de cada apartado. Se valorará el procedimiento, no solo el resultado.</p>

      <Eyebrow>Tu entrega</Eyebrow>
      <label
        style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 20px", borderRadius: "var(--radius-lg)", border: "2px dashed var(--border-default)", cursor: "pointer", textAlign: "center", background: "var(--surface-soft)" }}
        onClick={() => setFiles([{ name: "derivadas-marc.pdf", size: "310 KB" }])}
      >
        <span style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="upload" size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Arrastra tu archivo o haz clic para subir</span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>PDF, DOCX o imágenes · máx. 20 MB</span>
      </label>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)" }}>
          <Icon name="document-text" size={22} color="var(--primary-600)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{f.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.size}</div>
          </div>
          <button onClick={() => setFiles([])} aria-label="Quitar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}><Icon name="trash" size={18} /></button>
        </div>
      ))}
      <Textarea label="Comentario (opcional)" rows={3} placeholder="Añade una nota para tu profesora…" style={{ marginTop: 18 }} />
    </Modal>
  );
}
