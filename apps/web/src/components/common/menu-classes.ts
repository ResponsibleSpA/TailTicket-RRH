/** Classi condivise delle barre azioni del ticket: voci dei menu a discesa e pulsanti (docs/brand/ui.md). */
export const menuItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-theme-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:bg-gray-100 focus-visible:outline-hidden dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:bg-white/5";

/** Voce distruttiva di un menu (es. elimina): rossa ma tenue, piena solo al passaggio del mouse. */
export const menuDangerItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-theme-sm text-error-600 hover:bg-error-50 focus-visible:bg-error-50 focus-visible:outline-hidden dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:bg-error-500/10";

const focusRing = "focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/20";

/** Pulsante secondario (bordo) delle barre azioni. */
export const menuButtonClass = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`;

/** Pulsante di testo (senza bordo) per le azioni di secondo piano. */
export const ghostButtonClass = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 sm:px-2.5 text-theme-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`;

/** Pulsante di testo per un'azione distruttiva: si distingue senza gridare (rosso solo nel testo). */
export const dangerGhostButtonClass = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-theme-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 ${focusRing}`;

/**
 * Gruppo di pulsanti uniti (azioni principali): bordo unico e separatori. I figli sono pulsanti o i
 * contenitori di MenuButton; gli angoli del primo e dell'ultimo seguono il bordo arrotondato.
 */
export const buttonGroupClass =
  "inline-flex items-stretch divide-x divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-theme-xs dark:divide-gray-800 dark:border-gray-800 dark:bg-white/3 [&>*]:flex [&>:first-child]:rounded-s-[7px] [&>:last-child]:rounded-e-[7px] [&>div>button]:rounded-[inherit]";

/** Pulsante dentro buttonGroupClass. */
export const groupButtonClass = `inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[inherit] px-2.5 text-theme-sm font-medium whitespace-nowrap text-gray-700 hover:bg-gray-50 hover:text-gray-900 sm:px-3 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`;
