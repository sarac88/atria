"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, RichView } from "@/components/ui";
import { useClearModuleCover, useUploadModuleCover } from "@/lib/api/classwork";
import { resourceUrl } from "@/lib/api/client";
import { stripEmptyParagraphs } from "@/lib/rich-text";

/** Altura visible de la descripción antes de pedir "Ver más". */
const COLLAPSED_HEIGHT = 260;

/** Ancho máximo de la columna de texto: márgenes a ambos lados y lectura cómoda. */
const TEXT_WIDTH = 720;

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

interface UnitDescriptionProps {
  text: string;
  /** Cabecera guardada de la unidad, o "" si aún no tiene imagen. */
  coverUrl?: string;
  /** Con classId + moduleId el docente puede subir o quitar la cabecera. */
  classId?: string;
  moduleId?: string;
  canEdit?: boolean;
}

/**
 * Introducción de la unidad: cabecera opcional con la imagen que suba el docente
 * y, debajo, el texto sobre fondo blanco en una columna centrada.
 */
export function UnitDescription({ text, coverUrl = "", classId, moduleId, canEdit }: UnitDescriptionProps) {
  const html = stripEmptyParagraphs(text);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // El texto puede crecer al cargar imágenes o al cambiar el ancho: medimos en vivo.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > COLLAPSED_HEIGHT + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  const manageable = Boolean(canEdit && classId && moduleId);
  const cover = coverUrl ? resourceUrl(coverUrl) : null;
  const hasText = Boolean(html.trim());

  // Sin nada que enseñar ni nada que gestionar, la intro no ocupa sitio.
  if (!hasText && !cover && !manageable) return null;

  const clipped = overflows && !expanded;

  return (
    <div
      style={{
        width: "100%",
        ["--atria-rich-gap" as string]: "16px",
        margin: "0 0 20px",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--surface-card)",
        boxShadow: "var(--ring-hairline)",
      }}
    >
      <UnitCover cover={cover} classId={classId ?? ""} moduleId={moduleId ?? ""} manageable={manageable} />

      <div style={{ maxWidth: TEXT_WIDTH, margin: "0 auto", padding: "30px 32px 28px" }}>
        {hasText ? (
          <>
            <div
              style={{
                position: "relative",
                maxHeight: clipped ? COLLAPSED_HEIGHT : undefined,
                overflow: clipped ? "hidden" : undefined,
              }}
            >
              <div ref={contentRef}>
                <RichView html={html} style={{ marginTop: 0, fontSize: 15 }} />
              </div>
              {clipped ? (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 72,
                    pointerEvents: "none",
                    background: "linear-gradient(to bottom, color-mix(in srgb, var(--surface-card), transparent 100%), var(--surface-card))",
                  }}
                />
              ) : null}
            </div>

            {overflows ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                  padding: "6px 12px 6px 10px",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--brand-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13.5,
                  fontWeight: 700,
                  transition: "background .15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ display: "inline-flex", transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "none" }}>
                  <Icon name="chevron-down" size={16} />
                </span>
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            ) : null}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>Sin descripción.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Cabecera de la introducción. Con imagen se ve a todo el ancho; para el docente,
 * mientras no haya ninguna, queda el hueco punteado que invita a subirla.
 */
function UnitCover({
  cover,
  classId,
  moduleId,
  manageable,
}: {
  cover: string | null;
  classId: string;
  moduleId: string;
  manageable: boolean;
}) {
  const uploadCover = useUploadModuleCover(classId);
  const clearCover = useClearModuleCover(classId);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = uploadCover.isPending || clearCover.isPending;

  const pickFile = async (f: File | null) => {
    // El input conserva el valor tras elegir: sin limpiarlo, volver a escoger el
    // mismo archivo no dispararía `change` y no se podría reintentar.
    if (fileInput.current) fileInput.current.value = "";
    if (!f || !manageable) return;
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
      await uploadCover.mutateAsync({ moduleId, file: f });
    } catch {
      setError("No se pudo subir la cabecera. Inténtalo de nuevo.");
    }
  };

  if (!cover && !manageable) return null;

  return (
    <>
      <div
        onDragOver={manageable ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
        onDragLeave={manageable ? () => setDragOver(false) : undefined}
        onDrop={manageable ? (e) => { e.preventDefault(); setDragOver(false); void pickFile(e.dataTransfer.files?.[0] ?? null); } : undefined}
        style={{
          position: "relative",
          // Banda ancha: la cabecera acompaña al texto, no lo tapa.
          aspectRatio: cover ? "16 / 4" : undefined,
          minHeight: cover ? undefined : 132,
          background: "var(--surface-sunken)",
          border: cover ? "none" : `2px dashed ${dragOver ? "var(--brand-primary)" : "var(--border-subtle)"}`,
          borderRadius: cover ? 0 : "var(--radius-lg)",
          margin: cover ? 0 : 12,
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
          <img src={cover} alt="Cabecera de la unidad" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ color: "var(--text-muted)" }}>
            <Icon name="photo" size={26} />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-body)", marginTop: 6 }}>Cabecera de la unidad</div>
            <div style={{ fontSize: 12.5, margin: "3px 0 10px" }}>Arrástrala aquí · JPG, PNG o WEBP · máx. 5 MB</div>
            <Button variant="outline" size="small" iconLeft={<Icon name="upload" size={16} />} onClick={() => fileInput.current?.click()} disabled={busy}>
              {busy ? "Subiendo…" : "Subir imagen"}
            </Button>
          </div>
        )}

        {cover && manageable && dragOver ? (
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
            Suelta la imagen para cambiar la cabecera
          </div>
        ) : null}

        {cover && manageable ? (
          // Velo + botones opacos: sobre una foto clara los de contorno se pierden.
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
            <Button
              variant="secondary"
              size="small"
              iconLeft={<Icon name="trash" size={15} />}
              onClick={() => clearCover.mutate(moduleId)}
              disabled={busy}
              style={{ background: "var(--surface-card)", color: "var(--text-body)", boxShadow: "var(--shadow-md)" }}
            >
              Quitar
            </Button>
          </div>
        ) : null}

        <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => void pickFile(e.target.files?.[0] ?? null)} />
      </div>

      {error ? (
        <div style={{ margin: "0 12px", fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>
          {error}
        </div>
      ) : null}
    </>
  );
}
