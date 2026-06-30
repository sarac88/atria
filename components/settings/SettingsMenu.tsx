"use client";

// Real settings control that replaces the design export's floating dev
// "TweaksPanel": role (demo), accent, density, dark mode, module layout.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Switch } from "@/components/ui";
import { ACCENTS, DENSITY, useSettings, type Density, type ModLayout } from "./SettingsContext";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["docente", "alumno", "admin"];
const DENSITIES = Object.keys(DENSITY) as Density[];
const MOD_LAYOUTS: { value: ModLayout; label: string }[] = [
  { value: "tarjeta", label: "En tarjeta" },
  { value: "plano", label: "Sin tarjeta" },
  { value: "acordeon", label: "Acordeón" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-muted)", margin: "14px 0 8px" }}>{children}</div>;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", padding: "7px 6px", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: on ? 700 : 600, textTransform: "capitalize", background: on ? "var(--surface-card)" : "transparent", color: on ? "var(--text-strong)" : "var(--text-muted)", boxShadow: on ? "var(--shadow-sm)" : "none" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsMenu() {
  const router = useRouter();
  const { role, accent, density, dark, modLayout, set } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const changeRole = (r: Role) => {
    set("role", r);
    setOpen(false);
    router.push("/"); // mirror the prototype: role switch returns to Inicio
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        aria-label="Ajustes de la interfaz"
        title="Ajustes"
        onClick={() => setOpen((v) => !v)}
        style={{ border: "none", background: "var(--surface-page)", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)" }}
      >
        <Icon name="cog" size={20} />
      </button>
      {open ? (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 70, width: 280, background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", padding: "12px 16px 18px", border: "1px solid var(--border-subtle)" }}>
          <SectionLabel>Vista como (demo)</SectionLabel>
          <Segmented value={role} options={ROLES.map((r) => ({ value: r, label: r }))} onChange={changeRole} />

          <SectionLabel>Color de acento</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            {Object.keys(ACCENTS).map((hex) => (
              <button
                key={hex}
                aria-label={hex}
                onClick={() => set("accent", hex)}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer", background: hex, boxShadow: accent === hex ? "0 0 0 2px var(--surface-card), 0 0 0 4px var(--brand-primary)" : "inset 0 0 0 1px rgba(0,0,0,.08)" }}
              />
            ))}
          </div>

          <SectionLabel>Densidad</SectionLabel>
          <Segmented value={density} options={DENSITIES.map((d) => ({ value: d, label: d }))} onChange={(d) => set("density", d)} />

          <SectionLabel>Diseño de módulos</SectionLabel>
          <Segmented value={modLayout} options={MOD_LAYOUTS} onChange={(m) => set("modLayout", m)} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Modo oscuro</span>
            <Switch checked={dark} onChange={(v) => set("dark", v)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
