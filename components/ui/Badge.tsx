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
};
const SOLID: Record<string, { background: string; color: string }> = {
  default: { background: "var(--gray-500)", color: "#fff" },
  draft: { background: "var(--primary-500)", color: "#fff" },
  new: { background: "var(--yellow-500)", color: "var(--primary-700)" },
  success: { background: "var(--success-500)", color: "#fff" },
  warning: { background: "var(--warning-500)", color: "#fff" },
  error: { background: "var(--error-500)", color: "#fff" },
  info: { background: "var(--info-500)", color: "#fff" },
};

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  children?: ReactNode;
  color?: BadgeColor;
  type?: "soft" | "solid";
}

/** Atria Badge / status pill. 4px radius, Cabin-semibold 14px. */
export function Badge({ children, color = "default", type = "soft", style = {}, ...rest }: BadgeProps) {
  const palette = (type === "solid" ? SOLID : SOFT)[color] || SOFT.default;
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 13px",
    borderRadius: "var(--radius-xs)",
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
