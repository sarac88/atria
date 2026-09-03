"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { useSettings } from "@/components/settings/SettingsContext";
import { resourceUrl } from "@/lib/api/client";
import { displayName } from "@/lib/session";

export function AccountMenu({
  tone = "light",
  onProfile,
  onLogout,
}: {
  tone?: "light" | "onDark";
  onProfile?: () => void;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const { user, logout } = useSettings();
  const name = displayName(user);
  const avatar = user?.avatarUrl ? resourceUrl(user.avatarUrl) : undefined;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const onDark = tone === "onDark";

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const goProfile = () => {
    setOpen(false);
    if (onProfile) onProfile();
    else router.push("/perfil");
  };

  const goLogout = () => {
    setOpen(false);
    if (onLogout) onLogout();
    else {
      logout();
      router.push("/login");
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name ? `Cuenta de ${name}` : "Cuenta"}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          maxWidth: 220,
          padding: onDark ? "4px 8px 4px 4px" : "4px 6px 4px 4px",
          border: "none",
          borderRadius: "var(--radius-pill)",
          background: open ? (onDark ? "rgba(255,255,255,0.12)" : "var(--state-hover-tint)") : "transparent",
          color: onDark ? "#fff" : "var(--text-strong)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = onDark ? "rgba(255,255,255,0.10)" : "var(--state-hover-tint)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <Avatar name={name} src={avatar} />
        {name ? (
          <span
            className="atria-account-name"
            style={{
              fontSize: 14,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {name}
          </span>
        ) : null}
        <Icon
          name="chevron-down"
          size={16}
          color={onDark ? "rgba(255,255,255,0.75)" : "var(--text-muted)"}
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popRef}
              role="menu"
              style={{
                position: "fixed",
                top: pos.top,
                right: pos.right,
                zIndex: 200,
                minWidth: 200,
                background: "var(--surface-card)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--border-subtle)",
                padding: 6,
                display: "grid",
                gap: 3,
              }}
            >
              <MenuItem icon="user" label="Mi perfil" onClick={goProfile} />
              <MenuItem icon="logout" label="Cerrar sesión" onClick={goLogout} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        border: "none",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-strong)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={16} color="var(--text-muted)" />
      {label}
    </button>
  );
}
