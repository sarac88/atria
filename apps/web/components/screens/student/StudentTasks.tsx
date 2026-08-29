"use client";

import { useMemo, useState } from "react";
import { Page, PageHead, Panel, EmptyState } from "@/components/layout";
import { CourseFilter, useSelectedClass } from "@/components/student/CourseFilter";
import { StudentTaskList } from "@/components/student/StudentTaskList";
import { ActivityDetailModal } from "@/components/modals/ActivityDetailModal";
import { useStudentTasks } from "@/lib/api/classwork";
import { PAGE_SIZE } from "@/lib/pagination";
import type { StudentTaskDto } from "@/lib/types";

export function StudentTasks() {
  const { data: tasks, isLoading: tasksLoading } = useStudentTasks();
  const { classId, setClassId, classes, current, isLoading: classesLoading } = useSelectedClass();
  const [detail, setDetail] = useState<StudentTaskDto | null>(null);

  const isLoading = tasksLoading || classesLoading;
  const scoped = useMemo(() => (classId ? (tasks ?? []).filter((t) => t.classId === classId) : []), [tasks, classId]);
  const pending = scoped.filter((t) => !t.mySubmission).length;
  const subtitle = isLoading
    ? "Cargando…"
    : current
      ? pending === 1
        ? `${current.name} · 1 tarea pendiente`
        : `${current.name} · ${pending} tareas pendientes`
      : pending === 1
        ? "1 tarea pendiente"
        : `${pending} tareas pendientes`;

  return (
    <Page width={900}>
      <PageHead
        title="Tareas"
        subtitle={subtitle}
        actions={<CourseFilter classes={classes} value={classId} onChange={setClassId} />}
      />
      {scoped.length ? (
        <Panel pad={0}>
          <StudentTaskList key={classId} tasks={scoped} onOpen={setDetail} showClass={false} pageSize={PAGE_SIZE} />
        </Panel>
      ) : !isLoading ? (
        <EmptyState
          illo="empty-submissions"
          title={classes.length ? "No hay tareas en este curso" : "No tienes tareas"}
          text={
            classes.length
              ? "Cuando tu profesorado publique actividades en este curso aparecerán aquí."
              : "Cuando tus profesores publiquen actividades aparecerán aquí."
          }
        />
      ) : null}

      {detail ? (
        <ActivityDetailModal
          activity={detail}
          role="alumno"
          classId={detail.classId}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </Page>
  );
}
