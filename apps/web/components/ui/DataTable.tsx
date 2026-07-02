"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Checkbox } from "./Checkbox";

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface DataTableProps<T = Record<string, unknown>> {
  title?: ReactNode;
  columns?: Column<T>[];
  rows?: T[];
  selectable?: boolean;
  selectedKeys?: Array<string | number> | null;
  onSelectionChange?: (keys: Array<string | number>) => void;
  rowKey?: string;
  toolbar?: ReactNode;
  style?: CSSProperties;
}

const thStyle: CSSProperties = { padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", verticalAlign: "middle", height: 35, lineHeight: 1.3, boxSizing: "border-box" };
const tdStyle: CSSProperties = { padding: "16px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "middle" };

function SortGlyph({ active, dir }: { active: boolean; dir: number }) {
  const up = active && dir === 1;
  const down = active && dir === -1;
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 1.5L9 5H3L6 1.5Z" fill={up ? "var(--brand-primary)" : "var(--gray-300)"} />
      <path d="M6 12.5L3 9H9L6 12.5Z" fill={down ? "var(--brand-primary)" : "var(--gray-300)"} />
    </svg>
  );
}

/**
 * Atria DataTable — workhorse for class lists, submissions and grades.
 * Card shell with a titled toolbar, sortable headers, row selection.
 */
export function DataTable<T extends Record<string, any>>({
  title,
  columns = [],
  rows = [],
  selectable = true,
  selectedKeys = null,
  onSelectionChange,
  rowKey = "id",
  toolbar,
  style = {},
}: DataTableProps<T>) {
  const [internalSel, setInternalSel] = useState<Array<string | number>>([]);
  const [sort, setSort] = useState<{ key: string | null; dir: number }>({ key: null, dir: 1 });
  const isControlled = selectedKeys !== null;
  const sel = isControlled ? selectedKeys! : internalSel;
  const setSel = (next: Array<string | number>) => {
    if (!isControlled) setInternalSel(next);
    onSelectionChange?.(next);
  };
  const keyOf = (r: T, i: number): string | number => (r[rowKey] !== undefined ? r[rowKey] : i);
  const allKeys = rows.map(keyOf);
  const allOn = rows.length > 0 && allKeys.every((k) => sel.includes(k));
  const toggleAll = () => setSel(allOn ? [] : allKeys);
  const toggleRow = (k: string | number) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);
  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key as string];
      const bv = b[sort.key as string];
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
  }, [rows, sort, columns]);
  const doSort = (key: string) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", overflow: "hidden", ...style }}>
      {title || toolbar ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 24px", height: 55, boxSizing: "border-box" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>{toolbar}</div>
        </div>
      ) : null}
      <div style={{ overflowX: "auto", margin: "4px 24px 24px", border: "1px solid var(--border-default)", borderRadius: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
          <thead>
            <tr style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-default)" }}>
              {selectable ? (
                <th style={{ ...thStyle, width: 48, paddingLeft: 24 }}>
                  <Checkbox checked={allOn} onChange={toggleAll} />
                </th>
              ) : null}
              {columns.map((c) => (
                <th key={c.key} style={{ ...thStyle, textAlign: c.align || "left" }}>
                  <button
                    type="button"
                    onClick={() => c.sortable !== false && doSort(c.key)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: c.sortable !== false ? "pointer" : "default", padding: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}
                  >
                    {c.label}
                    {c.sortable !== false ? <SortGlyph active={sort.key === c.key} dir={sort.dir} /> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const k = keyOf(r, i);
              const selectedRow = sel.includes(k);
              return (
                <tr
                  key={k}
                  style={{ background: selectedRow ? "var(--state-selected-tint)" : "transparent", transition: "background .12s ease" }}
                  onMouseEnter={(e) => { if (!selectedRow) e.currentTarget.style.background = "var(--state-hover-row)"; }}
                  onMouseLeave={(e) => { if (!selectedRow) e.currentTarget.style.background = "transparent"; }}
                >
                  {selectable ? (
                    <td style={{ ...tdStyle, paddingLeft: 24 }}>
                      <Checkbox checked={selectedRow} onChange={() => toggleRow(k)} />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td key={c.key} style={{ ...tdStyle, textAlign: c.align || "left" }}>
                      {c.render ? c.render(r[c.key], r) : <span style={{ fontSize: 14, color: "var(--text-body)" }}>{r[c.key]}</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
