"use client";

import { Card } from "@/components/ui";
import { Page, PageHead, ProgressBar } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import type { ClassInfo } from "@/lib/types";

export function StudentCourses({ classes, onOpenClass }: { classes: ClassInfo[]; onOpenClass: (c: ClassInfo) => void }) {
  return (
    <Page>
      <PageHead title="Mis cursos" subtitle="5 cursos en marcha" />
      <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {classes.slice(0, 5).map((c) => (
          <Card key={c.id} title={c.name} subtitle={c.code} interactive media={<ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={46} />} onClick={() => onOpenClass(c)} footer={<div style={{ width: "100%" }}><ProgressBar value={c.progress} showLabel /></div>} />
        ))}
      </div>
    </Page>
  );
}
