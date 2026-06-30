"use client";

import { Input, Button, Icon, Checkbox } from "@/components/ui";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ minHeight: "100%", height: "100%", overflow: "hidden", fontFamily: "var(--font-sans)", background: "var(--surface-page)", display: "flex" }}>
      <div style={{ flex: 1, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-lg)", padding: "36px 36px 32px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wordmark.svg" alt="Atria" style={{ height: 44 }} />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 6px", textAlign: "center" }}>Bienvenida de nuevo. Accede a tu cuenta.</p>
            <h2 style={{ fontSize: 25, margin: "0 0 28px", textAlign: "center" }}>Inicia sesión</h2>
            <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Input label="Correo electrónico" type="email" placeholder="elena.ruiz@atria.edu" defaultValue="elena.ruiz@atria.edu" />
              <Input label="Contraseña" type="password" placeholder="••••••••" defaultValue="atria2025" iconRight={<Icon name="eye" size={18} color="var(--text-muted)" />} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Checkbox label="Recuérdame" defaultChecked />
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-link)" }}>¿Olvidaste tu contraseña?</a>
              </div>
              <Button variant="accent" type="submit" style={{ width: "100%" }}>Iniciar sesión</Button>
            </form>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            </div>
            <Button variant="outline" style={{ width: "100%" }} onClick={onLogin}>Acceder con cuenta del centro</Button>
          </div>
          <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-muted)", marginTop: 24 }}>¿No tienes cuenta? <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 700, color: "var(--text-link)" }}>Solicita acceso</a></p>
        </div>
      </div>
      <div className="atria-login-brand" style={{ width: 380, flexShrink: 0, background: "var(--primary-500)", position: "relative", overflow: "hidden" }}>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .atria-amark { transform-box: fill-box; transform-origin: center; animation: atriaBob 7s ease-in-out infinite; }
            @keyframes atriaBob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-16px) rotate(2.4deg); } }
            .atria-curve { animation: atriaShimmer 9s ease-in-out infinite; }
            @keyframes atriaShimmer { 0%,100% { opacity: var(--c0); } 50% { opacity: var(--c1); } }
            .atria-orb1 { transform-box: view-box; animation: atriaOrb1 13s ease-in-out infinite; }
            @keyframes atriaOrb1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-28px,24px); } }
            .atria-orb2 { transform-box: view-box; animation: atriaOrb2 15s ease-in-out infinite; }
            @keyframes atriaOrb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(22px,-26px) scale(1.08); } }
          }
        `}</style>
        <svg viewBox="0 0 380 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: "block" }}>
          <circle cx="300" cy="70" r="300" fill="#ffffff" opacity="0.045" className="atria-orb1" />
          <path d="M-50 80 C 120 230, 270 230, 440 100" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 14" strokeLinecap="round" opacity="0.4" className="atria-curve" style={{ ["--c0" as string]: 0.4, ["--c1" as string]: 0.18 } as React.CSSProperties} />
          <path d="M-50 830 C 120 690, 270 690, 440 820" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 14" strokeLinecap="round" opacity="0.32" className="atria-curve" style={{ ["--c0" as string]: 0.32, ["--c1" as string]: 0.14, animationDelay: "-5s" } as React.CSSProperties} />
          <circle cx="330" cy="840" r="180" fill="var(--primary-200)" opacity="0.28" className="atria-orb2" />
          <g transform="translate(10 250) scale(1.5)">
            <g className="atria-amark">
              <path d="M120,44.877l-70.083,148.411" fill="none" stroke="#FBF7EF" strokeWidth="28.86" strokeLinecap="round" />
              <path d="M120,44.877l70.083,148.411" fill="none" stroke="#FBF7EF" strokeWidth="28.86" strokeLinecap="round" />
              <path d="M82.897,141.756l74.206,0" fill="none" stroke="var(--yellow-500)" strokeWidth="24.74" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
