"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "link";
type Size = "default" | "small";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  iconLeft = null,
  iconRight = null,
  disabled = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}: ButtonProps) {
  const sizes = {
    default: { padding: "13px 25px", fontSize: 14, radius: "var(--radius-md)", minHeight: 43, gap: 8 },
    small: { padding: "7px 15px", fontSize: 11, radius: "var(--radius-sm)", minHeight: 30, gap: 6 },
  }[size];
  const variants: Record<string, { background: string; color: string; shadow: string }> = {
    primary: { background: "var(--brand-primary)", color: "#fff", shadow: "none" },
    accent: { background: "var(--brand-accent)", color: "var(--text-on-accent)", shadow: "none" },
    secondary: { background: "var(--primary-200)", color: "var(--primary-700)", shadow: "none" },
    outline: { background: "transparent", color: "var(--brand-primary)", shadow: "inset 0 0 0 2px var(--brand-primary)" },
    ghost: { background: "transparent", color: "var(--brand-primary)", shadow: "none" },
    danger: { background: "var(--status-error)", color: "#fff", shadow: "none" },
    link: { background: "transparent", color: "var(--text-link)", shadow: "none" },
  };
  const v = variants[variant] || variants.primary;
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.gap,
    padding: variant === "link" ? 0 : sizes.padding,
    minHeight: variant === "link" ? "auto" : sizes.minHeight,
    border: "none",
    borderRadius: variant === "link" ? 0 : sizes.radius,
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--weight-bold)" as unknown as number,
    fontSize: sizes.fontSize,
    lineHeight: 1,
    letterSpacing: "var(--label-letter-spacing)",
    textTransform: "uppercase",
    textDecoration: variant === "link" ? "underline" : "none",
    textUnderlineOffset: 3,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "filter .15s ease, background .15s ease, box-shadow .15s ease, transform .05s ease",
    boxShadow: v.shadow,
    background: disabled ? "var(--state-disabled-bg)" : v.background,
    color: disabled ? "var(--state-disabled-text)" : v.color,
    opacity: disabled && (variant === "outline" || variant === "ghost" || variant === "link") ? 0.45 : 1,
    whiteSpace: "nowrap",
    ...style,
  };
  const iconSpan = (node: ReactNode) => (
    <span style={{ display: "inline-flex", width: "1.1em", height: "1.1em" }}>{node}</span>
  );
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.92)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(1px)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "none"; }}
      {...rest}
    >
      {iconLeft ? iconSpan(iconLeft) : null}
      {children}
      {iconRight ? iconSpan(iconRight) : null}
    </button>
  );
}
