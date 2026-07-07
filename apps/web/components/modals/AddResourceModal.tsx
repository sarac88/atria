"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import { YouTubeGlyph, VimeoGlyph, GlobeGlyph } from "@/components/icons/brand-glyphs";
import { useAddResource, useUploadResource } from "@/lib/api/classwork";

const tint = (col: string, pct = 12) => `color-mix(in srgb, ${col} ${pct}%, var(--surface-card))`;
const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx";
const ALLOWED_EXT = ["pdf", "doc", "docx"];

interface Source {
  id: number;
  label: string;
  hint: string;
  col: string;
  glyph: (size: number) => ReactNode;
  /** Stored resource `type` + friendly label for link sources. */
  resType: string;
  title: string;
}

const SOURCES: Source[] = [
  { id: 0, label: "Subir archivo", hint: "PDF, DOC, DOCX", col: "var(--primary-600)", glyph: (s) => <Icon name="document-add" size={s} />, resType: "document-text", title: "" },
  { id: 1, label: "YouTube", hint: "Pega el enlace del vídeo", col: "#FF0000", glyph: (s) => <YouTubeGlyph size={s} />, resType: "youtube", title: "Vídeo de YouTube" },
  { id: 2, label: "Vimeo", hint: "Pega el enlace del vídeo", col: "#1AB7EA", glyph: (s) => <VimeoGlyph size={s} />, resType: "vimeo", title: "Vídeo de Vimeo" },
  { id: 3, label: "Página web", hint: "Cualquier URL o artículo", col: "var(--brand-accent)", glyph: (s) => <GlobeGlyph size={s} />, resType: "web", title: "Página web" },
];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function AddResourceModal({
  classId,
  moduleId,
  moduleTitle,
  onClose,
  onDone,
}: {
  classId: string;
  moduleId: string;
  moduleTitle?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const addResource = useAddResource(classId);
  const uploadResource = useUploadResource(classId);
  const [sel, setSel] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const active = SOURCES[sel];
  const busy = addResource.isPending || uploadResource.isPending;
  const canSubmit = sel === 0 ? !!file : url.trim().length > 0;

  const pickFile = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("Solo se admiten ficheros PDF, DOC o DOCX.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("El fichero supera el límite de 50 MB.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const submit = async () => {
    setError(null);
    try {
      if (sel === 0) {
        if (!file) return;
        await uploadResource.mutateAsync({ moduleId, file });
      } else {
        const value = url.trim();
        if (!value) return;
        if (!/^https?:\/\//i.test(value)) {
          setError("Introduce una URL válida (empieza por http:// o https://).");
          return;
        }
        await addResource.mutateAsync({ moduleId, type: active.resType, label: active.title, meta: value, url: value });
      }
      onDone();
    } catch {
      setError("No se pudo añadir el recurso. Inténtalo de nuevo.");
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,18,38,.45)", backdropFilter: "blur(2px)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 600, maxHeight: "90vh", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-2xl)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 style={{ fontSize: 20, margin: 0, color: "var(--text-strong)" }}>Añadir recurso</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "5px 0 0" }}>
              {moduleTitle ? `A «${moduleTitle}» · elige de dónde traer el material` : "Elige de dónde quieres traer el material"}
            </p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} style={{ border: "none", background: "var(--surface-sunken)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", width: 34, height: 34, borderRadius: "var(--radius-md)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={19} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {SOURCES.map((o) => {
              const on = sel === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { setSel(o.id); setError(null); }}
                  style={{ textAlign: "left", display: "flex", gap: 14, alignItems: "center", padding: 16, border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer", background: on ? tint(o.col) : "var(--gray-100)", boxShadow: on ? `inset 0 0 0 2px ${o.col}` : "inset 0 0 0 2px var(--border-default)", transition: "all .15s ease" }}
                >
                  <span style={{ width: 52, height: 52, flexShrink: 0, borderRadius: "var(--radius-md)", background: on ? o.col : "var(--surface-card)", color: on ? "#fff" : o.col, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: on ? "none" : "var(--ring-hairline)" }}>
                    {o.glyph(o.id === 0 ? 30 : o.id === 1 ? 32 : 30)}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: "var(--text-strong)" }}>{o.label}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{o.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contextual area */}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px dashed var(--border-default)" }}>
            {sel === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
                style={{ border: `2px dashed ${dragOver ? "var(--brand-primary)" : "var(--border-strong)"}`, borderRadius: "var(--radius-lg)", padding: "28px 20px", textAlign: "center", background: "var(--surface-sunken)", transition: "border-color .15s ease" }}
              >
                <span style={{ display: "inline-flex", width: 46, height: 46, borderRadius: "50%", background: tint("var(--primary-600)", 16), color: "var(--primary-600)", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon name={file ? "document-text" : "upload"} size={22} />
                </span>
                {file ? (
                  <>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)", wordBreak: "break-word" }}>{file.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 12px" }}>{humanSize(file.size)} · listo para subir</div>
                    <Button variant="outline" size="small" iconLeft={<Icon name="folder" size={16} />} onClick={() => fileInput.current?.click()}>Cambiar archivo</Button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>Arrastra tu archivo aquí</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 12px" }}>o selecciónalo desde tu equipo · máx. 50 MB</div>
                    <Button variant="outline" size="small" iconLeft={<Icon name="folder" size={16} />} onClick={() => fileInput.current?.click()}>Examinar</Button>
                  </>
                )}
                <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--gray-100)", borderRadius: "var(--radius-lg)", boxShadow: "inset 0 0 0 2px var(--border-default)", padding: "0 14px", height: 52 }}>
                <span style={{ color: active.col, display: "inline-flex" }}>{active.glyph(22)}</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !busy) submit(); }}
                  placeholder={active.id === 3 ? "https://ejemplo.com/articulo" : `Pega el enlace de ${active.label}…`}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
                />
              </div>
            )}
          </div>

          {error ? <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant="accent" onClick={submit} disabled={!canSubmit || busy}>{busy ? "Añadiendo…" : "Añadir recurso"}</Button>
        </div>
      </div>
    </div>
  );
}
