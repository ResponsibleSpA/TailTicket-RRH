import type { ReactNode } from "react";

/**
 * Barra dei pulsanti dei form admin: resta in vista in fondo alla finestra finché il form scorre
 * (sticky), così "Salva" è sempre raggiungibile nei form lunghi; a fine form torna al suo posto.
 */
export default function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-4 z-20 ms-auto flex w-fit max-w-full flex-wrap items-center justify-end gap-2 rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-theme-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
      {children}
    </div>
  );
}
