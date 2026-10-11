import type { ReactNode } from "react";

import { cn } from "@/utils";

/**
 * Pulsante compatto delle barre di azioni di massa (utenti, organizzazioni, task): secondario e basso,
 * così la barra resta discreta finché non si seleziona una riga; le azioni distruttive in rosso.
 */
export default function MassButton({ children, onClick, disabled, title, danger }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 items-center rounded-lg bg-white px-3 text-theme-sm font-medium ring-1 ring-gray-200 transition-colors ring-inset dark:bg-white/3 dark:ring-gray-700",
        "hover:bg-gray-50 focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:hover:bg-white/5 dark:disabled:hover:bg-white/3",
        danger ? "text-error-600 dark:text-error-400" : "text-gray-700 dark:text-gray-300",
      )}
    >
      {children}
    </button>
  );
}
