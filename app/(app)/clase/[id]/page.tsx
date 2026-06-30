"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { ClassDetail } from "@/components/screens/teacher/ClassDetail";
import { StudentClass } from "@/components/screens/student/StudentClass";
import { CreateActivityModal } from "@/components/modals/CreateActivityModal";
import { SubmitModal } from "@/components/modals/SubmitModal";
import { classes } from "@/lib/data";
import type { ClassInfo } from "@/lib/types";

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { role, logout } = useSettings();
  const [activityOpen, setActivityOpen] = useState<ClassInfo | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const klass = classes.find((c) => c.id === params.id) || classes[0];

  const onBack = () => router.push("/clases");
  const onProfile = () => router.push("/perfil");
  const onLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div style={{ height: "100vh" }}>
      {role === "alumno" ? (
        <StudentClass klass={klass} onBack={onBack} onProfile={onProfile} onLogout={onLogout} onSubmit={() => setSubmitOpen(true)} />
      ) : (
        <ClassDetail klass={klass} onBack={onBack} onProfile={onProfile} onLogout={onLogout} onNewActivity={(c) => setActivityOpen(c)} />
      )}
      {activityOpen && <CreateActivityModal klass={activityOpen} onClose={() => setActivityOpen(null)} onDone={() => setActivityOpen(null)} />}
      {submitOpen && <SubmitModal onClose={() => setSubmitOpen(false)} onDone={() => setSubmitOpen(false)} />}
    </div>
  );
}
