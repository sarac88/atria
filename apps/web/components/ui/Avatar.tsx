import type { CSSProperties, HTMLAttributes } from "react";

const SIZES: Record<string, number> = { sm: 28, md: 40, lg: 56 };

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | number;
}

/** Atria Avatar — initials or image, navy-soft fallback. */
export function Avatar({ src, name = "", size = "md", style = {}, ...rest }: AvatarProps) {
  const dim = typeof size === "number" ? size : SIZES[size] || 40;
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const base: CSSProperties = {
    width: dim,
    height: dim,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--primary-100)",
    color: "var(--primary-600)",
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: dim * 0.38,
    ...style,
  };
  return (
    <span style={base} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </span>
  );
}
