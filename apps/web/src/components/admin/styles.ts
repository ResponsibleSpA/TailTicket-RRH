/**
 * Classi comuni dell'area admin (docs/brand/ui.md): una sola fonte per link delle righe, pulsanti
 * secondari e pulsanti a icona, così liste e form restano coerenti.
 */

/** Nome dell'elemento nelle tabelle: testo neutro, primario solo al passaggio del mouse. */
export const ROW_LINK =
  "font-medium text-gray-900 hover:text-brand-600 focus-visible:text-brand-600 dark:text-white/90 dark:hover:text-brand-400 dark:focus-visible:text-brand-400";

/** Pulsante secondario (bordo): "Aggiungi", azioni accanto al primario. */
export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:bg-white/3 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5 dark:disabled:hover:bg-white/3";

/** Pulsante a icona per togliere una riga: grigio, rosso solo al passaggio del mouse. */
export const BTN_REMOVE =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-gray-500 dark:hover:bg-error-500/10 dark:hover:text-error-400";
