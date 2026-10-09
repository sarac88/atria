import sanitizeHtml from "sanitize-html";

/**
 * Limpia el HTML del editor RichText cuando lo escribe un alumno: deja solo las etiquetas,
 * atributos y estilos que produce el editor, y descarta scripts, eventos y URLs no http(s).
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "s", "u", "code", "pre", "blockquote", "h3", "ul", "ol", "li", "hr", "a", "span", "img"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      img: ["src", "alt"],
    },
    allowedStyles: {
      span: {
        "font-size": [/^\d{1,2}px$/],
        "font-family": [/^var\(--font-(sans|serif)\)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
    },
  });
}

/** True si el HTML no tiene texto ni imágenes visibles. */
export function isBlankHtml(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0 && !/<img/i.test(html);
}
