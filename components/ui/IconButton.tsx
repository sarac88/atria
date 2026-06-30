"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger";
type Size = "default" | "small";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
  label?: string;
}

/** Atria IconButton — a square, icon-only action. 44px hit target by default. */
export function IconButton({
  icon,
  variant = "primary",
  size = "default",
  disabled = false,
  label,
  onClick,
  style = {},
  ...rest
}: IconButtonProps) {
  const dim = size === "small" ? 30 : 44;
  const variants: Record<string, { background: string; color: string; shadow: string }> = {
    primary: { background: "var(--brand-primary)", color: "#fff", shadow: "none" },
    accent: { background: "var(--brand-accent)", color: "var(--text-on-accent)", shadow: "none" },
    secondary: { background: "var(--primary-200)", color: "var(--primary-700)", shadow: "none" },
    outline: { background: "transparent", color: "var(--brand-primary)", shadow: "inset 0 0 0 2px var(--brand-primary)" },
    ghost: { background: "transparent", color: "var(--brand-primary)", shadow: "none" },
    danger: { background: "transparent", color: "var(--status-error)", shadow: "none" },
  };
  const v = variants[variant] || variants.primary;
  const base: CSSProperties = {
    width: dim,
    height: dim,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "var(--state-disabled-bg)" : v.background,
    color: disabled ? "var(--state-disabled-text)" : v.color,
    boxShadow: v.shadow,
    transition: "filter .15s ease, background .15s ease",
    ...style,
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.9)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
      {...rest}
    >
      <span style={{ display: "inline-flex", width: size === "small" ? 16 : 20, height: size === "small" ? 16 : 20 }}>
        {icon}
      </span>
    </button>
  );
}
