"use client";

import { useRef, useState } from "react";
import { Input, Button, Icon, Checkbox } from "@/components/ui";

// Cuentas del seed (apps/api/prisma/seed.ts) para entrar en modo demo.
const DEMO_ACCOUNTS = {
  docente: { email: "elena.ruiz@atria.edu", password: "atria2025" },
  alumno: { email: "marc.soler@atria.edu", password: "atria2025" },
};

type Mode = "choose" | "demo" | "login";

export function LoginScreen({
  onLogin,
  error,
  pending,
}: {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
  pending?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onLogin(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  };
  return (
    <div style={{ minHeight: "100%", height: "100%", overflow: "hidden", fontFamily: "var(--font-sans)", background: "var(--surface-card)", display: "flex" }}>
      <div className="atria-login-brand" style={{ flex: "1.4 1 0", minWidth: 0, background: "var(--primary-500)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", padding: "56px 64px 44px", boxSizing: "border-box", color: "#fff" }}>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .atria-login-patio { animation: atriaPatioBob 4s ease-in-out infinite; }
            @keyframes atriaPatioBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          }
        `}</style>
        {/* Patio de fondo, recortado por la esquina inferior derecha */}
        <svg className="atria-login-patio" viewBox="18 30.5 64 59.5" aria-hidden style={{ position: "absolute", right: -40, bottom: -150, width: 620, height: "auto", pointerEvents: "none" }}>
          {/* La opacidad va en el grupo para que el cruce del marco y la barra no se sume */}
          <g opacity="0.1">
            <rect x="23" y="35.5" width="49" height="49" rx="16" fill="none" stroke="#ffffff" strokeWidth="10" />
            <path d="M77 30.5V90" fill="none" stroke="#ffffff" strokeWidth="10" />
          </g>
          <rect x="39.5" y="52" width="16" height="16" rx="2" fill="var(--yellow-500)" fillOpacity="0.12" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmarkLight.svg" alt="Atria" style={{ height: 34, alignSelf: "flex-start", position: "relative" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", maxWidth: 560 }}>
          <h1 style={{ fontSize: 52, lineHeight: 1.12, fontWeight: 700, margin: "0 0 22px", color: "#fff" }}>Enseña, gestiona y conecta en un solo lugar.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, margin: 0, color: "rgba(255,255,255,.78)" }}>Crea clases, organiza actividades y sigue el progreso de cada alumno desde un panel claro y sencillo.</p>
        </div>
        <p style={{ fontSize: 13.5, margin: 0, color: "rgba(255,255,255,.6)", position: "relative" }}>© {new Date().getFullYear()} Atria LMS</p>
      </div>
      <div style={{ flex: "1 1 0", minWidth: 0, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box", background: "var(--surface-card)" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.svg" alt="Atria" style={{ width: 64, height: 64, display: "block", margin: "0 0 28px -8px" }} />
          {mode === "choose" ? (
            <>
              <h2 style={{ fontSize: 30, margin: "0 0 8px" }}>Bienvenida a Atria</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14.5, margin: "0 0 30px" }}>Explora la plataforma con datos de ejemplo o accede con tu cuenta.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Button variant="primary" iconLeft={<Icon name="play" size={18} />} style={{ width: "100%" }} onClick={() => setMode("demo")}>Probar demo</Button>
                <Button variant="outline" style={{ width: "100%", display:"none" }} onClick={() => setMode("login")}>Iniciar sesión</Button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setMode("choose")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: 0, padding: 0, margin: "0 0 18px", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text-link)", fontFamily: "inherit" }}>
              <Icon name="arrow-left" size={16} /> Volver
            </button>
          )}
          {mode === "demo" ? (
            <>
              <h2 style={{ fontSize: 30, margin: "0 0 8px" }}>Probar demo</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14.5, margin: "0 0 30px" }}>Elige con qué perfil quieres explorar Atria.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Button variant="primary" iconLeft={<Icon name="academic-cap" size={18} />} disabled={pending} style={{ width: "100%" }} onClick={() => onLogin(DEMO_ACCOUNTS.docente.email, DEMO_ACCOUNTS.docente.password)}>Entra como profesor</Button>
                <Button variant="outline" iconLeft={<Icon name="user" size={18} />} disabled={pending} style={{ width: "100%" }} onClick={() => onLogin(DEMO_ACCOUNTS.alumno.email, DEMO_ACCOUNTS.alumno.password)}>Entra como estudiante</Button>
              </div>
              {error ? <div style={{ marginTop: 18, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
              {pending ? <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-muted)", marginTop: 18 }}>Entrando…</p> : null}
            </>
          ) : null}
          {mode === "login" ? (
            <>
              <h2 style={{ fontSize: 30, margin: "0 0 8px" }}>Inicia sesión</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14.5, margin: "0 0 30px" }}>Bienvenida de nuevo. Accede a tu cuenta.</p>
              <form ref={formRef} onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Input label="Correo electrónico" name="email" type="email" placeholder="elena.ruiz@atria.edu" defaultValue="elena.ruiz@atria.edu" />
                <Input label="Contraseña" name="password" type="password" placeholder="••••••••" defaultValue="atria2025" iconRight={<Icon name="eye" size={18} color="var(--text-muted)" />} />
                {error ? <div style={{ fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Checkbox label="Recuérdame" defaultChecked />
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-link)" }}>¿Olvidaste tu contraseña?</a>
                </div>
                <Button variant="primary" type="submit" disabled={pending} style={{ width: "100%" }}>{pending ? "Entrando…" : "Iniciar sesión"}</Button>
              </form>
              <Button variant="outline" style={{ width: "100%", marginTop: 14 }} onClick={() => formRef.current?.requestSubmit()}>Acceder con cuenta del centro</Button>
              <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-muted)", marginTop: 28 }}>¿No tienes cuenta? <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 700, color: "var(--text-link)" }}>Solicita acceso</a></p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
