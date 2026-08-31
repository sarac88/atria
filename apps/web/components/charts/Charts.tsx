import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { Tooltip } from "@/components/ui/Tooltip";

export interface BarDatum {
  label: string;
  value: number;
  /** Texto completo, visible al pasar el cursor por el icono de info junto a la etiqueta. */
  hint?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  accent?: string;
  highlightLast?: boolean;
  /** Ancho mínimo de cada columna: si no caben todas, el gráfico hace scroll horizontal. */
  minBarWidth?: number;
}

/** Vertical bar chart. */
export function BarChart({ data, height = 150, color = "var(--brand-primary)", accent = "var(--brand-accent)", highlightLast = true, minBarWidth }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={minBarWidth ? { overflowX: "auto", paddingBottom: 6 } : undefined}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height, paddingTop: 8, minWidth: "100%" }}>
        {data.map((d, i) => {
          const bar = (
            <div
              title={d.hint ? undefined : d.label}
              style={{
                width: "100%",
                maxWidth: 44,
                height: (d.value / max) * (height - 44) + "px",
                minHeight: 4,
                borderRadius: "6px 6px 0 0",
                background: highlightLast && i === data.length - 1 ? accent : color,
                transition: "height .5s ease",
              }}
            />
          );
          return (
            <div key={i} style={{ flex: minBarWidth ? `1 0 ${minBarWidth}px` : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>{d.value}</div>
              {d.hint ? (
                <Tooltip text={d.hint} focusable={false} style={{ width: "100%", maxWidth: 44, justifyContent: "center", cursor: "help" }}>
                  {bar}
                </Tooltip>
              ) : (
                bar
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                <span>{d.label}</span>
                {d.hint ? (
                  <Tooltip text={d.hint} style={{ cursor: "help" }}>
                    <span aria-label={d.hint} style={{ display: "inline-flex" }}>
                      <Icon name="information-circle" size={13} />
                    </span>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface DonutProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sub?: ReactNode;
}

/** Donut ring with centered label. */
export function Donut({ value, size = 132, stroke = 14, color = "var(--brand-primary)", label, sub }: DonutProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1 }}>{label != null ? label : Math.round(value * 100) + "%"}</span>
        {sub ? <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{sub}</span> : null}
      </div>
    </div>
  );
}
