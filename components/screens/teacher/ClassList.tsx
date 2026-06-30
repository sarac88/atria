"use client";

import type { ReactNode } from "react";
import { Card, Button, Badge, Icon } from "@/components/ui";
import { Page, PageHead, Chip } from "@/components/layout";
import { classes } from "@/lib/data";
import type { ClassInfo } from "@/lib/types";

function cover(bg: string, icon: string): ReactNode {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: "rgba(255,255,255,0.92)" }}>
      <Icon name={icon} size={48} />
    </div>
  );
}

export function ClassList({ onOpenClass, onCreate }: { onOpenClass: (c: ClassInfo) => void; onCreate: () => void }) {
  return (
    <Page>
      <PageHead title="Mis clases" subtitle="6 clases · 184 alumnos en total" actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={onCreate}>Crear clase</Button>} />
      <div className="atria-classgrid3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {classes.map((c) => (
          <Card
            key={c.id}
            title={c.name}
            subtitle={c.code + " · " + c.room}
            interactive
            media={cover(c.color, c.icon)}
            onClick={() => onOpenClass(c)}
            footer={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Chip icon="users">{c.students} alumnos</Chip>
                <Badge color={c.status[1]}>{c.status[0]}</Badge>
              </div>
            }
          />
        ))}
      </div>
    </Page>
  );
}
