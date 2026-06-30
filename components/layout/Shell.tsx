"use client";

// Atria app shell: role-aware navy sidebar + topbar, responsive.
// Adapted from the design export to use Next.js routing + the SettingsContext.

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon, Avatar } from "@/components/ui";
import { useSettings } from "@/components/settings/SettingsContext";
import { SettingsMenu } from "@/components/settings/SettingsMenu";
import type { Role } from "@/lib/types";

interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const NAV: Record<Role, NavItem[]> = {
  docente: [
    { key: "inicio", label: "Inicio", icon: "home", path: "/" },
    { key: "clases", label: "Mis clases", icon: "academic-cap", path: "/clases" },
    { key: "gradebook", label: "Calificaciones", icon: "clipboard-check", path: "/calificaciones" },
    { key: "analiticas", label: "Progreso", icon: "grid", path: "/progreso" },
    { key: "calendario", label: "Calendario", icon: "calendar", path: "/calendario" },
    { key: "mensajes", label: "Mensajes", icon: "chat", path: "/mensajes" },
  ],
  alumno: [
    { key: "inicio", label: "Inicio", icon: "home", path: "/" },
    { key: "clases", label: "Mis cursos", icon: "academic-cap", path: "/clases" },
    { key: "tareas", label: "Tareas", icon: "clipboard-check", path: "/tareas" },
    { key: "notas", label: "Mis notas", icon: "star", path: "/notas" },
    { key: "calendario", label: "Calendario", icon: "calendar", path: "/calendario" },
    { key: "mensajes", label: "Mensajes", icon: "chat", path: "/mensajes" },
  ],
  admin: [
    { key: "inicio", label: "Panel", icon: "grid", path: "/" },
    { key: "usuarios", label: "Usuarios", icon: "users", path: "/usuarios" },
    { key: "clases", label: "Clases", icon: "academic-cap", path: "/clases" },
    { key: "calendario", label: "Calendario", icon: "calendar", path: "/calendario" },
    { key: "mensajes", label: "Mensajes", icon: "chat", path: "/mensajes" },
  ],
};

export const PROFILE: Record<Role, { name: string; role: string; greeting: string }> = {
  docente: { name: "Elena Ruiz", role: "Docente", greeting: "Prof. Elena Ruiz" },
  alumno: { name: "Marc Soler", role: "Alumno", greeting: "Marc Soler" },
  admin: { name: "Dirección", role: "Administración", greeting: "Centro Atria" },
};

/** Returns active nav key + page title for a path, given the role. */
function resolveActive(pathname: string, role: Role): { active: string; title: string } {
  const nav = NAV[role];
  if (pathname === "/perfil") return { active: "perfil", title: "Perfil" };
  // longest path match (so /clases/x maps to clases)
  let best: NavItem | undefined;
  for (const n of nav) {
    if (n.path === "/" ? pathname === "/" : pathname.startsWith(n.path)) {
      if (!best || n.path.length > best.path.length) best = n;
    }
  }
  return { active: best?.key ?? "inicio", title: best?.label ?? "Atria" };
}

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, logout } = useSettings();
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("atria-sidebar-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("atria-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  const mini = collapsed && !open;
  const nav = NAV[role] || NAV.docente;
  const me = PROFILE[role] || PROFILE.docente;
  const { active, title } = resolveActive(pathname, role);

  const navTo = (path: string) => {
    router.push(path);
    setOpen(false);
  };
  const onLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--surface-page)", fontFamily: "var(--font-sans)", position: "relative" }}>
      <aside
        className="atria-sidebar"
        data-open={open ? "1" : "0"}
        style={{ width: mini ? 76 : 248, flexShrink: 0, background: "var(--primary-500)", color: "#fff", display: "flex", flexDirection: "column", padding: mini ? "22px 12px" : "22px 16px", transition: "width .2s ease, padding .2s ease" }}
      >
        {mini ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 4px 24px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/markLight.svg" alt="Atria" style={{ width: 34, height: 34 }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, padding: "4px 8px 24px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmarkLight.svg" alt="Atria" style={{ height: 45 }} />
          </div>
        )}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {nav.map((n) => {
            const on = n.key === active;
            return (
              <button
                key={n.key}
                onClick={() => navTo(n.path)}
                title={mini ? n.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: mini ? "11px 0" : "11px 14px",
                  justifyContent: mini ? "center" : "flex-start",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  textAlign: "left",
                  background: on ? "rgba(255,255,255,0.10)" : "transparent",
                  color: on ? "#fff" : "rgba(255,255,255,0.72)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: on ? 700 : 500,
                  position: "relative",
                  transition: "background .15s ease",
                  width: "100%",
                }}
                onMouseEnter={(ev) => { if (!on) ev.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(ev) => { if (!on) ev.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ display: "inline-flex", flexShrink: 0, color: on ? "var(--brand-accent)" : "inherit", transition: "color .15s ease" }}>
                  <Icon name={n.icon} size={20} />
                </span>
                {mini ? null : n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: mini ? "center" : "flex-start", gap: 10, padding: "12px 4px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <Avatar name={me.greeting} size="sm" />
          {mini ? null : (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{me.role}</div>
            </div>
          )}
          {mini ? null : (
            <button onClick={onLogout} aria-label="Salir" style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "inline-flex" }}>
              <Icon name="logout" size={18} />
            </button>
          )}
        </div>
      </aside>

      {open ? <div onClick={() => setOpen(false)} className="atria-scrim" style={{ position: "fixed", inset: 0, background: "rgba(11,18,38,.45)", zIndex: 40 }} /> : null}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: 68, flexShrink: 0, background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 14, padding: "0 clamp(14px, 2.5vw, 28px)" }}>
          <button className="atria-burger" onClick={() => setOpen(true)} aria-label="Menú" style={{ display: "none", border: "none", background: "var(--surface-page)", width: 40, height: 40, borderRadius: "var(--radius-md)", cursor: "pointer", alignItems: "center", justifyContent: "center", color: "var(--text-strong)" }}>
            <Icon name="grid" size={20} />
          </button>
          <span className="atria-collapse-wrap">
            <button
              onClick={toggleCollapsed}
              className="atria-collapse-btn"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
              title={collapsed ? "Expandir menú" : "Contraer menú"}
              style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-strong)", width: 38, height: 38, borderRadius: "var(--radius-md)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s ease" }}
              onMouseEnter={(ev) => { ev.currentTarget.style.background = "var(--state-hover-tint)"; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.background = "var(--surface-sunken)"; }}
            >
              <span style={{ display: "inline-flex", transform: mini ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>
                <Icon name="arrow-left" size={18} />
              </span>
            </button>
          </span>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="atria-search" style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", background: "var(--surface-page)", borderRadius: "var(--radius-pill)", width: 220 }}>
              <Icon name="search" size={18} color="var(--text-muted)" />
              <input placeholder="Buscar…" style={{ border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", width: "100%" }} />
            </div>
            <SettingsMenu />
            <button aria-label="Notificaciones" style={{ position: "relative", border: "none", background: "var(--surface-page)", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={20} color="var(--text-strong)" />
              <span style={{ position: "absolute", top: 6, right: 7, minWidth: 8, height: 8, borderRadius: "50%", background: "var(--status-error)", border: "2px solid var(--surface-page)" }} />
            </button>
            <button onClick={() => router.push("/perfil")} aria-label="Perfil" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "inline-flex", borderRadius: "50%" }}>
              <Avatar name={me.greeting} />
            </button>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "auto", padding: "clamp(16px, 2.5vw, 28px)" }}>{children}</main>
      </div>
    </div>
  );
}
