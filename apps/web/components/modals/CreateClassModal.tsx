"use client";

import { useState } from "react";
import { Input, Button, Icon, Switch } from "@/components/ui";
import { Modal } from "@/components/layout";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { useClasses, useCreateClass, useUpdateClass } from "@/lib/api/classes";
import { CLASS_THUMB_PRESETS, CLASS_THUMB_SUBJECTS, classThumbPreset, type ClassThumbId, type ClassThumbSubject } from "@/lib/class-thumbs";
import type { ClassInfo } from "@/lib/types";

const colors: [string, string][] = [
  ["var(--primary-500)", "academic-cap"],
  ["var(--yellow-500)", "book-open"],
  ["var(--info-500)", "folder"],
  ["var(--success-500)", "document-text"],
  ["var(--warning-500)", "star"],
];
/** Prefijo del código que se propone para cada asignatura (MAT-101, NAT-102…). */
const CODE_PREFIX: Record<ClassThumbSubject, string> = {
  math: "MAT",
  science: "NAT",
  physics: "FyQ",
  literature: "LEN",
  history: "HIS",
  social: "SOC",
  art: "ART",
  computing: "INF",
};

const firstPreset = (subject: ClassThumbSubject) => CLASS_THUMB_PRESETS.find((t) => t.subject === subject)!;

/** Siguiente código libre de la asignatura entre las clases que ya tiene el profesor. */
function nextCode(subject: ClassThumbSubject, classes: ClassInfo[]): string {
  const prefix = CODE_PREFIX[subject];
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const used = classes.map((c) => Number(re.exec(c.code)?.[1] ?? 0));
  return `${prefix}-${Math.max(100, ...used) + 1}`;
}

