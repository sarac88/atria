"use client";

import { useRef, useState } from "react";
import { Button, Icon, RichText, RichView } from "@/components/ui";
import { EmptyState } from "@/components/layout";
import { useClearClassCover, useUpdateClass, useUploadClassCover } from "@/lib/api/classes";
import { resourceUrl } from "@/lib/api/client";
import { stripEmptyParagraphs } from "@/lib/rich-text";
import type { ClassCoverAlign, ClassInfo } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const COVER_ALIGN_OPTIONS: { value: ClassCoverAlign; label: string; icon: string }[] = [
  { value: "left", label: "Izquierda", icon: "arrow-left" },
  { value: "right", label: "Derecha", icon: "arrow-right" },
  { value: "full", label: "Completo", icon: "photo" },
];

/** Opción del control segmentado de posición de la portada. */
const segmentStyle = (on: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  border: "none",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  background: on ? "var(--surface-card)" : "transparent",
  boxShadow: on ? "var(--shadow-sm)" : "none",
  color: on ? "var(--brand-primary)" : "var(--text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: 12.5,
  fontWeight: 700,
  transition: "background .15s ease, color .15s ease",
});

/** Identificador del apartado «Sobre el curso» dentro del carril de Módulos. */
export const ABOUT_UNIT = "__about__";

/** Entrada «Sobre el curso» del carril de unidades, encima del listado. */
export function AboutRailItem({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        background: active ? "var(--primary-100)" : hover ? "var(--state-hover-tint)" : "transparent",
        transition: "background .15s ease",
      }}
    >
      <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: "var(--yellow-200)", color: "var(--yellow-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="home" size={16} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: active ? "var(--brand-primary)" : "var(--text-strong)" }}>Sobre el curso</span>
    </button>
  );
}

/** Separador entre «Sobre el curso» y el listado de unidades. */
export const RAIL_DIVIDER: React.CSSProperties = { height: 1, background: "var(--border-subtle)", margin: "14px 6px" };

/**
 * Ficha «Sobre el curso»: portada opcional con tres posiciones (izquierda,
 * derecha o ancho completo). El docente puede subir/quitar la imagen y editar
 * el título y el texto por separado en el mismo sitio.
 * `embedded`: sin tarjeta propia, para ir dentro del panel de Módulos.
 */
