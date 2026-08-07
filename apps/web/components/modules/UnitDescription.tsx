"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, RichView } from "@/components/ui";
import { stripEmptyParagraphs } from "@/lib/rich-text";

/** Altura visible de la descripción antes de pedir "Ver más". */
const COLLAPSED_HEIGHT = 220;

/** Descripción guardada de la unidad, en un recuadro amarillo suave, encima de Recursos y Actividades. */
export function UnitDescription({ text }: { text: string }) {
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

  if (!html.trim()) return null;

  const clipped = overflows && !expanded;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 700,
        ["--atria-rich-gap" as string]: "16px",
        margin: "0 auto 20px",
        padding: "26px 30px",
        borderRadius: "var(--radius-md)",
        background: "var(--yellow-100)",
        boxShadow: "inset 0 0 0 1px var(--yellow-300)",
      }}
    >
      <div
        style={{
          position: "relative",
          maxHeight: clipped ? COLLAPSED_HEIGHT : undefined,
          overflow: clipped ? "hidden" : undefined,
        }}
      >
        <div ref={contentRef}>
          <RichView html={html} style={{ marginTop: 0 }} />
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
              background: "linear-gradient(to bottom, color-mix(in srgb, var(--yellow-100), transparent 100%), var(--yellow-100))",
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
            color: "var(--yellow-700)",
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            fontWeight: 700,
            transition: "background .15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--yellow-200)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ display: "inline-flex", transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "none" }}>
            <Icon name="chevron-down" size={16} />
          </span>
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}
