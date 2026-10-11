import { ArrowDown, ArrowUp, ChevronRight, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { ClientSort } from "@/server/domain/client/tickets";
import { cn } from "@/utils";

import { StatusBadge } from "./PortalUi";
import { CARD, FOCUS } from "./styles";

interface TicketListItem {
  id: number;
  number: string;
  /** data di creazione già formattata */
  date: string;
  isanswered: number;
  statusName: string;
  state: string;
  subject: string;
  dept: string;
}

/** colonne della tabella (ordine di lettura: numero, oggetto, stato, reparto, data) */
const COLS: ClientSort[] = ["id", "subject", "status", "dept", "date"];

/**
 * Elenco dei ticket del cliente: tabella ordinabile da tablet in su, schede su mobile (docs/brand/ui.md:
 * oggetto neutro con hover sul primario, stato come badge tenue, cifre tabulari).
 */
export default function TicketList({ items, sort, order, sortHref }: { items: TicketListItem[]; sort: ClientSort; order: "ASC" | "DESC"; sortHref: (c: ClientSort) => string }) {
  const t = useTranslations("portal.tickets");

  if (!items.length) {
    return (
      <div className={cn(CARD, "flex flex-col items-center px-6 py-14 text-center")}>
        <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
          <Inbox aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white/90">{t("empty")}</p>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("emptyText")}</p>
      </div>
    );
  }

  return (
    <>
      {/* tablet e desktop: tabella */}
      <div className={cn(CARD, "hidden overflow-x-auto md:block")}>
        <table className="min-w-full text-start text-theme-sm">
          <thead className="border-b border-gray-200 text-theme-xs text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
            <tr>
              {COLS.map((c) => (
                <th key={c} scope="col" aria-sort={sort === c ? (order === "DESC" ? "descending" : "ascending") : undefined} className="px-5 py-3 text-start font-medium">
                  <Link href={sortHref(c)} className={cn("inline-flex items-center gap-1 rounded hover:text-gray-800 dark:hover:text-gray-200", FOCUS)}>
                    {t(`col.${c}`)}
                    {sort === c ? order === "DESC" ? <ArrowDown aria-hidden="true" className="size-3.5" /> : <ArrowUp aria-hidden="true" className="size-3.5" /> : null}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <Link
                    href={`/tickets/${r.id}`}
                    className={cn("text-gray-500 tabular-nums hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400", !r.isanswered && "font-medium", FOCUS)}
                  >
                    #{r.number}
                  </Link>
                </td>
                <td className="max-w-md px-5 py-3.5">
                  <Link href={`/tickets/${r.id}`} className={cn("line-clamp-2 font-medium text-gray-900 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400", FOCUS)}>
                    {r.subject}
                  </Link>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <StatusBadge state={r.state}>{r.statusName}</StatusBadge>
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{r.dept}</td>
                <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 tabular-nums dark:text-gray-400">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile: schede */}
      <ul className={cn(CARD, "divide-y divide-gray-100 md:hidden dark:divide-gray-800")}>
        {items.map((r) => (
          <li key={r.id}>
            <Link href={`/tickets/${r.id}`} className={cn("group flex items-center gap-3 px-4 py-4", FOCUS)}>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3 text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
                  <span className={cn(!r.isanswered && "font-medium")}>#{r.number}</span>
                  <span>{r.date}</span>
                </span>
                <span className="mt-1 line-clamp-2 block text-theme-sm font-medium text-gray-900 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                  {r.subject}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                  <StatusBadge state={r.state}>{r.statusName}</StatusBadge>
                  {r.dept && <span className="truncate">{r.dept}</span>}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-gray-400 rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
