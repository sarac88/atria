"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  media?: ReactNode | string;
  footer?: ReactNode;
  orientation?: "vertical" | "horizontal";
  interactive?: boolean;
}

/**
 * Atria Card — content container for classes, activities and resources.
 * 15px radius, hairline ring + soft navy-tinted elevation.
 */
export function Card({
  title,
  subtitle,
  children,
  media,
  footer,
  orientation = "vertical",
  interactive = false,
  style = {},
  onClick,
  ...rest
}: CardProps) {
  const horizontal = orientation === "horizontal";
  const mediaNode =
    typeof media === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    ) : (
      media
    );
  const base: CSSProperties = {
    display: "flex",
    flexDirection: horizontal ? "row" : "column",
    gap: horizontal ? 20 : 0,
    padding: 15,
    background: "var(--surface-card)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--ring-hairline), var(--shadow-md)",
    cursor: interactive ? "pointer" : "default",
    transition: "box-shadow .18s ease, transform .18s ease",
    overflow: "hidden",
    ...style,
  };
  return (
    <div
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-lg)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = "var(--ring-hairline), var(--shadow-md)";
          e.currentTarget.style.transform = "none";
        }
      }}
      {...rest}
    >
      {media ? (
        <div
          style={{
            flexShrink: 0,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            background: "var(--surface-sunken)",
            width: horizontal ? "42%" : "100%",
            height: horizontal ? "auto" : 170,
            minHeight: horizontal ? 150 : undefined,
          }}
        >
          {mediaNode}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
          padding: media && !horizontal ? "15px 5px 5px" : "5px",
        }}
      >
        {title || subtitle ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {title ? (
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: "var(--text-strong)" }}>
                {title}
              </span>
            ) : null}
            {subtitle ? (
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: "var(--text-muted)" }}>
                {subtitle}
              </span>
            ) : null}
          </div>
        ) : null}
        {children ? (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--text-body)", flex: 1 }}>
            {children}
          </div>
        ) : null}
        {footer ? (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 4 }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
