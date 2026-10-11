import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { agentQueueNav } from "@/server/domain/queue/context";
import type { TicketQueue } from "@/server/domain/queue/queues";
import { cn } from "@/utils";

interface QueueTabsProps {
  /** code di primo livello */
  top: TicketQueue[];
  /** sotto-code della coda di primo livello attiva */
  subQueues: TicketQueue[];
  activeTopId: number | null;
  currentQueueId: number;
  /** contatori delle code (assenti se non calcolati) */
  counts: Awaited<ReturnType<typeof agentQueueNav>>["counts"];
}

/** Navigazione tra le code della lista ticket: schede di primo livello e, sotto, le sotto-code. */
export default async function QueueTabs({ top, subQueues, activeTopId, currentQueueId, counts }: QueueTabsProps) {
  const tq = await getTranslations("queues");
  const t = await getTranslations("tickets");
  const queueName = (q: TicketQueue) => (tq.has(q.title) ? tq(q.title) : q.title);
  const count = (q: TicketQueue) => {
    const c = counts.get(q.id);
    return typeof c === "number" ? c : null;
  };
  return (
    <>
      {/* Code di primo livello: schede sottolineate; su mobile scorrono in orizzontale dentro la riga */}
      <nav aria-label={t("queuesNav")} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-gray-200 dark:border-gray-800">
          {top.map((q) => {
            const active = activeTopId === q.id;
            const c = count(q);
            return (
              <Link
                key={q.id}
                href={`/agent/tickets?queue=${q.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap focus-visible:rounded-t-md focus-visible:bg-gray-100 focus-visible:outline-hidden dark:focus-visible:bg-white/5",
                  active
                    ? "border-brand-500 text-gray-900 dark:text-white/90"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200",
                )}
              >
                {queueName(q)}
                {c !== null && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-px text-theme-xs font-medium tabular-nums",
                      active ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
                    )}
                  >
                    {c}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sotto-code: filtri a pillola, attiva con il primario */}
      {subQueues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subQueues.map((q) => {
            const active = q.id === currentQueueId;
            const c = count(q);
            return (
              <Link
                key={q.id}
                href={`/agent/tickets?queue=${q.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-theme-sm font-medium ring-1 ring-inset focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden",
                  active
                    ? "bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/25"
                    : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/3 dark:text-gray-400 dark:ring-gray-800 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                {queueName(q)}
                {c !== null && <span className={cn("tabular-nums", active ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-gray-500")}>{c}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
