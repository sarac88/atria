"use client";

import { useState } from "react";
import { Page, PageHead, Panel, EmptyState } from "@/components/layout";
import { StudentTaskList } from "@/components/student/StudentTaskList";
import { ActivityDetailModal } from "@/components/modals/ActivityDetailModal";
import { useStudentTasks } from "@/lib/api/classwork";
import type { StudentTaskDto } from "@/lib/types";

export function StudentTasks() {
  const { data: tasks, isLoading } = useStudentTasks();
  const [detail, setDetail] = useState<StudentTaskDto | null>(null);

  const list = tasks ?? [];
  const pending = list.filter((t) => !t.mySubmission).length;
  const subtitle = isLoading ? "Cargando…" : pending === 1 ? "1 tarea pendiente" : `${pending} tareas pendientes`;

  return (
    <Page width={900}>
      <PageHead title="Tareas" subtitle={subtitle} />
      {list.length ? (
        <Panel pad={0}>
          <StudentTaskList tasks={list} onOpen={setDetail} />
        </Panel>
      ) : !isLoading ? (
        <EmptyState
          illo="empty-submissions"
          title="No tienes tareas"
          text="Cuando tus profesores publiquen actividades aparecerán aquí."
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
