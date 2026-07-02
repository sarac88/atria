"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { useClass } from "@/lib/api/classes";
import { ClassDetail } from "@/components/screens/teacher/ClassDetail";
import { StudentClass } from "@/components/screens/student/StudentClass";
import { CreateActivityModal } from "@/components/modals/CreateActivityModal";
import { SubmitModal } from "@/components/modals/SubmitModal";
import type { ClassInfo } from "@/lib/types";

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { role, logout } = useSettings();
  const { data: klass, isLoading } = useClass(params.id);
  const [activityOpen, setActivityOpen] = useState<ClassInfo | null>(null);
  const [submitActivityId, setSubmitActivityId] = useState<string | null>(null);

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
        <StudentClass klass={klass} onBack={onBack} onProfile={onProfile} onLogout={onLogout} onSubmit={(aid) => setSubmitActivityId(aid)} />
      ) : (
        <ClassDetail klass={klass} onBack={onBack} onProfile={onProfile} onLogout={onLogout} onNewActivity={(c) => setActivityOpen(c)} />
      )}
      {activityOpen && <CreateActivityModal klass={activityOpen} onClose={() => setActivityOpen(null)} onDone={() => setActivityOpen(null)} />}
      {submitActivityId && <SubmitModal activityId={submitActivityId} classId={klass.id} onClose={() => setSubmitActivityId(null)} onDone={() => setSubmitActivityId(null)} />}
    </div>
  );
}
