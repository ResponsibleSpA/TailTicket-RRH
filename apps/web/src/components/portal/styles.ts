import { cn } from "@/utils";

/** Classi comuni del portale clienti (docs/brand/ui.md): focus, pulsanti, campi, link e card. */

/** anello di focus da tastiera per link e pulsanti del portale */
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

/** pulsante principale (uno solo per area) */
export const BTN_PRIMARY = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600 disabled:opacity-60",
  FOCUS,
);

/** pulsante secondario (bordo) */
export const BTN_SECONDARY = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
  FOCUS,
);

/** campo di ricerca/filtro dei form GET del portale */
export const FIELD =
  "h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500";

/** link nel testo */
export const TEXT_LINK = cn("font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300", FOCUS);

/** superficie delle card */
export const CARD = "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3";