export function ClassAbout({ c, canEdit, embedded }: { c: ClassInfo; canEdit?: boolean; embedded?: boolean }) {
  const uploadCover = useUploadClassCover(c.id);
  const clearCover = useClearClassCover(c.id);
  const updateClass = useUpdateClass(c.id);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftName, setDraftName] = useState(c.name);
  const [draftDesc, setDraftDesc] = useState("");
  const [showCoverSlot, setShowCoverSlot] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = uploadCover.isPending || clearCover.isPending;
  const alignBusy = updateClass.isPending;
  const cover = c.coverUrl ? resourceUrl(c.coverUrl) : null;
  const coverAlign = c.coverAlign ?? "right";
  const desc = stripEmptyParagraphs(c.desc);
  const showCoverArea = !!cover || (canEdit && showCoverSlot);

  const startEditName = () => {
    setDraftName(c.name);
    setError(null);
    setEditingName(true);
  };
  const startEditDesc = () => {
    setDraftDesc(desc);
    setError(null);
    setEditingDesc(true);
  };
  const onSaveError = () => setError("No se pudo guardar. Inténtalo de nuevo.");
  const saveName = () => {
    const name = draftName.trim();
    if (!name) return;
    updateClass.mutate({ name }, { onSuccess: () => setEditingName(false), onError: onSaveError });
  };
  const saveDesc = () => {
    updateClass.mutate(
      { desc: stripEmptyParagraphs(draftDesc).trim() },
      { onSuccess: () => setEditingDesc(false), onError: onSaveError },
    );
  };

  const setCoverAlign = (align: ClassCoverAlign) => {
    if (align === coverAlign) return;
    updateClass.mutate({ coverAlign: align });
  };

  const removeCover = () => {
    if (cover) {
      clearCover.mutate(undefined, { onSuccess: () => setShowCoverSlot(false) });
    } else {
      setShowCoverSlot(false);
    }
  };

  const pickFile = async (f: File | null) => {
    // El input conserva el valor tras elegir: sin limpiarlo, volver a escoger el
    // mismo archivo no dispararía `change` y la portada no se podría reintentar.
    if (fileInput.current) fileInput.current.value = "";
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
        background: embedded ? "transparent" : "var(--surface-card)",
        borderRadius: embedded ? 0 : "var(--radius-xl)",
        boxShadow: embedded ? "none" : "var(--ring-hairline), var(--shadow-md)",
        padding: embedded ? 0 : 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {editingName ? (
          <>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              placeholder="Nombre de la clase"
              aria-label="Nombre de la clase"
              style={{
                flex: 1,
                minWidth: 200,
                height: 42,
                padding: "0 12px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border-default)",
                fontFamily: "var(--font-sans)",
                fontSize: embedded ? 18 : 22,
                fontWeight: 700,
                color: "var(--text-strong)",
                background: "#fff",
              }}
            />
            <Button size="small" variant="accent" disabled={!draftName.trim() || updateClass.isPending} onClick={saveName}>
              {updateClass.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button size="small" variant="ghost" onClick={() => setEditingName(false)}>Cancelar</Button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: embedded ? 21 : 26, margin: 0, color: "var(--text-strong)", minWidth: 0 }}>{c.name}</h2>
            {canEdit ? (
              <Button variant="outline" size="small" iconLeft={<Icon name="pencil" size={15} />} onClick={startEditName}>
                Editar
              </Button>
            ) : null}
          </>
        )}
      </div>

      {editingDesc ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <RichText
            value={draftDesc}
            onChange={setDraftDesc}
            placeholder="Qué se trabaja en este curso, objetivos y cómo se organiza."
            minHeight={160}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="small" variant="accent" disabled={updateClass.isPending} onClick={saveDesc}>
              {updateClass.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button size="small" variant="ghost" onClick={() => setEditingDesc(false)}>Cancelar</Button>
          </div>
        </div>
      ) : canEdit ? (
        // Barra de edición: texto e imagen a la izquierda; posición de la portada
        // y «Quitar» juntos a la derecha, en un control compacto.
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 }}>
          <Button variant="outline" size="small" iconLeft={<Icon name="document-text" size={15} />} onClick={startEditDesc}>
            Editar texto
          </Button>
          {!showCoverArea ? (
            <Button variant="outline" size="small" iconLeft={<Icon name="photo" size={15} />} onClick={() => setShowCoverSlot(true)}>
              Añadir imagen
            </Button>
          ) : (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
              <div role="group" aria-label="Posición de la imagen" style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: "var(--radius-md)", background: "var(--gray-100)" }}>
                {COVER_ALIGN_OPTIONS.map(({ value, label, icon }) => {
                  const on = coverAlign === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={on}
                      disabled={busy || alignBusy}
                      onClick={() => setCoverAlign(value)}
                      style={segmentStyle(on)}
                    >
                      <Icon name={icon} size={15} />{label}
                    </button>
                  );
                })}
              </div>
              <Button variant="ghost" size="small" iconLeft={<Icon name="trash" size={15} />} onClick={removeCover} disabled={busy}>
                Quitar
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {showCoverArea ? (
        <>
          <div
            className={`atria-about-cover atria-about-cover--${coverAlign}`}
            onDragOver={canEdit ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
            onDragLeave={canEdit ? () => setDragOver(false) : undefined}
            onDrop={canEdit ? (e) => { e.preventDefault(); setDragOver(false); void pickFile(e.dataTransfer.files?.[0] ?? null); } : undefined}
            style={{
              position: "relative",
              aspectRatio: coverAlign === "full" ? "16 / 9" : "4 / 3",
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

            {cover && canEdit && dragOver ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(11,18,38,.55)",
                  boxShadow: "inset 0 0 0 3px var(--brand-accent)",
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                Suelta la imagen para cambiar la portada
              </div>
            ) : null}

            {cover && canEdit ? (
              <div
                style={{
                  position: "absolute",
                  inset: "auto 0 0 0",
                  padding: 10,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  background: "linear-gradient(to top, rgba(11,18,38,.55), rgba(11,18,38,0))",
                  pointerEvents: dragOver ? "none" : undefined,
                }}
              >
                <Button
                  variant="secondary"
                  size="small"
                  iconLeft={<Icon name="upload" size={15} />}
                  onClick={() => fileInput.current?.click()}
                  disabled={busy}
                  style={{ background: "var(--surface-card)", color: "var(--brand-primary)", boxShadow: "var(--shadow-md)" }}
                >
                  {uploadCover.isPending ? "Subiendo…" : "Cambiar imagen"}
                </Button>
              </div>
            ) : null}

            <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => void pickFile(e.target.files?.[0] ?? null)} />
          </div>
        </>
      ) : null}

      {!editingDesc && desc.trim() ? (
        // Mismo margen que la portada flotante, para que texto e imagen arranquen a la par.
        <RichView html={desc} style={{ fontSize: 15, marginTop: 14 }} />
      ) : !editingDesc ? (
        <EmptyState
          compact
          illo="sin-clases"
          title="Aún no hay descripción"
          text={canEdit ? "Cuenta de qué va el curso, sus objetivos y cómo se organiza." : "Este curso todavía no tiene descripción."}
          action={canEdit ? (
            <Button variant="outline" size="small" iconLeft={<Icon name="pencil" size={15} />} onClick={startEditDesc}>
              Escribir descripción
            </Button>
          ) : undefined}
        />
      ) : null}

      {error ? (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>
          {error}
        </div>
      ) : null}

      {/* Cierra la portada flotante para que la ficha la envuelva entera. */}
      <div style={{ clear: "both" }} />
    </section>
  );
}
