"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

export interface RichTextProps {
  label?: string;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  helper?: string;
  minHeight?: number;
  style?: CSSProperties;
}

/** Returns true when the HTML has no visible text or media — used to emit "" instead of "<p></p>". */
function isBlank(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0 && !/<img/i.test(html);
}

const g = (paths: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const glyphs = {
  bold: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5h6.5a3.5 3.5 0 0 1 0 7H7z" />
      <path d="M7 12h7.5a3.5 3.5 0 0 1 0 7H7z" />
    </svg>
  ),
  italic: g(<><path d="M15 5h-5" /><path d="M14 19H9" /><path d="M15 5 10 19" /></>),
  h: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14" /><path d="M18 5v14" /><path d="M6 12h12" />
    </svg>
  ),
  bullet: g(<><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></>),
  ordered: g(<><path d="M10 6h10" /><path d="M10 12h10" /><path d="M10 18h10" /><path d="M4 5.5 5.2 5v3.2" /><path d="M4 15h1.8l-1.8 2.4h1.8" /></>),
  link: g(<><path d="M9 15l6-6" /><path d="M11 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L16 11.5" /><path d="M13 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L8 12.5" /></>),
  image: g(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m21 16-4.5-4.5L6 20" /></>),
};

function ToolButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        background: active ? "var(--primary-100)" : "transparent",
        color: active ? "var(--primary-700)" : "var(--text-muted)",
        transition: "background .12s ease, color .12s ease",
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Introduce la URL del enlace:", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  const addImage = () => {
    const url = window.prompt("Introduce la URL de la imagen:", "https://");
    if (url && url.trim()) editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const sep = <span style={{ width: 1, height: 20, background: "var(--border-default)", margin: "0 4px" }} />;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "6px 8px",
        borderBottom: "1px solid var(--border-default)",
        flexWrap: "wrap",
      }}
    >
      <ToolButton title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        {glyphs.bold}
      </ToolButton>
      <ToolButton title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        {glyphs.italic}
      </ToolButton>
      <ToolButton title="Encabezado" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        {glyphs.h}
      </ToolButton>
      {sep}
      <ToolButton title="Lista con viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        {glyphs.bullet}
      </ToolButton>
      <ToolButton title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        {glyphs.ordered}
      </ToolButton>
      {sep}
      <ToolButton title="Enlace" active={editor.isActive("link")} onClick={addLink}>
        {glyphs.link}
      </ToolButton>
      <ToolButton title="Imagen" onClick={addImage}>
        {glyphs.image}
      </ToolButton>
    </div>
  );
}

/**
 * Atria rich-text editor (TipTap). Value/onChange work with an HTML string,
 * so it drops in where a Textarea stored plain text. Emits "" when empty.
 */
export function RichText({ label, value = "", onChange, placeholder = "Escribe aquí…", helper, minHeight = 120, style = {} }: RichTextProps) {
  const [focused, setFocused] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow" } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "atria-rte-content" } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(isBlank(html) ? "" : html);
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  // Keep editor in sync when the value is replaced from outside (e.g. switching to edit mode).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && !(isBlank(next) && isBlank(current))) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  const borderColor = focused ? "var(--border-focus)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label ? (
        <label style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, lineHeight: 1, color: "var(--text-strong)" }}>
          {label}
        </label>
      ) : null}
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--radius-sm)",
          boxShadow: `inset 0 0 0 ${focused ? "1.5px" : "1px"} ${borderColor}${focused ? ", var(--focus-ring)" : ""}`,
          transition: "box-shadow .15s ease",
          overflow: "hidden",
        }}
      >
        {editor ? <Toolbar editor={editor} /> : null}
        <div style={{ ["--atria-rte-min" as string]: `${minHeight}px` }} onMouseDown={() => editor?.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {helper ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{helper}</span> : null}

      <style jsx global>{`
        .atria-rte-content {
          min-height: var(--atria-rte-min, 120px);
          padding: 12px 16px;
          outline: none;
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-strong);
        }
        .atria-rte-content > * {
          margin: 0 0 8px;
        }
        .atria-rte-content > *:last-child {
          margin-bottom: 0;
        }
        .atria-rte-content h3 {
          font-size: 16px;
          font-weight: 700;
        }
        .atria-rte-content ul,
        .atria-rte-content ol {
          padding-left: 22px;
        }
        .atria-rte-content ul {
          list-style: disc;
        }
        .atria-rte-content ol {
          list-style: decimal;
        }
        .atria-rte-content li {
          margin: 2px 0;
        }
        .atria-rte-content li > p {
          margin: 0;
        }
        .atria-rte-content a {
          color: var(--primary-600);
          text-decoration: underline;
          cursor: pointer;
        }
        .atria-rte-content img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 4px 0;
        }
        .atria-rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
