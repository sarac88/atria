"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { useClass, useDeleteClass } from "@/lib/api/classes";
import { ClassDetail } from "@/components/screens/teacher/ClassDetail";
import { StudentClass } from "@/components/screens/student/StudentClass";
import { CreateActivityModal } from "@/components/modals/CreateActivityModal";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import type { ClassInfo } from "@/lib/types";

export default function ClassDetailPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "var(--surface-page)" }} />}>
      <ClassDetailPageInner />
    </Suspense>
  );
}

function ClassDetailPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? undefined;
  const initialActivityId = searchParams.get("activity") ?? undefined;
  const { role, logout } = useSettings();
  const { data: klass, isLoading } = useClass(params.id);
  const deleteClass = useDeleteClass();
  const [activityOpen, setActivityOpen] = useState<ClassInfo | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onBack = () => router.push("/clases");
  const onProfile = () => router.push("/perfil");
  const onLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading || !klass) {
    return <div style={{ height: "100vh", background: "var(--surface-page)" }} />;
  }

  return (
    <div style={{ height: "100vh" }}>
      {role === "alumno" ? (
        <StudentClass klass={klass} onBack={onBack} onProfile={onProfile} onLogout={onLogout} />
      ) : (
        <ClassDetail
          klass={klass}
          initialTab={initialTab}
          initialActivityId={initialActivityId}
          onBack={onBack}
          onProfile={onProfile}
          onLogout={onLogout}
          onNewActivity={(c) => setActivityOpen(c)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      )}
      {activityOpen && <CreateActivityModal klass={activityOpen} onClose={() => setActivityOpen(null)} onDone={() => setActivityOpen(null)} />}
      {editOpen && <CreateClassModal klass={klass} onClose={() => setEditOpen(false)} onDone={() => setEditOpen(false)} />}
      {deleteOpen && (
        <ConfirmDialog
          title="Eliminar clase"
          message={<>Vas a eliminar <strong>{klass.name}</strong> y todo su contenido (módulos, actividades, entregas y notas). Esta acción no se puede deshacer.</>}
          onConfirm={async () => {
            await deleteClass.mutateAsync(klass.id);
            router.push("/clases");
          }}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
