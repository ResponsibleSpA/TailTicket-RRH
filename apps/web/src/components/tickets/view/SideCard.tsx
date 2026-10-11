import type { ReactNode } from "react";

/**
 * Scheda della colonna laterale della vista ticket: stessa card dell'interfaccia (docs/brand/ui.md) con
 * spaziature più strette di ComponentCard, perché le schede sono tante e una accanto all'altra.
 */
export default function SideCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}
