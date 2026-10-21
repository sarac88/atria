"use client";

import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useSettings } from "@/components/settings/SettingsContext";

// Aviso de demo: sale una vez por sesión del navegador y cuenta, así que al
// cambiar de profesor a estudiante vuelve a aparecer con el perfil nuevo.
const storageKey = (userId: string) => `atria-demo-notice:${userId}`;

const ROLE_LABEL: Record<string, string> = { docente: "docente", alumno: "estudiante", admin: "administración" };

const POINTS: { icon: string; text: string }[] = [
  { icon: "academic-cap", text: "Atria es un proyecto de portfolio: los cursos, el alumnado y las entregas son ficticios." },
  { icon: "users", text: "La cuenta es compartida. Puedes crear, editar y entregar lo que quieras, pero otros visitantes verán tus cambios." },
  { icon: "clock", text: "Los datos se restablecen cada noche, así que todo vuelve a su estado inicial." },
  { icon: "information-circle", text: "No subas datos personales ni archivos privados." },
];

export function DemoNotice() {
  const { user } = useSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      setOpen(!sessionStorage.getItem(storageKey(user.id)));
    } catch {
      setOpen(true);
    }
  }, [user]);

  if (!open || !user) return null;

  const close = () => {
    try {
      sessionStorage.setItem(storageKey(user.id), "1");
    } catch {
      // Sin almacenamiento el aviso volverá a salir al recargar; no pasa nada.
    }
    setOpen(false);
  };

  return (
    <Modal title="Estás en la demo de Atria" onClose={close} width={500} footer={<Button variant="primary" onClick={close}>Entendido, empezar</Button>}>
      <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "0 0 18px", color: "var(--text-body)" }}>
        Has entrado como <strong>{user.name}</strong>, perfil de {ROLE_LABEL[user.role] ?? user.role}.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {POINTS.map((p) => (
          <li key={p.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5, color: "var(--text-body)" }}>
            <Icon name={p.icon} size={20} color="var(--brand-primary)" style={{ marginTop: 1 }} />
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
