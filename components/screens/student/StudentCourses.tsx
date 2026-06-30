"use client";

import type { ReactNode } from "react";
import { Card, Icon } from "@/components/ui";
import { Page, PageHead, ProgressBar } from "@/components/layout";
import { classes } from "@/lib/data";
import type { ClassInfo } from "@/lib/types";

function cover(bg: string, ic: string): ReactNode {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: "rgba(255,255,255,0.92)" }}>
      <Icon name={ic} size={46} />
    </div>
  );
}

export function StudentCourses({ onOpenClass }: { onOpenClass: (c: ClassInfo) => void }) {
  return (
    <Page>
      <PageHead title="Mis cursos" subtitle="5 cursos en marcha" />
      <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {classes.slice(0, 5).map((c) => (
          <Card key={c.id} title={c.name} subtitle={c.code} interactive media={cover(c.color, c.icon)} onClick={() => onOpenClass(c)} footer={<div style={{ width: "100%" }}><ProgressBar value={c.progress} showLabel /></div>} />
        ))}
      </div>
    </Page>
  );
}
