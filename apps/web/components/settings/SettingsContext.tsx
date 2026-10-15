"use client";

// App settings + session. Appearance (accent / density / dark / module layout)
// is local and persisted to localStorage. Authentication is real: the session
// user comes from GET /users/me (cookie-based), and `role` follows the logged-in
// user. Theming is applied via the `.atria-root` wrapper.

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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role, UserDto } from "@atria/types";
import { getMe, logout as apiLogout } from "@/lib/api/auth";

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

export interface Appearance {
  accent: string;
  density: Density;
  dark: boolean;
  modLayout: ModLayout;
}

const DEFAULTS: Appearance = {
  accent: "#F4B223",
  density: "compacto",
  dark: false,
  modLayout: "tarjeta",
};

const STORAGE_KEY = "atria.settings";
const DEFAULT_ROLE: Role = "docente";

interface SettingsContextValue extends Appearance {
  set: <K extends keyof Appearance>(key: K, value: Appearance[K]) => void;
  user: UserDto | null;
  role: Role;
  authed: boolean;
  authLoading: boolean;
  refreshSession: () => void;
  setSession: (user: UserDto) => void;
  logout: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [appearance, setAppearance] = useState<Appearance>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // ---- session ----
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const user = meQuery.data ?? null;
  const authed = !!user;
  const authLoading = meQuery.isLoading;

  const refreshSession = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["me"] });
  }, [qc]);

  /** Fija la sesión con el usuario que devuelve el login, sin esperar a /users/me. */
  const setSession = useCallback(
    (u: UserDto) => {
      qc.setQueryData(["me"], u);
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore network errors on logout */
    }
    // Fuera los datos del usuario anterior, para que el siguiente no los vea.
    qc.setQueryData(["me"], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
  }, [qc]);

  // ---- appearance persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAppearance((a) => ({ ...a, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
      } catch {
        /* ignore */
      }
    }
  }, [appearance, hydrated]);

  const set = useCallback(<K extends keyof Appearance>(key: K, value: Appearance[K]) => {
    setAppearance((a) => ({ ...a, [key]: value }));
  }, []);

  const role: Role = user?.role ?? DEFAULT_ROLE;

  const value = useMemo<SettingsContextValue>(
    () => ({ ...appearance, set, user, role, authed, authLoading, refreshSession, setSession, logout }),
    [appearance, set, user, role, authed, authLoading, refreshSession, setSession, logout],
  );

  const acc = ACCENTS[appearance.accent] ?? ACCENTS["#F4B223"];
  const d = DENSITY[appearance.density] ?? 1;
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
      <div className="atria-root" data-theme={appearance.dark ? "dark" : "light"} style={themeStyle}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
}
