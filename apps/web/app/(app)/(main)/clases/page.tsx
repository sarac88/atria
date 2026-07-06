"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { useClasses, useDeleteClass } from "@/lib/api/classes";
import { ClassList } from "@/components/screens/teacher/ClassList";
import { StudentCourses } from "@/components/screens/student/StudentCourses";
import { AdminClasses } from "@/components/screens/admin/AdminClasses";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import type { ClassInfo } from "@/lib/types";

export default function ClassesPage() {
  const router = useRouter();
  const { role } = useSettings();
  const { data: classes } = useClasses();
  const deleteClass = useDeleteClass();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassInfo | null>(null);

  const openClass = (c: ClassInfo) => router.push(`/clase/${c.id}`);
  const list = classes ?? [];

  return (
    <>
      {role === "docente" && (
        <ClassList
          classes={list}
          onOpenClass={openClass}
          onCreate={() => setCreateOpen(true)}
          onEdit={(c) => setEditClass(c)}
          onDelete={(c) => setDeleteTarget(c)}
        />
      )}
      {role === "alumno" && <StudentCourses classes={list} onOpenClass={openClass} />}
      {role === "admin" && <AdminClasses classes={list} onOpenClass={openClass} />}

      {createOpen && <CreateClassModal onClose={() => setCreateOpen(false)} onDone={(id) => { setCreateOpen(false); router.push(`/clase/${id}`); }} />}
      {editClass && <CreateClassModal klass={editClass} onClose={() => setEditClass(null)} onDone={() => setEditClass(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar clase"
          message={<>Vas a eliminar <strong>{deleteTarget.name}</strong> y todo su contenido (módulos, actividades, entregas y notas). Esta acción no se puede deshacer.</>}
          onConfirm={async () => {
            await deleteClass.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
