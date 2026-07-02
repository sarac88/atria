"use client";

import { useState } from "react";
import { Button, Avatar, Badge, Icon, Textarea, IconButton } from "@/components/ui";
import { Modal, Eyebrow } from "@/components/layout";
import type { Submission } from "@/lib/types";

const FALLBACK: Submission = { id: 0, student: "Alba García", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "—", late: false };
const quick = ["10", "9", "8", "7", "6", "5"];

export function GradeModal({ submission, onClose }: { submission?: Submission | null; onClose: () => void }) {
  const s = submission || FALLBACK;
  const [grade, setGrade] = useState(s.grade && s.grade !== "—" ? s.grade : "");

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Saltar</Button>
      <Button variant="accent" onClick={onClose}>Guardar nota</Button>
    </>
  );

  return (
    <Modal title="Calificar entrega" onClose={onClose} footer={footer} width={860}>
      <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={s.student} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)" }}>{s.student}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{s.activity} · entregado el {s.date}</div>
            </div>
            <Badge color={s.status === "Atrasado" ? "error" : s.status === "Pendiente" ? "warning" : "success"}>{s.status}</Badge>
          </div>

          <div>
            <Eyebrow>Respuesta del alumno</Eyebrow>
            <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: "var(--text-body)", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0 }}>El límite de una función describe el valor al que se aproxima cuando la variable independiente se acerca a un punto determinado. No es necesario que la función esté definida en ese punto: lo que importa es la tendencia.</p>
              <p style={{ margin: 0 }}>Por ejemplo, para f(x) = (x² − 1) / (x − 1), aunque en x = 1 la función no está definida, al simplificar obtenemos x + 1, cuyo límite cuando x → 1 es 2.</p>
            </div>
            <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)" }}>
              <Icon name="document-text" size={20} color="var(--primary-600)" />
              <div><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>ensayo-limites.pdf</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>240 KB</div></div>
              <IconButton size="small" variant="ghost" label="Descargar" icon={<Icon name="download" size={18} />} />
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 24 }}>
          <Eyebrow>Nota</Eyebrow>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "8px 0 14px" }}>
            <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="0.0" style={{ width: 96, fontSize: 40, fontWeight: 700, color: "var(--brand-primary)", border: "none", outline: "none", background: "transparent", textAlign: "center", fontFamily: "var(--font-sans)" }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>/ 10</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {quick.map((q) => (
              <button key={q} onClick={() => setGrade(q)} style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: grade === q ? "var(--brand-primary)" : "var(--surface-soft)", color: grade === q ? "#fff" : "var(--text-strong)" }}>{q}</button>
            ))}
          </div>
          <Textarea label="Comentario para el alumno" rows={5} placeholder="Buen trabajo, has explicado…" />
        </div>
      </div>
    </Modal>
  );
}
