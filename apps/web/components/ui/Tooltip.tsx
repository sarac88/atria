"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  /** Contenido del globo. Si viene vacío no se muestra nada. */
  text: ReactNode;
  children: ReactNode;
  /** Ancho máximo del globo. */
  maxWidth?: number;
  /** Estilos del envoltorio que dispara el globo. */
  style?: CSSProperties;
  /** Si el envoltorio recibe foco con el teclado. Desactívalo cuando hay otro disparador equivalente al lado. */
  focusable?: boolean;
}

/** Separación entre el elemento y el globo, y margen mínimo con el borde de la ventana. */
const GAP = 9;
const EDGE = 8;

interface Anchor {
  cx: number;
  top: number;
  bottom: number;
}

/**
 * Globo de ayuda que se muestra al pasar el cursor (o al enfocar con teclado).
 * Se pinta en un portal con posición fija, así no lo recorta ningún contenedor
 * con scroll, y se recoloca solo si no cabe arriba o se sale por un lateral.
 */
export function Tooltip({ text, children, maxWidth = 260, style, focusable = true }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [place, setPlace] = useState({ shift: 0, below: false, ready: false });

  const show = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setPlace({ shift: 0, below: false, ready: false });
    setAnchor({ cx: r.left + r.width / 2, top: r.top - GAP, bottom: r.bottom + GAP });
  }, []);

  const hide = useCallback(() => setAnchor(null), []);

  /** Corrige la posición una vez medido el globo: lo voltea abajo o lo mete en pantalla. */
  useLayoutEffect(() => {
    if (!anchor || !bubbleRef.current) return;
    const r = bubbleRef.current.getBoundingClientRect();
    const below = r.top < EDGE;
    let shift = 0;
    if (r.left < EDGE) shift = EDGE - r.left;
    else if (r.right > window.innerWidth - EDGE) shift = window.innerWidth - EDGE - r.right;
    setPlace({ shift, below, ready: true });
  }, [anchor]);

  /** Al hacer scroll o redimensionar el ancla se mueve: se cierra en vez de quedar flotando. */
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [anchor, hide]);

  const arrow = {
    position: "absolute" as const,
    left: `calc(50% - ${place.shift}px)`,
    width: 9,
    height: 9,
    background: "var(--surface-inverse)",
    borderRadius: 1,
    ...(place.below ? { top: -4 } : { bottom: -4 }),
    transform: "translateX(-50%) rotate(45deg)",
  };

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={focusable ? 0 : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: "inline-flex", outline: "none", ...style }}
      >
        {children}
      </span>

      {anchor && text && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={bubbleRef}
              role="tooltip"
              style={{
                position: "fixed",
                left: anchor.cx,
                top: place.below ? anchor.bottom : anchor.top,
                transform: `translate(calc(-50% + ${place.shift}px), ${place.below ? "0" : "-100%"})`,
                zIndex: 300,
                maxWidth,
                padding: "7px 11px",
                borderRadius: "var(--radius-md)",
                background: "var(--surface-inverse)",
                color: "var(--text-on-inverse)",
                fontSize: 12.5,
                lineHeight: 1.4,
                fontWeight: 500,
                textAlign: "center",
                boxShadow: "var(--shadow-lg)",
                pointerEvents: "none",
                opacity: place.ready ? 1 : 0,
                transition: "opacity .12s ease",
              }}
            >
              {text}
              <span style={arrow} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
