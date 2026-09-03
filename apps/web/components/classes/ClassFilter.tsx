"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { ClassThumb } from "@/components/classes/ClassThumb";
import type { ClassInfo } from "@/lib/types";

export function ClassFilter({
  classes,
  value,
  onChange,
  label = "Clase",
}: {
  classes: ClassInfo[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const current = classes.find((c) => c.id === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 248, maxWidth: 340 }}>
      <button
        id={btnId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current ? `${label}: ${current.name}` : label}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "8px 10px 8px 8px",
          textAlign: "left",
          cursor: "pointer",
          background: "var(--surface-card)",
          border: "none",
          borderRadius: "var(--radius-xl)",
          boxShadow: open
            ? "inset 0 0 0 1.5px var(--border-focus), var(--shadow-lg)"
            : "inset 0 0 0 1.5px var(--primary-200), var(--shadow-md)",
          fontFamily: "var(--font-sans)",
          transition: "box-shadow .15s ease",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px var(--primary-300), var(--shadow-lg)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px var(--primary-200), var(--shadow-md)";
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--primary-100)",
            display: "inline-flex",
          }}
        >
          {current ? (
            <ClassThumb thumb={current.thumb} color={current.color} icon={current.icon} name={current.name} iconSize={22} />
          ) : (
            <span style={{ width: "100%", height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--primary-600)" }}>
              <Icon name="academic-cap" size={20} />
            </span>
          )}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--brand-primary)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-strong)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            {current?.name ?? "Seleccionar"}
          </span>
        </span>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-md)",
            background: "var(--primary-100)",
            color: "var(--primary-600)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon
            name="chevron-down"
            size={16}
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}
          />
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-labelledby={btnId}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            minWidth: "100%",
            width: "max-content",
            maxWidth: 420,
            zIndex: 30,
            display: "grid",
            gap: 3,
            background: "var(--surface-card)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xl)",
            padding: 6,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {classes.map((c) => {
            const active = c.id === value;
            return (
              <div
                key={c.id}
                role="option"
                aria-selected={active}
                onClick={() => pick(c.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = active ? "var(--primary-100)" : "transparent")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  background: active ? "var(--primary-100)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "inline-flex",
                  }}
                >
                  <ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={16} />
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-strong)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </span>
                {active ? <Icon name="check" size={16} color="var(--brand-primary)" /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
