"use client";

// Real settings layer that replaces the design export's dev-only TweaksPanel.
// Holds role / accent / density / dark + a mock auth flag, persists to
// localStorage, and applies the accent + density + dark theming via the
// `.atria-root` wrapper (same CSS-variable overrides the prototype used).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Role } from "@/lib/types";

export interface AccentDef {
  accent: string;
  on: string;
  soft: string;
  strong: string;
}

export const ACCENTS: Record<string, AccentDef> = {
  "#F4B223": { accent: "#F4B223", on: "#16244A", soft: "#FCE9BE", strong: "#8A6410" },
  "#F0653E": { accent: "#F0653E", on: "#ffffff", soft: "#FBD9CE", strong: "#8F2E15" },
  "#1F8A5B": { accent: "#1F8A5B", on: "#ffffff", soft: "#C9E6D8", strong: "#0E4730" },
  "#6C5CE7": { accent: "#6C5CE7", on: "#ffffff", soft: "#DCD7F8", strong: "#322577" },
};

export type Density = "compacto" | "cómodo" | "amplio";
export const DENSITY: Record<Density, number> = { compacto: 0.74, cómodo: 1, amplio: 1.3 };

export type ModLayout = "tarjeta" | "plano" | "acordeon";

export interface Settings {
  role: Role;
  accent: string;
  density: Density;
  dark: boolean;
  modLayout: ModLayout;
}

const DEFAULTS: Settings = {
  role: "docente",
  accent: "#F4B223",
  density: "compacto",
  dark: false,
  modLayout: "tarjeta",
};

const STORAGE_KEY = "atria.settings";

interface SettingsContextValue extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  authed: boolean;
  login: () => void;
  logout: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted settings on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        /* ignore */
      }
    }
  }, [settings, hydrated]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const login = useCallback(() => setAuthed(true), []);
  const logout = useCallback(() => setAuthed(false), []);

  const value = useMemo<SettingsContextValue>(
    () => ({ ...settings, set, authed, login, logout }),
    [settings, set, authed, login, logout],
  );

  const acc = ACCENTS[settings.accent] ?? ACCENTS["#F4B223"];
  const d = DENSITY[settings.density] ?? 1;
  const themeStyle = {
    "--brand-accent": acc.accent,
    "--yellow-500": acc.accent,
    "--yellow-200": acc.soft,
    "--yellow-700": acc.strong,
    "--text-on-accent": acc.on,
    "--status-new": acc.accent,
    "--d": d,
  } as CSSProperties;

  return (
    <SettingsContext.Provider value={value}>
      <div className="atria-root" data-theme={settings.dark ? "dark" : "light"} style={themeStyle}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
}