export function CreateClassModal({ klass, onClose, onDone }: { klass?: ClassInfo | null; onClose: () => void; onDone: (id: string) => void }) {
  const editing = !!klass;
  const create = useCreateClass();
  const update = useUpdateClass(klass?.id ?? "");
  const busy = create.isPending || update.isPending;
  const { data: classes } = useClasses();
  // Al crear, primero se elige la asignatura y después se rellena el resto.
  const [step, setStep] = useState<"subject" | "details">(editing ? "details" : "subject");

  const initColor = klass ? Math.max(0, colors.findIndex(([col]) => col === klass.color)) : 0;
  const [sel, setSel] = useState(initColor);
  // classThumbPreset traduce también los identificadores antiguos ("math" → "math-1").
  const initPreset = classThumbPreset(klass?.thumb);
  const [thumb, setThumb] = useState<ClassThumbId | "">(initPreset?.id ?? "");
  // Pestaña de asignatura de la galería: abre en la de la ilustración elegida.
  const [gallery, setGallery] = useState<ClassThumbSubject>(initPreset?.subject ?? CLASS_THUMB_SUBJECTS[0].id);
  // Con qué se dibuja la miniatura: una ilustración o el par color + icono.
  const [thumbMode, setThumbMode] = useState<"image" | "icon">(klass?.thumb ? "image" : "icon");
  // Las asignaturas antiguas (Ciencias, Humanidades…) no casan con ninguna: se
  // quedan sin marcar y, como sólo se envía si se elige, no se pierden.
  const [subj, setSubj] = useState<ClassThumbSubject | null>(
    CLASS_THUMB_SUBJECTS.find((sj) => sj.label === klass?.subject)?.id ?? null,
  );
  const [name, setName] = useState(klass?.name ?? "");
  const [code, setCode] = useState(klass && klass.code !== "—" ? klass.code : "");
  const [room, setRoom] = useState(klass?.room ?? "");

  /** Paso 1 → 2: la asignatura trae su ilustración y un código; el aula, la última usada. */
  const pickSubject = (id: ClassThumbSubject) => {
    setSubj(id);
    setGallery(id);
    setThumbMode("image");
    setThumb(firstPreset(id).id);
    setCode(nextCode(id, classes ?? []));
    if (!room) setRoom((classes ?? []).find((c) => c.room)?.room ?? "");
    setStep("details");
  };
  const subjectLabel = (id: ClassThumbSubject) => CLASS_THUMB_SUBJECTS.find((sj) => sj.id === id)!.label;
  const [publish, setPublish] = useState(klass ? klass.status[0] !== "Borrador" : true);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("El nombre de la clase es obligatorio.");
      return;
    }
    setError(null);
    const base = {
      name: name.trim(),
      code: code.trim() || "—",
      room: room.trim(),
      color: colors[sel][0],
      icon: colors[sel][1],
      // El color y el icono se guardan siempre (los usan el calendario y los
      // chips); `thumb` decide sólo qué se ve en la miniatura.
      thumb: thumbMode === "image" ? thumb : "",
      publish,
    };
    try {
      if (editing) {
        // En edición sólo enviamos la asignatura si se ha elegido, para no borrarla.
        // La descripción se edita en «Sobre el curso», no aquí.
        const cls = await update.mutateAsync(subj != null ? { ...base, subject: subjectLabel(subj) } : base);
        onDone(cls.id);
      } else {
        const cls = await create.mutateAsync({ ...base, desc: "", subject: subj != null ? subjectLabel(subj) : "" });
        onDone(cls.id);
      }
    } catch {
      setError(editing ? "No se pudo guardar la clase." : "No se pudo crear la clase.");
    }
  };

  if (step === "subject") {
    return (
      <Modal title="Crear clase" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Cancelar</Button>} width={620}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>¿De qué asignatura es la clase?</p>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-muted)" }}>Después podrás ponerle nombre y cambiar la ilustración.</p>
        <div className="atria-subjectgrid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {CLASS_THUMB_SUBJECTS.map((sj) => {
            const t = firstPreset(sj.id);
            return (
              <button
                key={sj.id}
                type="button"
                onClick={() => pickSubject(sj.id)}
                style={{ padding: 0, border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-card)", boxShadow: "var(--ring-hairline)", textAlign: "left", fontFamily: "var(--font-sans)", transition: "box-shadow .15s ease, transform .15s ease" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 2px var(--brand-primary)"; ev.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.boxShadow = "var(--ring-hairline)"; ev.currentTarget.style.transform = "none"; }}
              >
                <span style={{ display: "block", aspectRatio: "16 / 10", background: t.bg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center", display: "block" }} />
                </span>
                <span style={{ display: "block", padding: "9px 10px", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sj.label}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    );
  }

  const footer = (
    <>
      {editing ? (
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      ) : (
        <Button variant="outline" onClick={() => setStep("subject")} iconLeft={<Icon name="arrow-left" size={16} />}>Atrás</Button>
      )}
      <Button variant="accent" onClick={submit} disabled={busy}>
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear clase"}
      </Button>
    </>
  );

  return (
    <Modal title={editing ? "Editar clase" : "Crear clase"} onClose={onClose} footer={footer} width={620}>
      <div className="atria-formcard" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Miniatura</label>
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--ring-hairline)", height: 140, display: "flex" }}>
            <ClassThumb
              thumb={thumbMode === "image" ? thumb : ""}
              color={colors[sel][0]}
              icon={colors[sel][1]}
              name={name}
              iconSize={44}
            />
          </div>

          <div style={{ display: "flex", gap: 8, margin: "14px 0 12px" }}>
            {([["image", "Ilustración", "photo"], ["icon", "Color e icono", "star"]] as const).map(([mode, label, ic]) => {
              const on = thumbMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setThumbMode(mode);
                    // Entrar en «Ilustración» sin ninguna elegida deja la miniatura
                    // vacía: se preselecciona la primera para que se vea el cambio.
                    if (mode === "image" && !thumb) setThumb(CLASS_THUMB_PRESETS.find((t) => t.subject === gallery)!.id);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--primary-100)" : "var(--gray-100)", boxShadow: on ? "inset 0 0 0 2px var(--brand-primary)" : "inset 0 0 0 2px var(--border-default)", color: on ? "var(--primary-700)" : "var(--text-strong)", fontSize: 13.5, fontWeight: 600, transition: "background .15s ease, box-shadow .15s ease" }}
                >
                  <Icon name={ic} size={16} />{label}
                </button>
              );
            })}
          </div>

          {thumbMode === "image" ? (
            <>
              <div role="tablist" aria-label="Asignatura de la ilustración" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {CLASS_THUMB_SUBJECTS.map((sj) => {
                  const on = gallery === sj.id;
                  return (
                    <button
                      key={sj.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setGallery(sj.id)}
                      style={{ border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: on ? "var(--primary-100)" : "transparent", boxShadow: on ? "inset 0 0 0 1.5px var(--brand-primary)" : "inset 0 0 0 1px var(--border-default)", color: on ? "var(--primary-700)" : "var(--text-muted)", transition: "background .15s ease, box-shadow .15s ease, color .15s ease" }}
                    >
                      {sj.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {CLASS_THUMB_PRESETS.filter((t) => t.subject === gallery).map((t, i) => {
                  const on = thumb === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      title={`${t.label} ${i + 1}`}
                      aria-label={`${t.label}, ilustración ${i + 1}`}
                      aria-pressed={on}
                      onClick={() => setThumb(t.id)}
                      style={{ padding: 0, border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", overflow: "hidden", background: t.bg, aspectRatio: "16 / 9", boxShadow: on ? "0 0 0 3px var(--surface-card), 0 0 0 5px var(--brand-primary)" : "var(--ring-hairline)", transition: "box-shadow .15s ease" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center", display: "block" }} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              {colors.map(([col, ic], i) => (
                <button key={i} type="button" aria-label={`Color ${i + 1}`} aria-pressed={sel === i} onClick={() => setSel(i)} style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: col, color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: sel === i ? "0 0 0 3px var(--surface-card), 0 0 0 5px var(--brand-primary)" : "none" }}>
                  <Icon name={ic} size={20} />
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? <div style={{ fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}

        {!editing && subj ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)" }}>
            <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
              Asignatura: <strong style={{ color: "var(--text-strong)" }}>{subjectLabel(subj)}</strong>
            </span>
            <Button variant="link" size="small" onClick={() => setStep("subject")}>Cambiar</Button>
          </div>
        ) : null}

        <Input label="Nombre de la clase" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cálculo II" autoFocus={!editing} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Código" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT-204" />
          <Input label="Aula" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Aula 345" />
        </div>
        {editing ? (
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-strong)", display: "block", marginBottom: 8 }}>Asignatura</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CLASS_THUMB_SUBJECTS.map((sj) => {
                const on = subj === sj.id;
                return (
                  <button key={sj.id} type="button" onClick={() => setSubj(sj.id)} style={{ display: "inline-flex", alignItems: "center", padding: "8px 13px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", background: on ? "var(--primary-100)" : "var(--gray-100)", boxShadow: on ? "inset 0 0 0 2px var(--brand-primary)" : "inset 0 0 0 2px var(--border-default)", color: on ? "var(--primary-700)" : "var(--text-strong)", fontSize: 13.5, fontWeight: 600, transition: "background .15s ease, box-shadow .15s ease" }}>
                    {sj.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Publicar de inmediato</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Si está desactivado, se guarda como borrador.</div>
          </div>
          <Switch checked={publish} onChange={(v) => setPublish(v)} />
        </div>
      </div>
    </Modal>
  );
}
