import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

/**
 * Link delle liste people (utenti, organizzazioni, task, ticket di una scheda): testo neutro con il primario
 * solo al passaggio del mouse, come gli oggetti della lista ticket (docs/brand/ui.md).
 */
export function NameLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("font-medium text-gray-900 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400", className)}>
      {children}
    </Link>
  );
}

/** Link secondario (organizzazione, contatori, numero del ticket): grigio, sottolineato al passaggio del mouse. */
export function QuietLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("text-gray-700 tabular-nums decoration-gray-300 underline-offset-2 hover:text-brand-600 hover:underline dark:text-gray-300 dark:hover:text-brand-400", className)}
    >
      {children}
    </Link>
  );
}

/** Schede a pillola (code dei task, filtro Tutti/Aperti/Chiusi): attiva tenue col primario, contatore facoltativo. */
export function FilterTabs({ items, label, size = "md" }: { items: { key: string; href: string; label: ReactNode; count?: number; active: boolean }[]; label?: string; size?: "sm" | "md" }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden",
            size === "sm" ? "px-2.5 py-1.5 text-theme-sm" : "px-3 py-2 text-sm",
            i.active
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90",
          )}
        >
          {i.label}
          {i.count !== undefined && (
            <span
              className={cn(
                "rounded-md px-1.5 text-theme-xs tabular-nums",
                i.active ? "bg-brand-100/70 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
              )}
            >
              {i.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Link con l'aspetto di un pulsante nell'intestazione delle schede: uno solo primario, gli altri secondari. */
export function ActionLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-theme-xs transition-colors focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden",
        primary
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "bg-white text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-white/3 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5",
      )}
    >
      {children}
    </Link>
  );
}
