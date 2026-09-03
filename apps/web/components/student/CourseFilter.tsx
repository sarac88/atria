"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassFilter } from "@/components/classes/ClassFilter";
import { useClasses } from "@/lib/api/classes";
import type { ClassInfo } from "@/lib/types";

/** Dropdown de curso para las vistas globales del alumno (Tareas, Mis notas). */
export function CourseFilter({
  classes,
  value,
  onChange,
}: {
  classes: ClassInfo[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (classes.length < 2) return null;
  return <ClassFilter classes={classes} value={value} onChange={onChange} label="Curso" />;
}

/** Recuerda el curso activo y cae al primero cuando la lista cambia. */
export function useSelectedClass() {
  const { data: classes, isLoading } = useClasses();
  const list = useMemo(() => classes ?? [], [classes]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    if (!list.length) {
      if (classId) setClassId("");
      return;
    }
    if (!list.some((c) => c.id === classId)) setClassId(list[0].id);
  }, [list, classId]);

  return {
    classId,
    setClassId,
    classes: list,
    current: list.find((c) => c.id === classId),
    isLoading,
  };
}
