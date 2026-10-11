import { Plus, Search, X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import TicketList from "@/components/portal/TicketList";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, FOCUS } from "@/components/portal/styles";
import Alert from "@/components/ui/alert/Alert";
import { Link, redirect } from "@/i18n/navigation";
import { withBase } from "@/lib/base-path";
import { coreConfig } from "@/server/config/config";
import { clientTicketStats, listClientTickets, type ClientSort } from "@/server/domain/client/tickets";
import { formatDbDate } from "@/server/format/datetime";
import { cn } from "@/utils";

import { requireClient } from "../guard";

export async function generateMetadata() {
  const t = await getTranslations("portal.tickets");
  return { title: t("title") };
}

const SORTS: ClientSort[] = ["id", "date", "status", "subject", "dept"];

/**
 * tickets.php (include/client/tickets.inc.php): ticket propri, da collaboratore e dell'organizzazione
 * se condivisa; filtro aperti/chiusi, help topic, ricerca e ordinamento. Senza ticket si passa
 * all'apertura di un nuovo ticket, come il PHP.
 */
export default async function ClientTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    topic?: string;
    q?: string;
    sort?: string;
    order?: string;
    p?: string;
    profile?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const client = await requireClient(locale, "/tickets");
  if (client.guest) redirect({ href: `/tickets/${client.guest.ticketId}`, locale });
  const t = await getTranslations("portal.tickets");
  const ta = await getTranslations("portal.account");
  const cfg = await coreConfig();
  const stats = await clientTicketStats(cfg, client);
  // senza ticket si va all'apertura, portando con sé l'esito del salvataggio del profilo
  if (!stats.open && !stats.closed) redirect({ href: sp.profile ? "/open?profile=1" : "/open", locale });
  const status = sp.status === "closed" ? "closed" : "open";
  const sort = SORTS.includes(sp.sort as ClientSort) ? (sp.sort as ClientSort) : "date";
  const order = sp.order === "ASC" ? "ASC" : "DESC";
  const topicId = Number(sp.topic) || undefined;
  const page = Math.max(1, Number(sp.p) || 1);
  const list = await listClientTickets(cfg, client, { status, topicId, keywords: sp.q, sort, order, page });
  const tz = client.account?.timezone || cfg.str("default_timezone") || "UTC";
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | number | undefined> = { status, topic: topicId, q: sp.q, sort, order, ...over };
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "") p.set(k, String(v));
    return `/tickets?${p.toString()}`;
  };

  const canOpen = cfg.str("client_registration") !== "disabled" || !cfg.bool("clients_only");
  const filtered = !!(sp.q || topicId || sp.sort);

  return (
    <div className="space-y-6">
      {/* esito del salvataggio del profilo (profileAction → ?profile=1) */}
      {sp.profile && (
        <div>
          <Alert variant="success" title={ta("profileSaved")} message="" />
        </div>
      )}
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          canOpen && (
            <Link href="/open" className={BTN_PRIMARY}>
              <Plus aria-hidden="true" className="size-4" />
              {t("new")}
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* aperti/chiusi: controllo segmentato, il primario solo sulla voce attiva */}
        <nav aria-label={t("filter")} className="inline-flex shrink-0 self-start rounded-lg bg-gray-100 p-1 dark:bg-white/5">
          {(["open", "closed"] as const).map((s) => (
            <Link
              key={s}
              href={qs({ status: s, p: undefined })}
              aria-current={status === s ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-theme-sm font-medium transition-colors",
                FOCUS,
                status === s ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
              )}
            >
              {t(s)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-theme-xs tabular-nums",
                  status === s ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-gray-200/70 text-gray-600 dark:bg-white/5 dark:text-gray-400",
                )}
              >
                {s === "open" ? stats.open : stats.closed}
              </span>
            </Link>
          ))}
        </nav>

        <form action={withBase("/tickets")} method="get" className="flex flex-1 flex-col gap-3 sm:flex-row" role="search">
          <input type="hidden" name="status" value={status} />
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={t("search")} aria-label={t("search")} className={cn(FIELD, "w-full ps-10")} />
          </div>
          <select name="topic" defaultValue={topicId ?? ""} aria-label={t("topic")} className={cn(FIELD, "sm:max-w-60")}>
            <option value="">{t("allTopics")}</option>
            {stats.topics.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.name} ({tp.count})
              </option>
            ))}
          </select>
          <button type="submit" className={BTN_SECONDARY}>
            {t("go")}
          </button>
        </form>
      </div>
      {filtered && (
        <Link href="/tickets" className={cn("-mt-3 inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white", FOCUS)}>
          <X aria-hidden="true" className="size-3.5" />
          {t("clear")}
        </Link>
      )}

      <TicketList
        items={list.items.map((r) => ({ ...r, date: formatDbDate(r.created, tz, locale, "short") }))}
        sort={sort}
        order={order}
        sortHref={(c) => qs({ sort: c, order: sort === c && order === "DESC" ? "ASC" : "DESC", p: undefined })}
      />

      {pages > 1 && (
        <nav className="flex flex-wrap justify-center gap-1" aria-label={t("pages")}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={qs({ p: n })}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "min-w-9 rounded-lg px-3 py-1.5 text-center text-theme-sm font-medium tabular-nums",
                FOCUS,
                n === page ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
              )}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
