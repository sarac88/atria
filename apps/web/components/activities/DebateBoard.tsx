"use client";

import { useState } from "react";
import { Avatar, Badge, Button, Icon, Textarea } from "@/components/ui";
import { Chip, Eyebrow } from "@/components/layout";
import { useCreateDebatePost, useDebateThread, useDeleteDebatePost } from "@/lib/api/classwork";
import { ApiError } from "@/lib/api/client";
import type { Activity, DebatePostDto, Role } from "@/lib/types";

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

/** Composer shared by the root form and the inline reply forms. */
function Composer({
  placeholder,
  minWords,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: {
  placeholder: string;
  minWords: number;
  pending: boolean;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      <Textarea
        rows={3}
        placeholder={placeholder}
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
      />
      {error ? (
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "8px 11px" }}>{error}</div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        {minWords > 0 ? (
          <span style={{ fontSize: 12.5, color: short ? "var(--text-muted)" : "var(--success-600)" }}>
            {words} / {minWords} palabras mínimas
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {onCancel ? <Button size="small" variant="outline" onClick={onCancel}>Cancelar</Button> : null}
        <Button size="small" variant="accent" disabled={!body.trim() || short || pending} onClick={send}>
          {pending ? "Publicando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Post({
  post,
  depth,
  canModerate,
  minWords,
  replyingTo,
  onReplyTo,
  onReply,
  onDelete,
  pending,
}: {
  post: DebatePostDto;
  depth: number;
  canModerate: boolean;
  minWords: number;
  replyingTo: string | null;
  onReplyTo: (id: string | null) => void;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const isTeacherPost = post.authorRole === "docente" || post.authorRole === "admin";

  return (
    <div style={{ display: "flex", gap: 12, marginLeft: depth * 44 }}>
      <Avatar name={post.author} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-lg)", background: post.mine ? "var(--primary-100)" : "var(--surface-card)", boxShadow: "var(--ring-hairline)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{post.author}</span>
            {isTeacherPost ? <Badge color="info">Profesor</Badge> : null}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{post.date}</span>
            <div style={{ flex: 1 }} />
            {canModerate || post.mine ? (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                aria-label="Eliminar intervención"
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}
              >
                <Icon name="trash" size={16} />
              </button>
            ) : null}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{post.body}</p>
        </div>

        {depth === 0 ? (
          <div style={{ marginTop: 6 }}>
            {replyingTo === post.id ? (
              <div style={{ marginTop: 8 }}>
                <Composer
                  autoFocus
                  placeholder={`Responde a ${post.author}…`}
                  minWords={0}
                  pending={pending}
                  submitLabel="Responder"
                  onCancel={() => onReplyTo(null)}
                  onSubmit={(body) => onReply(post.id, body)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onReplyTo(post.id)}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 700, color: "var(--primary-600)", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="chat" size={15} /> Responder
              </button>
            )}
          </div>
        ) : null}

        {post.replies.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {post.replies.map((r) => (
              <Post
                key={r.id}
                post={r}
                depth={depth + 1}
                canModerate={canModerate}
                minWords={minWords}
                replyingTo={replyingTo}
                onReplyTo={onReplyTo}
                onReply={onReply}
                onDelete={onDelete}
                pending={pending}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Forum board for a debate activity: opening question, contributions and replies. */
export function DebateBoard({ activity, role }: { activity: Activity; role: Role }) {
  const { data, isLoading, isError, refetch } = useDebateThread(activity.id);
  const create = useCreateDebatePost(activity.id);
  const remove = useDeleteDebatePost(activity.id);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const isTeacher = role !== "alumno";

  if (isLoading) {
    return <div style={{ fontSize: 14, color: "var(--text-muted)", padding: 24 }}>Cargando el debate…</div>;
  }

  if (isError || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--status-error-soft)" }}>
        <div style={{ fontSize: 14, color: "var(--text-body)" }}>No se pudo cargar el debate. Comprueba que la API está disponible.</div>
        <Button size="small" variant="outline" onClick={() => void refetch()}>Reintentar</Button>
      </div>
    );
  }

  const { openingQuestion, minWords, minReplies, canSeeOthers, myPosts, myReplies, posts } = data;
  const repliesLeft = Math.max(0, minReplies - myReplies);

  const publish = async (body: string, parentId?: string) => {
    await create.mutateAsync({ body, parentId });
    setReplyingTo(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "20px 24px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)" }}>
        <Eyebrow>Pregunta de apertura</Eyebrow>
        <h3 style={{ fontSize: 18, margin: "8px 0 0", lineHeight: 1.4 }}>{openingQuestion || activity.title}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {minWords > 0 ? <Chip icon="pencil">Mínimo {minWords} palabras</Chip> : null}
          {minReplies > 0 ? <Chip icon="chat">Responde a {minReplies} compañero{minReplies === 1 ? "" : "s"}</Chip> : null}
          {!isTeacher && !canSeeOthers ? <Chip icon="eye">Publica para ver al resto</Chip> : null}
        </div>

        {!isTeacher ? (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-muted)" }}>
            Tu participación: <strong style={{ color: "var(--text-strong)" }}>{myPosts}</strong> intervención{myPosts === 1 ? "" : "es"}
            {minReplies > 0 ? (
              <> · <strong style={{ color: repliesLeft ? "var(--text-strong)" : "var(--success-600)" }}>{myReplies} de {minReplies}</strong> respuestas</>
            ) : (
              <> · <strong style={{ color: "var(--text-strong)" }}>{myReplies}</strong> respuestas</>
            )}
          </div>
        ) : null}
      </div>

      <div style={{ padding: "18px 20px", borderRadius: "var(--radius-lg)", background: "var(--surface-soft)", boxShadow: "var(--ring-hairline)" }}>
        <Eyebrow>{isTeacher ? "Escribe en el debate" : myPosts ? "Añade otra intervención" : "Tu intervención"}</Eyebrow>
        <div style={{ marginTop: 10 }}>
          <Composer
            placeholder={isTeacher ? "Modera, matiza o lanza una repregunta…" : "Expón tu postura y justifícala…"}
            minWords={isTeacher ? 0 : minWords}
            pending={create.isPending}
            submitLabel="Publicar"
            onSubmit={(body) => publish(body)}
          />
        </div>
      </div>

      {!canSeeOthers ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", fontSize: 13.5, color: "var(--text-body)" }}>
          <Icon name="eye" size={18} color="var(--text-muted)" />
          Las intervenciones de tus compañeros se mostrarán cuando publiques la tuya.
        </div>
      ) : null}

      {posts.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map((p) => (
            <Post
              key={p.id}
              post={p}
              depth={0}
              canModerate={isTeacher}
              minWords={minWords}
              replyingTo={replyingTo}
              onReplyTo={setReplyingTo}
              onReply={(parentId, body) => publish(body, parentId)}
              onDelete={(id) => remove.mutate(id)}
              pending={create.isPending}
            />
          ))}
        </div>
      ) : canSeeOthers ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "28px 20px" }}>
          Todavía no hay intervenciones. Abre tú el debate.
        </div>
      ) : null}
    </div>
  );
}
