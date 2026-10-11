import { ArrowRight, BookOpen, ChevronRight, Inbox, LifeBuoy, type LucideIcon, Search, SquarePen, Ticket } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RICH_CLASS } from "@/components/portal/rich";
import { BTN_SECONDARY, CARD, FIELD, FOCUS } from "@/components/portal/styles";
import { Link } from "@/i18n/navigation";
import { withBase } from "@/lib/base-path";
import { coreConfig } from "@/server/config/config";
import { contentPage, featuredCategories, kbEnabled } from "@/server/domain/client/kb";
import { safeHtml } from "@/server/format/sanitize";
import { cn } from "@/utils";

import { portalVisitor } from "./guard";

export async function generateMetadata() {
  const t = await getTranslations("portal.home");
  return { title: t("title") };
}

/** Scorciatoia della home: icona, titolo, descrizione e freccia; `main` evidenzia l'azione principale. */
function ActionCard({ href, icon: Icon, title, text, main }: { href: string; icon: LucideIcon; title: string; text: string; main?: boolean }) {
  return (
    <Link href={href} className={cn(CARD, "group flex items-start gap-4 p-5 transition-colors hover:border-gray-300 dark:hover:border-gray-700", FOCUS)}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          main ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">{title}</span>
        <span className="mt-1 block text-theme-sm text-gray-500 dark:text-gray-400">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

/**
 * Home del portale clienti (index.php): pagina "landing" configurata (landing_page_id) o messaggio di
 * benvenuto con la ricerca nella knowledge base, scorciatoie (apri ticket, i miei ticket o verifica dello
 * stato, knowledge base) e articoli in evidenza.
 */
export default async function PortalHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portal.home");
  const [cfg, client] = await Promise.all([coreConfig(), portalVisitor(locale)]);
  const kb = await kbEnabled(cfg, client);
  const landing = await contentPage(cfg.int("landing_page_id"));
  const featured = kb ? await featuredCategories() : [];
  const canOpen = cfg.str("client_registration") !== "disabled" || !cfg.bool("clients_only");

  const actions: { key: string; href: string; icon: LucideIcon; title: string; text: string; main?: boolean }[] = [];
  if (canOpen) actions.push({ key: "open", href: "/open", icon: SquarePen, title: t("openTitle"), text: t("openText"), main: true });
  if (client) actions.push({ key: "tickets", href: client.guest ? `/tickets/${client.guest.ticketId}` : "/tickets", icon: Inbox, title: t("ticketsTitle"), text: t("ticketsText") });
  else actions.push({ key: "status", href: "/login#access", icon: Ticket, title: t("statusTitle"), text: t("statusText") });
  if (kb) actions.push({ key: "kb", href: "/kb", icon: BookOpen, title: t("kbTitle"), text: t("kbText") });

  return (
    <div className="space-y-8">
      {/* benvenuto: il testo resta quello configurato in osTicket (pagina landing) */}
      <section className={cn(CARD, "relative overflow-hidden")}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <p className="mb-4 inline-flex items-center gap-2 text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            <LifeBuoy aria-hidden="true" className="size-4 text-brand-500" />
            {t("title")}
          </p>
          <div className="max-w-3xl">
            {landing ? (
              <div
                className={cn(RICH_CLASS, "text-base sm:[&_p]:text-base [&_h1]:text-2xl [&_h1]:tracking-tight sm:[&_h1]:text-3xl [&_p:last-child]:mb-0 [&_p]:leading-relaxed")}
                dangerouslySetInnerHTML={{ __html: safeHtml(landing.body) }}
              />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white/90">{t("welcome")}</h1>
            )}
          </div>
          {kb && (
            <form action={withBase("/kb")} method="get" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" role="search">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input type="search" name="q" placeholder={t("kbSearch")} aria-label={t("kbSearch")} className={cn(FIELD, "w-full ps-10")} />
              </div>
              <button type="submit" className={BTN_SECONDARY}>
                {t("search")}
              </button>
            </form>
          )}
        </div>
      </section>

      <section aria-label={t("actions")} className={cn("grid gap-4", actions.length >= 3 ? "md:grid-cols-3" : "sm:grid-cols-2")}>
        {actions.map(({ key, ...a }) => (
          <ActionCard key={key} {...a} />
        ))}
      </section>

      {featured.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">{t("featured")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((c) => (
              <div key={c.id} className={cn(CARD, "p-5")}>
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white/90">
                  <BookOpen aria-hidden="true" className="size-4 text-gray-400" />
                  {c.name}
                </h3>
                <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                  {c.faqs.map((f) => (
                    <li key={f.id}>
                      <Link href={`/kb/faq/${f.id}`} className={cn("group flex items-start gap-3 py-3", FOCUS)}>
                        <span className="min-w-0 flex-1">
                          <span className="block text-theme-sm font-medium text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">{f.question}</span>
                          {f.teaser && <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{f.teaser}</span>}
                        </span>
                        <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-400 rtl:rotate-180" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
