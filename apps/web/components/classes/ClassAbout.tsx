"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, RichView } from "@/components/ui";
import { Chip } from "@/components/layout";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import { useClearClassCover, useUploadClassCover } from "@/lib/api/classes";
import { resourceUrl } from "@/lib/api/client";
import { stripEmptyParagraphs } from "@/lib/rich-text";
import type { ClassInfo } from "@/lib/types";

/** Altura visible de la descripción antes de pedir «Ver más». */
const COLLAPSED_HEIGHT = 132;
/** Alto de la portada: fijo, no depende de lo larga que sea la descripción. */
const COVER_HEIGHT = 220;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Descripción plegable: si no cabe, se recorta con degradado y un botón para desplegar. */
function ClassDescription({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // El alto real depende del ancho y de la fuente cargada: lo medimos en vivo.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > COLLAPSED_HEIGHT + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  const clipped = overflows && !expanded;

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ position: "relative", maxHeight: clipped ? COLLAPSED_HEIGHT : undefined, overflow: clipped ? "hidden" : undefined }}>
        <div ref={contentRef}>
          <RichView html={html} style={{ fontSize: 15, marginTop: 0 }} />
        </div>
        {clipped ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 60,
              pointerEvents: "none",
              background: "linear-gradient(to bottom, transparent, var(--surface-card))",
            }}
          />
        ) : null}
      </div>

      {overflows ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            color: "var(--brand-primary)",
          }}
        >
          <Icon name="chevron-down" size={16} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Ficha «Sobre el curso»: portada a la izquierda y descripción a la derecha.
 * El docente puede subir/quitar la imagen y editar el texto desde aquí.
 */
export function ClassAbout({ c, canEdit }: { c: ClassInfo; canEdit?: boolean }) {
  const uploadCover = useUploadClassCover(c.id);
  const clearCover = useClearClassCover(c.id);
  const [editing, setEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = uploadCover.isPending || clearCover.isPending;
  const cover = c.coverUrl ? resourceUrl(c.coverUrl) : null;
  const desc = stripEmptyParagraphs(c.desc);

  const pickFile = async (f: File | null) => {
    if (!f || !canEdit) return;
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("La imagen supera el límite de 5 MB.");
      return;
    }
    setError(null);
    try {
      await uploadCover.mutateAsync(f);
    } catch {
      setError("No se pudo subir la portada. Inténtalo de nuevo.");
    }
  };

  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--ring-hairline), var(--shadow-md)",
        padding: 22,
        display: "grid",
        gridTemplateColumns: "minmax(220px, 300px) 1fr",
        gap: 26,
        alignItems: "stretch",
      }}
      className="atria-2col"
    >
      {/* Portada */}
      <div
        onDragOver={canEdit ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
        onDragLeave={canEdit ? () => setDragOver(false) : undefined}
        onDrop={canEdit ? (e) => { e.preventDefault(); setDragOver(false); void pickFile(e.dataTransfer.files?.[0] ?? null); } : undefined}
        style={{
          position: "relative",
          // Altura fija y anclada arriba: al desplegar la descripción crece la fila,
          // pero la portada se queda como está en vez de estirarse con ella.
          height: COVER_HEIGHT,
          alignSelf: "start",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--surface-sunken)",
          border: cover ? "none" : `2px dashed ${dragOver ? "var(--brand-primary)" : "var(--border-strong)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: cover ? 0 : 16,
          transition: "border-color .15s ease",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`Portada de ${c.name}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ color: "var(--text-muted)" }}>
            <Icon name="photo" size={30} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-body)", marginTop: 8 }}>Portada del curso</div>
            {canEdit ? (
              <>
                <div style={{ fontSize: 12.5, margin: "4px 0 12px" }}>Arrástrala aquí · JPG, PNG o WEBP · máx. 5 MB</div>
                <Button variant="outline" size="small" iconLeft={<Icon name="upload" size={16} />} onClick={() => fileInput.current?.click()} disabled={busy}>
                  {busy ? "Subiendo…" : "Subir imagen"}
                </Button>
              </>
            ) : null}
          </div>
        )}

        {cover && canEdit ? (
          <div style={{ position: "absolute", right: 8, bottom: 8, display: "flex", gap: 8 }}>
            <Button variant="outline" size="small" iconLeft={<Icon name="upload" size={15} />} onClick={() => fileInput.current?.click()} disabled={busy}>
              Cambiar
            </Button>
            <Button variant="outline" size="small" iconLeft={<Icon name="trash" size={15} />} onClick={() => clearCover.mutate()} disabled={busy}>
              Quitar
            </Button>
          </div>
        ) : null}

        <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => void pickFile(e.target.files?.[0] ?? null)} />
      </div>

      {/* Texto */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <h2 style={{ fontSize: 26, margin: 0, color: "var(--text-strong)", minWidth: 0 }}>{c.name}</h2>
          {canEdit ? (
            <Button variant="outline" size="small" iconLeft={<Icon name="pencil" size={15} />} onClick={() => setEditing(true)}>
              Editar
            </Button>
          ) : null}
        </div>

        {desc.trim() ? (
          <ClassDescription html={desc} />
        ) : (
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: "14px 0 0", lineHeight: 1.6 }}>
            {canEdit ? "Todavía no hay descripción. Usa «Editar» para contar de qué va el curso." : "Este curso aún no tiene descripción."}
          </p>
        )}

        {error ? (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: "auto", paddingTop: 18 }}>
          <Chip icon="academic-cap">{c.code}</Chip>
          <Chip icon="users">{c.students} alumnos</Chip>
          <Chip icon="calendar">{c.nextSession}</Chip>
        </div>
      </div>

      {editing ? (
        <CreateClassModal klass={c} onClose={() => setEditing(false)} onDone={() => setEditing(false)} />
      ) : null}
    </section>
  );
}
