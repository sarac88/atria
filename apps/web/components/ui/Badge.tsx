import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { BadgeColor } from "@/lib/types";

const SOFT: Record<string, { background: string; color: string }> = {
  default: { background: "var(--gray-100)", color: "var(--gray-500)" },
  draft: { background: "var(--primary-100)", color: "var(--primary-600)" },
  new: { background: "var(--yellow-200)", color: "var(--yellow-700)" },
  success: { background: "var(--success-100)", color: "var(--success-600)" },
  warning: { background: "var(--warning-200)", color: "var(--warning-600)" },
  error: { background: "var(--error-100)", color: "var(--error-600)" },
  info: { background: "var(--info-100)", color: "var(--info-600)" },
  // Clase en directo: invertido, para que cante entre las etiquetas de info normales.
  live: { background: "var(--info-600)", color: "var(--info-100)" },
};
const SOLID: Record<string, { background: string; color: string }> = {
  default: { background: "var(--gray-500)", color: "#fff" },
  draft: { background: "var(--primary-500)", color: "#fff" },
  new: { background: "var(--yellow-500)", color: "var(--primary-700)" },
  success: { background: "var(--success-500)", color: "#fff" },
  warning: { background: "var(--warning-500)", color: "#fff" },
  error: { background: "var(--error-500)", color: "#fff" },
  info: { background: "var(--info-500)", color: "#fff" },
  live: { background: "var(--info-600)", color: "var(--info-100)" },
};

/** El estado «En vivo» llega de la API como `info`; aquí se le da su propia paleta. */
export function statusBadgeColor(color: BadgeColor): BadgeColor | "live" {
  return color === "info" ? "live" : color;
}

/**
 * Contadores de notificación: redondos y en azul. Sólo admiten un segundo tono,
 * el naranja de aviso, para los que van dentro de una tarjeta de «pendiente».
 */
const COUNT: Record<string, { background: string; color: string }> = {
  default: { background: "var(--info-800)", color: "var(--info-100)" },
  warning: { background: "var(--warning-500)", color: "#fff" },
};

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  children?: ReactNode;
  color?: BadgeColor | "live";
  type?: "soft" | "solid";
  /** Cifra suelta (avisos sin revisar, alumnos inscritos…): píldora redonda en vez de etiqueta de estado. */
  count?: boolean;
}

/** Atria Badge / status pill. 4px radius, Cabin-semibold 14px. */
export function Badge({ children, color = "default", type = "soft", count = false, style = {}, ...rest }: BadgeProps) {
  const palette = count ? (COUNT[color] || COUNT.default) : (type === "solid" ? SOLID : SOFT)[color] || SOFT.default;
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: count ? "center" : undefined,
    gap: 6,
    padding: count ? 5 : "4px 13px",
    minWidth: count ? 28 : undefined,
    boxSizing: "border-box",
    borderRadius: count ? "var(--radius-pill)" : "var(--radius-xs)",
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--weight-semibold)" as unknown as number,
    fontSize: 14,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    background: palette.background,
    color: palette.color,
    ...style,
  };
  return (
    <span style={base} {...rest}>
      {children}
    </span>
  );
}
