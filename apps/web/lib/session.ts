// Identidad del usuario de la sesión (SettingsContext.user ← GET /users/me).
// Centraliza las etiquetas de rol y el nombre a mostrar para que ninguna
// pantalla vuelva a llevar un perfil de ejemplo escrito a mano.

import type { Role, UserDto } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  docente: "Docente",
  alumno: "Alumno",
  admin: "Administración",
};

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role] ?? ROLE_LABEL.docente;
}

/** Nombre del usuario de la sesión; cadena vacía mientras /users/me está en vuelo. */
export function displayName(user: UserDto | null): string {
  return user?.name?.trim() ?? "";
}

/** Primer nombre, para saludos ("Hola, Marc"). */
export function firstName(user: UserDto | null): string {
  return displayName(user).split(/\s+/)[0] ?? "";
}

/** Apellidos, para el formulario de perfil. */
export function lastName(user: UserDto | null): string {
  return displayName(user).split(/\s+/).slice(1).join(" ");
}
