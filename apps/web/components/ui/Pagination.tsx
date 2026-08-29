"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  style?: CSSProperties;
}

function pageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    keep.add(2);
    keep.add(3);
    keep.add(4);
  }
  if (current >= total - 2) {
    keep.add(total - 1);
    keep.add(total - 2);
    keep.add(total - 3);
  }
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push("ellipsis");
    out.push(p);
  }
  return out;
}

function NavBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        color: disabled ? "var(--state-disabled-text)" : "var(--text-body)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Compact pager: “1–8 de 16” plus numbered pages. Hidden by the caller when a single page is enough. */
export function Pagination({ page, totalPages, total, pageSize, onChange, style = {} }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label="Paginación"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 20px",
        borderTop: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
        {from}–{to} de {total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <NavBtn label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon name="chevron-left" size={16} />
        </NavBtn>
        {pageItems(page, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e${i}`} aria-hidden style={{ width: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Página ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onChange(item)}
              style={{
                minWidth: 32,
                height: 32,
                padding: "0 8px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: item === page ? "var(--primary-100)" : "transparent",
                color: item === page ? "var(--brand-primary)" : "var(--text-body)",
                fontFamily: "var(--font-sans)",
                fontWeight: item === page ? 700 : 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ),
        )}
        <NavBtn label="Página siguiente" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <Icon name="chevron-right" size={16} />
        </NavBtn>
      </div>
    </nav>
  );
}
