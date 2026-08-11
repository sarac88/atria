"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useUpdateResource } from "@/lib/api/classwork";
import type { ModuleItem } from "@/lib/types";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  border: "none",
  outline: "none",
  borderRadius: "var(--radius-lg)",
  background: "var(--gray-100)",
  boxShadow: "inset 0 0 0 2px var(--border-default)",
  fontSize: 14.5,
  color: "var(--text-strong)",
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 };

export function EditResourceModal({
  classId,
  item,
  onClose,
}: {
  classId: string;
  item: ModuleItem;
  onClose: () => void;
}) {
  const updateResource = useUpdateResource(classId);
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url);
  const [error, setError] = useState<string | null>(null);

  /** Los ficheros subidos llevan una URL interna: solo se les puede cambiar el título. */
  const isLink = /^https?:\/\//i.test(item.url);
  const busy = updateResource.isPending;
  const canSubmit = label.trim().length > 0 && (!isLink || url.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setError(null);
    const value = url.trim();
    if (isLink && !/^https?:\/\//i.test(value)) {
      setError("Introduce una URL válida (empieza por http:// o https://).");
      return;
    }
    try {
      await updateResource.mutateAsync({ resourceId: item.id, label: label.trim(), ...(isLink ? { url: value } : {}) });
      onClose();
    } catch {
      setError("No se pudo guardar el recurso. Inténtalo de nuevo.");
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
      <Button variant="accent" onClick={submit} disabled={!canSubmit || busy}>{busy ? "Guardando…" : "Guardar cambios"}</Button>
    </>
  );

  return (
    <Modal title="Editar recurso" onClose={onClose} footer={footer} width={520}>
      <label style={{ display: "block" }}>
        <span style={labelStyle}>Título</span>
        <input
          value={label}
          autoFocus
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Nombre del recurso"
          style={fieldStyle}
        />
      </label>

      {isLink ? (
        <label style={{ display: "block", marginTop: 16 }}>
          <span style={labelStyle}>Enlace</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="https://ejemplo.com/articulo"
            style={fieldStyle}
          />
        </label>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "12px 0 0" }}>
          Para cambiar el archivo, elimina el recurso y sube uno nuevo.
        </p>
      )}

      {error ? <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
    </Modal>
  );
}
