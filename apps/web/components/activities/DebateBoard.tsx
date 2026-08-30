"use client";

import { useState, type ReactNode } from "react";
import { Avatar, Badge, Button, Icon, RichView } from "@/components/ui";
import { useSettings } from "@/components/settings/SettingsContext";
import { useCreateDebatePost, useDebateThread, useDeleteDebatePost } from "@/lib/api/classwork";
import { ApiError } from "@/lib/api/client";
import type { Activity, DebatePostDto, Role } from "@/lib/types";

const PAD_X = "clamp(16px, 2.2vw, 26px)";

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Extrae el mensaje del backend (validación Zod o excepción) para mostrarlo tal cual. */
function debatePostError(err: unknown): string {
  const fallback = "No se pudo publicar. Inténtalo de nuevo.";
  if (!(err instanceof ApiError)) return fallback;
  try {
    const parsed = JSON.parse(err.message) as { message?: string | string[] };
    const msg = parsed.message;
    return (Array.isArray(msg) ? msg.join(". ") : msg) || err.message || fallback;
  } catch {
    return err.message || fallback;
  }
}

function threadStats(posts: DebatePostDto[]) {
  const contributions = posts.reduce((n, p) => n + 1 + p.replies.length, 0);
  const unanswered = posts.filter((p) => p.replies.length === 0).length;
  return { contributions, unanswered };
}

function MetaChip({ icon, tone = "neutral", children }: { icon?: string; tone?: "neutral" | "primary"; children: ReactNode }) {
  const primary = tone === "primary";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        background: primary ? "var(--primary-100)" : "var(--surface-sunken)",
        fontSize: 12.5,
        fontWeight: primary ? 600 : 400,
        color: primary ? "var(--primary-600)" : "var(--text-body)",
        whiteSpace: "nowrap",
      }}
    >
      {icon ? <Icon name={icon} size={14} color={primary ? "var(--primary-600)" : "var(--text-muted)"} /> : null}
      {children}
    </span>
  );
}

