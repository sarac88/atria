import type { Activity, Module } from "@/lib/types";

export const NONE_UNIT = "__none__";

/** Real units + a virtual "Sin unidad" bucket when there are unassigned activities. */
export function buildUnits(modules: Module[], activities: Activity[]): { units: Module[]; actsOf: (id: string) => Activity[] } {
  const unassigned = activities.filter((a) => !a.moduleId);
  const units = unassigned.length
    ? [...modules, { id: NONE_UNIT, title: "Sin unidad", description: "", done: false, items: [], sessions: [] }]
    : modules;
  const actsOf = (id: string) => (id === NONE_UNIT ? unassigned : activities.filter((a) => a.moduleId === id));
  return { units, actsOf };
}
