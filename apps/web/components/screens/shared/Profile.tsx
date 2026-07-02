"use client";

import { useState } from "react";
import { Avatar, Input, Select, Switch, Button, Icon, HorizontalTabs, Badge } from "@/components/ui";
import { Page, PageHead, Panel } from "@/components/layout";
import { useSettings } from "@/components/settings/SettingsContext";
import type { Role } from "@/lib/types";

const ME: Record<Role, [string, string, string]> = {
  docente: ["Elena Ruiz", "Docente", "elena.ruiz@atria.edu"],
  alumno: ["Marc Soler", "Alumno", "marc.soler@atria.edu"],
  admin: ["Dirección", "Administración", "direccion@atria.edu"],
};

const notifs: [string, string, boolean][] = [
  ["Nuevas entregas", "Recibe un aviso cuando un alumno entrega una tarea.", true],
  ["Mensajes directos", "Notificaciones de nuevos mensajes.", true],
  ["Resumen semanal", "Un correo cada lunes con la actividad de tus clases.", false],
  ["Recordatorios de plazos", "Avisos 24 h antes de cada vencimiento.", true],
];

export function Profile() {
  const { role } = useSettings();
  const [tab, setTab] = useState("perfil");
  const me = ME[role] || ME.docente;
  return (
    <Page width={900}>
      <PageHead title="Perfil y ajustes" subtitle="Gestiona tu cuenta y preferencias" />
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 24px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", marginBottom: 22 }}>
        <Avatar name={me[0]} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: 22, margin: 0 }}>{me[0]}</h3>
            <Badge color="info">{me[1]}</Badge>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>{me[2]}</div>
        </div>
        <Button variant="outline" iconLeft={<Icon name="pencil" size={16} />}>Editar foto</Button>
      </div>
      <div style={{ marginBottom: 22 }}>
        <HorizontalTabs value={tab} onChange={setTab} tabs={[{ label: "Perfil", value: "perfil" }, { label: "Notificaciones", value: "notif" }, { label: "Seguridad", value: "seg" }]} />
      </div>
      {tab === "perfil" ? (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Input label="Nombre" defaultValue={me[0].split(" ")[0]} />
            <Input label="Apellidos" defaultValue={me[0].split(" ").slice(1).join(" ")} />
            <Input label="Correo electrónico" defaultValue={me[2]} />
            <Input label="Teléfono" placeholder="+34 600 000 000" />
            <Select label="Idioma" defaultValue="es" options={[{ label: "Español (España)", value: "es" }, { label: "English", value: "en" }, { label: "Català", value: "ca" }]} />
            <Select label="Zona horaria" defaultValue="mad" options={[{ label: "Madrid (GMT+1)", value: "mad" }, { label: "Canarias (GMT)", value: "can" }]} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <Button variant="outline">Cancelar</Button>
            <Button variant="accent">Guardar cambios</Button>
          </div>
        </Panel>
      ) : tab === "notif" ? (
        <Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {notifs.map(([t, d, on], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ paddingRight: 20 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{d}</div>
                </div>
                <Switch defaultChecked={on} />
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 420 }}>
            <Input label="Contraseña actual" type="password" placeholder="••••••••" />
            <Input label="Nueva contraseña" type="password" placeholder="••••••••" helper="Mínimo 8 caracteres, una mayúscula y un número." />
            <Input label="Repetir contraseña" type="password" placeholder="••••••••" />
            <Button variant="accent" style={{ alignSelf: "flex-start" }}>Actualizar contraseña</Button>
          </div>
        </Panel>
      )}
    </Page>
  );
}
