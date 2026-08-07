/**
 * Quita los párrafos vacíos de un HTML del editor: el aire entre párrafos ya lo
 * da el espaciado del bloque, y las líneas en blanco sueltas rompen ese ritmo.
 */
export function stripEmptyParagraphs(html: string): string {
  return html.replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
}
