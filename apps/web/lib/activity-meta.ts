// Icon + accent color for each activity type label (as returned by the API DTO).

export const ACTIVITY_TYPE_META: Record<string, [string, string]> = {
  Tarea: ["document-text", "var(--success-500)"],
  Cuestionario: ["clipboard-check", "var(--info-500)"],
  Proyecto: ["folder", "var(--warning-500)"],
  Ensayo: ["document-text", "var(--primary-500)"],
  Debate: ["chat", "var(--primary-500)"],
};

export function activityTypeMeta(type: string): [string, string] {
  return ACTIVITY_TYPE_META[type] || ["document-text", "var(--primary-500)"];
}
