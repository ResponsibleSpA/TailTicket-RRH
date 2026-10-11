import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import Badge from "@/components/ui/badge/Badge";
import { cn } from "@/utils";

import { CARD } from "./styles";

/** Mattoni comuni delle pagine del portale clienti: card con intestazione, badge dello stato, avatar, righe etichetta/valore. */

/**
 * Card con intestazione: titolo `text-base font-semibold`, descrizione grigia e, a scelta, il numero del
 * passo (form a sezioni) o un'icona.
 */
export function Panel({
  title,
  description,
  step,
  icon: Icon,
  actions,
  children,
  className,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  step?: number;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  const head = title || description;
  return (
    <Tag className={cn(CARD, "p-5 sm:p-6", className)}>
      {head && (
        <div className={cn("flex gap-3", description ? "items-start" : "items-center", children ? "mb-5" : undefined)}>
          {step !== undefined && (
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-theme-xs font-semibold text-gray-700 tabular-nums dark:bg-white/5 dark:text-gray-300"
            >
              {step}
            </span>
          )}
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <Icon aria-hidden="true" className="size-4.5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Tag>
  );
}

/** Stato del ticket: blu tenue se aperto, verde se chiuso (stati reali), neutro per gli altri. */
export function StatusBadge({ state, children }: { state: string; children: ReactNode }) {
  return (
    <Badge size="sm" color={state === "open" ? "info" : state === "closed" ? "success" : "light"}>
      {children}
    </Badge>
  );
}

/** Iniziali di un nome per l'avatar (massimo due lettere). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase();
}

/** Avatar con le iniziali: neutro per il cliente, tinta del primario per lo staff. */
export function Avatar({ name, staff, className }: { name: string; staff?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-theme-xs font-semibold",
        staff ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Riga etichetta/valore di una lista di dettagli (dl); senza valore mostra "—". */
export function InfoItem({ label, children }: { label: ReactNode; children?: ReactNode }) {
  const empty = children === undefined || children === null || (typeof children === "string" && !children.trim());
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-theme-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={cn("min-w-0 text-end text-theme-sm break-words", empty ? "text-gray-400 dark:text-gray-500" : "font-medium text-gray-800 dark:text-white/90")}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}

/** Lista di dettagli con separatori sottili. */
export function InfoList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-gray-100 dark:divide-gray-800">{children}</dl>;
}