/** Cabecera del recuadro: un tab por debate ("Foro 1", "Foro 2"…) y el estado a la derecha. */
function ForumHeader({
  debates,
  activity,
  onSelect,
}: {
  debates: Activity[];
  activity: Activity;
  onSelect?: (id: string) => void;
}) {
  const [statusLabel] = activity.status;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        padding: `14px ${PAD_X} 0`,
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", gap: 22, alignItems: "flex-end", minWidth: 0, overflowX: "auto", scrollbarWidth: "thin" }}>
        {debates.map((d, i) => {
          const active = d.id === activity.id;
          return (
            <button
              key={d.id}
              type="button"
              title={d.title}
              onClick={() => onSelect?.(d.id)}
              style={{
                position: "relative",
                border: "none",
                background: "transparent",
                cursor: onSelect && debates.length > 1 ? "pointer" : "default",
                padding: "0 2px 12px",
                fontFamily: "var(--font-sans)",
                fontSize: 14.5,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--text-strong)" : "var(--text-muted)",
                whiteSpace: "nowrap",
                transition: "color .15s ease",
              }}
            >
              Foro {i + 1}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 3,
                  borderRadius: 3,
                  background: active ? "var(--brand-accent)" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, flexShrink: 0 }}>
        {statusLabel === "En vivo" ? (
          <Badge color="success">En vivo</Badge>
        ) : statusLabel ? (
          <Badge color="default">{statusLabel}</Badge>
        ) : null}
        {activity.due ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            <Icon name="calendar" size={15} color="var(--text-muted)" />
            Cierra el {activity.due}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Intro del debate: pregunta de apertura, requisitos y estado de participación. */
function ForumIntro({
  activity,
  openingQuestion,
  minWords,
  minReplies,
  canSeeOthers,
  isTeacher,
  myPosts,
  myReplies,
  posts,
}: {
  activity: Activity;
  openingQuestion: string;
  minWords: number;
  minReplies: number;
  canSeeOthers: boolean;
  isTeacher: boolean;
  myPosts: number;
  myReplies: number;
  posts: DebatePostDto[];
}) {
  const { contributions, unanswered } = threadStats(posts);
  const participationPct = activity.total > 0 ? Math.round((activity.submitted / activity.total) * 100) : 0;

  return (
    <div
      style={{
        padding: `20px ${PAD_X} 22px`,
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
        borderLeft: "3px solid var(--brand-accent)",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "clamp(17px, 1.9vw, 21px)", color: "var(--text-strong)" }}>{activity.title}</h3>
      <div style={{ marginTop: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Pregunta de apertura
        </span>
        <RichView html={openingQuestion || activity.title} lineHeight={1.6} style={{ fontSize: 14.5, marginTop: 6 }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {minWords > 0 ? <MetaChip icon="pencil">Mínimo {minWords} palabras</MetaChip> : null}
        {minReplies > 0 ? (
          <MetaChip icon="chat">
            Responde a {minReplies} compañero{minReplies === 1 ? "" : "s"}
          </MetaChip>
        ) : null}
        {isTeacher ? (
          <>
            <MetaChip icon="chat" tone="primary">
              {contributions} aportaciones
            </MetaChip>
            <MetaChip icon="eye" tone="primary">
              {unanswered} sin responder
            </MetaChip>
            {activity.total > 0 ? (
              <MetaChip icon="users" tone="primary">
                {activity.submitted} de {activity.total} han participado · {participationPct}%
              </MetaChip>
            ) : null}
          </>
        ) : (
          <>
            {!canSeeOthers ? <MetaChip icon="eye">Publica para ver al resto</MetaChip> : null}
            <MetaChip icon="chat" tone="primary">
              Tu participación: {myPosts} intervención{myPosts === 1 ? "" : "es"}
              {minReplies > 0 ? ` · ${myReplies} de ${minReplies} respuestas` : myReplies > 0 ? ` · ${myReplies} respuesta${myReplies === 1 ? "" : "s"}` : ""}
            </MetaChip>
          </>
        )}
      </div>
    </div>
  );
}

/** Composer shared by the root form and the inline reply forms. */
function Composer({
  placeholder,
  minWords,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
  compact,
}: {
  placeholder: string;
  minWords: number;
  pending: boolean;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const words = countWords(body);
  const short = minWords > 0 && words < minWords;

  const send = async () => {
    if (!body.trim() || short) return;
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (err) {
      setError(debatePostError(err));
    }
  };

  return (
    <div>
      <textarea
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          resize: "vertical",
          padding: "10px 13px",
          background: "transparent",
          border: `1px solid ${focused ? "var(--border-focus)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--text-strong)",
          transition: "border-color .15s ease",
        }}
      />
      {error ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--status-error)",
            background: "var(--status-error-soft)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 11px",
          }}
        >
          {error}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        {minWords > 0 ? (
          <span style={{ fontSize: 12.5, color: short ? "var(--text-muted)" : "var(--success-600)" }}>
            {words} / {minWords} palabras mínimas
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {onCancel ? (
          <Button size="small" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button size="small" variant="accent" disabled={!body.trim() || short || pending} onClick={send}>
          {pending ? "Publicando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function PostHead({
  post,
  canModerate,
  onDelete,
}: {
  post: DebatePostDto;
  canModerate: boolean;
  onDelete: (id: string) => void;
}) {
  const isTeacherPost = post.authorRole === "docente" || post.authorRole === "admin";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <Avatar name={post.author} size="sm" />
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{post.author}</span>
      {isTeacherPost ? (
        <Badge color="draft" type="solid" style={{ fontSize: 11, padding: "3px 10px" }}>
          Profesor
        </Badge>
      ) : post.mine ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Tú</span>
      ) : null}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{post.date}</span>
      {canModerate || post.mine ? (
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          aria-label="Eliminar intervención"
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", padding: 0 }}
        >
          <Icon name="trash" size={16} />
        </button>
      ) : null}
    </div>
  );
}

/** Una intervención raíz con sus respuestas plegadas tras el contador. */
function ThreadRow({
  post,
  canModerate,
  replyingTo,
  onReplyTo,
  onReply,
  onDelete,
  pending,
  last,
}: {
  post: DebatePostDto;
  canModerate: boolean;
  replyingTo: string | null;
  onReplyTo: (id: string | null) => void;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => void;
  pending: boolean;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  const count = post.replies.length;
  const replying = replyingTo === post.id;

  return (
    <article style={{ padding: `18px ${PAD_X}`, borderBottom: last ? "none" : "1px solid var(--border-subtle)" }}>
      <PostHead post={post} canModerate={canModerate} onDelete={onDelete} />
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{post.body}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        {count ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-body)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="chat" size={15} color="var(--text-muted)" />
            {`${count} ${count === 1 ? "respuesta" : "respuestas"}`}
            <Icon name={open ? "chevron-down" : "chevron-right"} size={14} color="var(--text-muted)" />
          </button>
        ) : (
          <span style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="chat" size={15} color="var(--text-muted)" />
            Sin respuestas
          </span>
        )}
        {!replying ? (
          <button
            type="button"
            onClick={() => onReplyTo(post.id)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--primary-600)",
            }}
          >
            Responder
          </button>
        ) : null}
      </div>

      {open && count ? (
        <div
          style={{
            marginTop: 14,
            marginLeft: 14,
            paddingLeft: 18,
            borderLeft: "2px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {post.replies.map((r) => (
            <div key={r.id} style={{ minWidth: 0 }}>
              <PostHead post={r} canModerate={canModerate} onDelete={onDelete} />
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{r.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {replying ? (
        <div
          style={{ marginTop: 14, marginLeft: 14 }}
        >
          <Composer
            autoFocus
            compact
            placeholder={`Responde a ${post.author}…`}
            minWords={0}
            pending={pending}
            submitLabel="Responder"
            onCancel={() => onReplyTo(null)}
            onSubmit={(body) => onReply(post.id, body)}
          />
        </div>
      ) : null}
    </article>
  );
}

/** Forum board for a debate activity: opening question, contributions and replies. */
export function DebateBoard({
  activity,
  role,
  debates = [],
  onSelectDebate,
}: {
  activity: Activity;
  role: Role;
  debates?: Activity[];
  onSelectDebate?: (id: string) => void;
}) {
  const { user } = useSettings();
  const { data, isLoading, isError, refetch } = useDebateThread(activity.id);
  const create = useCreateDebatePost(activity.id);
  const remove = useDeleteDebatePost(activity.id);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const isTeacher = role !== "alumno";
  const userName = user?.name ?? (isTeacher ? "Profesor" : "Alumno");

  const shell = (children: ReactNode) => (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        background: "var(--surface-card)",
        boxShadow: "var(--ring-hairline), var(--shadow-md)",
      }}
    >
      {children}
    </div>
  );

  if (isLoading) {
    return shell(<div style={{ fontSize: 14, color: "var(--text-muted)", padding: 28 }}>Cargando el debate…</div>);
  }

  if (isError || !data) {
    return shell(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: 28 }}>
        <div style={{ fontSize: 14, color: "var(--text-body)" }}>No se pudo cargar el debate. Comprueba que la API está disponible.</div>
        <Button size="small" variant="outline" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </div>,
    );
  }

  const { openingQuestion, minWords, minReplies, canSeeOthers, myPosts, myReplies, posts } = data;

  const publish = async (body: string, parentId?: string) => {
    await create.mutateAsync({ body, parentId });
    setReplyingTo(null);
  };

  const debateList = debates.length ? debates : [activity];

  return shell(
    <>
      <ForumHeader debates={debateList} activity={activity} onSelect={onSelectDebate} />

      <ForumIntro
        activity={activity}
        openingQuestion={openingQuestion}
        minWords={minWords}
        minReplies={minReplies}
        canSeeOthers={canSeeOthers}
        isTeacher={isTeacher}
        myPosts={myPosts}
        myReplies={myReplies}
        posts={posts}
      />

      <div style={{ padding: `18px ${PAD_X}`, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar name={userName} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Composer
              placeholder={isTeacher ? "Modera, matiza o lanza una repregunta…" : "Expón tu postura y justifícala…"}
              minWords={isTeacher ? 0 : minWords}
              pending={create.isPending}
              submitLabel="Publicar"
              onSubmit={(body) => publish(body)}
            />
          </div>
        </div>
      </div>

      {!canSeeOthers ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: `14px ${PAD_X}`,
            background: "var(--surface-sunken)",
            borderBottom: posts.length ? "1px solid var(--border-subtle)" : "none",
            fontSize: 13.5,
            color: "var(--text-body)",
          }}
        >
          <Icon name="eye" size={18} color="var(--text-muted)" />
          Las intervenciones de tus compañeros se mostrarán cuando publiques la tuya.
        </div>
      ) : null}

      {posts.length
        ? posts.map((p, i) => (
            <ThreadRow
              key={p.id}
              post={p}
              canModerate={isTeacher}
              replyingTo={replyingTo}
              onReplyTo={setReplyingTo}
              onReply={(parentId, body) => publish(body, parentId)}
              onDelete={(id) => remove.mutate(id)}
              pending={create.isPending}
              last={i === posts.length - 1}
            />
          ))
        : canSeeOthers ? (
            <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "32px 20px" }}>
              Todavía no hay intervenciones. Abre tú el debate.
            </div>
          ) : null}
    </>,
  );
}
