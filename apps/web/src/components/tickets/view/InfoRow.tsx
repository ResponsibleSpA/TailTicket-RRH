import type { ReactNode } from "react";

import { cn } from "@/utils";

/**
 * Riga etichetta/valore delle schede laterali della vista ticket ("—" se il valore è vuoto). Con `truncate`
 * il valore resta su una riga con i puntini e il testo intero nel title (email: niente a capo a metà parola).
 */
export default function InfoRow({ label, children, truncate }: { label: string; children: ReactNode; truncate?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-theme-sm">
      <dt className="shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        title={truncate && typeof children === "string" ? children : undefined}
        className={cn("min-w-0 text-end text-gray-800 tabular-nums dark:text-white/90", truncate ? "truncate" : "break-words")}
      >
        {children || <span className="text-gray-400 dark:text-gray-500">—</span>}
      </dd>
    </div>
  );
}
