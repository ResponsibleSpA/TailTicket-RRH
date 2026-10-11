import { getTranslations } from "next-intl/server";

import { menuButtonClass } from "@/components/common/menu-classes";
import type { queueSorts } from "@/server/domain/queue/columns";
import type { TicketQueue } from "@/server/domain/queue/queues";

interface TicketListHeaderProps {
  queue: TicketQueue;
  /** ricerca rapida corrente ("" se si naviga una coda) */
  query: string;
  /** totale della lista (null se non noto) */
  totalNum: number | null;
  sorts: Awaited<ReturnType<typeof queueSorts>>;
  /** ordinamento richiesto (?sort) */
  sort?: string;
}

/** Titolo della lista (coda o ricerca, con il totale) e scelta dell'ordinamento della coda. */
export default async function TicketListHeader({ queue, query, totalNum, sorts, sort }: TicketListHeaderProps) {
  const t = await getTranslations("tickets");
  const tq = await getTranslations("queues");
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <h2 className="flex min-w-0 items-center gap-2.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">
        <span className="min-w-0 break-words">{query ? t("searchResults", { query }) : queue.id ? (tq.has(queue.title) ? tq(queue.title) : queue.title) : queue.title}</span>
        {totalNum !== null && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-sm font-medium tracking-normal text-gray-600 tabular-nums dark:bg-white/5 dark:text-gray-400">
            {totalNum}
          </span>
        )}
      </h2>
      {sorts.length > 0 && (
        // Su mobile l'etichetta sta sopra e la select prende tutta la riga accanto ad "Applica"
        <form action="/agent/tickets" className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5 text-sm sm:w-auto sm:flex-nowrap">
          {query ? <input type="hidden" name="q" value={query} /> : <input type="hidden" name="queue" value={queue.id} />}
          <label htmlFor="sort" className="w-full text-theme-sm text-gray-500 sm:w-auto sm:whitespace-nowrap dark:text-gray-400">
            {t("sortBy")}
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort?.startsWith("qs-") ? sort : `qs-${queue.defaultSortId() ?? ""}`}
            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden sm:flex-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-brand-800"
          >
            {sorts.map((s) => (
              <option key={s.id} value={`qs-${s.id}`}>
                {tq.has(s.name) ? tq(s.name) : s.name}
              </option>
            ))}
          </select>
          <button type="submit" className={menuButtonClass}>
            {t("apply")}
          </button>
        </form>
      )}
    </div>
  );
}
