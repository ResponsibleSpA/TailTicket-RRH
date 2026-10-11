/** Aiuti del riquadro "collegamento" di RichTextEditor. */

/** Indirizzi ammessi per i collegamenti (come prima con il prompt): web e email. */
export const LINK_RE = /^(https?:\/\/\S+|mailto:\S+)$/i;

export const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Evidenziazione del testo da collegare mentre il focus è nel riquadro (CSS Custom Highlight API, dove
 * c'è): la selezione dell'editor non si vede più quando il focus passa al campo dell'indirizzo.
 */
const LINK_HIGHLIGHT = "tt-link-target";

/** Stile dell'evidenziazione: tinta tenue del primario (segue il tema). */
export const LINK_HIGHLIGHT_STYLE = `::highlight(${LINK_HIGHLIGHT}){background-color:color-mix(in srgb,var(--color-brand-500) 22%,transparent)}`;

export function markLinkTarget(range: Range | null) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  if (range && !range.collapsed) CSS.highlights.set(LINK_HIGHLIGHT, new Highlight(range));
  else CSS.highlights.delete(LINK_HIGHLIGHT);
}
