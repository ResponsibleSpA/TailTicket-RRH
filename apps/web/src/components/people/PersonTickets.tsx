import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/badge/Badge";
import { Link } from "@/i18n/navigation";
import { listQueueTickets } from "@/server/domain/queue/engine";
import { adhocQueue } from "@/server/domain/queue/queues";
import type { Criterion } from "@/server/domain/queue/fields";
import type { Agent } from "@/server/domain/staff/staff";
import { formatAgentName, loadTicketRows } from "@/server/domain/ticket/rows";
import { formatDbDate } from "@/server/format/datetime";

import { FilterTabs, NameLink } from "./PeopleLinks";

export type TicketStateFilter = "all" | "open" | "closed";
const FILTERS: TicketStateFilter[] = ["all", "open", "closed"];
const LIMIT = 25;

/**
 * Ticket di un utente o di un'organizzazione dentro la sua scheda: stessa visibilità e ordinamento della
 * lista ticket (coda ad hoc), filtro Tutti/Aperti/Chiusi tramite il parametro `tickets` della pagina.
 */
export default async function PersonTickets({
  agent,
  criterion,
  filter,
  basePath,
  allHref,
  tz,
  locale,
}: {
  agent: Agent;
  /** criterio della coda: utente (`user_id`) o organizzazione (`user__org_id`) */
  criterion: Criterion;
  filter: TicketStateFilter;
  /** pagina della scheda, per i link dei filtri */
  basePath: string;
  /** lista completa nella pagina dei ticket */
  allHref: string;
  tz: string;
  locale: string;
}) {
  const t = await getTranslations("directory");
  const criteria: Criterion[] = [criterion];
  if (filter !== "all") criteria.push(["status__state", "includes", { [filter]: filter }]);
  const result = await listQueueTickets(agent, adhocQueue(agent, criteria, ""), { page: 1, pageSize: LIMIT }, { userTz: tz });
  const rows = await loadTicketRows(result.ids, agent.id);
  const names = new Map<number, string>();
  for (const r of rows) if (r.staff_id && !names.has(r.staff_id)) names.set(r.staff_id, await formatAgentName(r.staff_first, r.staff_last));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <FilterTabs
          size="sm"
          label={t("tickets")}
          items={FILTERS.map((f) => ({ key: f, href: f === "all" ? basePath : `${basePath}?tickets=${f}`, label: t(`ticketsFilter.${f}`), active: f === filter }))}
        />
        <Link href={allHref} className="text-theme-sm font-medium text-brand-600 tabular-nums hover:underline dark:text-brand-400">
          {t("viewAll", { n: result.total ?? rows.length })}
        </Link>
      </header>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((r) => (
            <li key={r.ticket_id} className="flex flex-col gap-1 px-5 py-3 hover:bg-gray-50/70 sm:flex-row sm:items-center sm:gap-4 dark:hover:bg-white/2">
              <span className="flex min-w-0 flex-1 items-baseline gap-3">
                <span className="shrink-0 text-theme-sm text-gray-500 tabular-nums dark:text-gray-400">#{r.number}</span>
                <NameLink href={`/agent/tickets/${r.ticket_id}`} className="min-w-0 truncate text-theme-sm">
                  {r.subject || `#${r.number}`}
                </NameLink>
              </span>
              <span className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
                <Badge size="sm" color={r.status_state === "open" ? "success" : "light"}>
                  {r.status_name}
                </Badge>
                <span>{r.dept_name}</span>
                {r.staff_id ? <span>{names.get(r.staff_id)}</span> : r.team_name ? <span>{r.team_name}</span> : null}
                <time>{formatDbDate(r.lastupdate ?? r.created, tz, locale)}</time>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
