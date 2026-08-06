"use client";

import type { CSSProperties } from "react";

const HTML_RE = /<\/?[a-z][\s\S]*>/i;

export interface RichViewProps {
  /** HTML from the RichText editor, or plain text for legacy content. */
  html: string;
  lineHeight?: number;
  style?: CSSProperties;
}

/** Read-only counterpart of RichText: renders its HTML, or plain text with preserved line breaks. */
export function RichView({ html, lineHeight = 1.6, style = {} }: RichViewProps) {
  if (!HTML_RE.test(html)) {
    return <p style={{ fontSize: 14, lineHeight, color: "var(--text-body)", margin: "8px 0 0", whiteSpace: "pre-wrap", ...style }}>{html}</p>;
  }
  return (
    <>
      <div
        className="atria-richview"
        style={{ fontSize: 14, lineHeight, color: "var(--text-body)", marginTop: 8, ...style }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style jsx global>{`
        .atria-richview > * {
          margin: 0 0 8px;
        }
        .atria-richview > *:last-child {
          margin-bottom: 0;
        }
        .atria-richview h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-strong);
        }
        .atria-richview ul,
        .atria-richview ol {
          padding-left: 22px;
        }
        .atria-richview ul {
          list-style: disc;
        }
        .atria-richview ol {
          list-style: decimal;
        }
        .atria-richview li {
          margin: 2px 0;
        }
        .atria-richview li > p {
          margin: 0;
        }
        .atria-richview a {
          color: var(--primary-600);
          text-decoration: underline;
        }
        .atria-richview img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 4px 0;
        }
      `}</style>
    </>
  );
}
