import { Paperclip } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import { KbBreadcrumb } from "@/components/portal/KbParts";
import KbSidebar from "@/components/portal/KbSidebar";
import { RICH_CLASS } from "@/components/portal/rich";
import { CARD, FOCUS } from "@/components/portal/styles";
import Badge from "@/components/ui/badge/Badge";
import { redirect } from "@/i18n/navigation";
import { withBase } from "@/lib/base-path";
import { inlineCidImages } from "@/lib/format/inline-images";
import { humanSize } from "@/lib/format/size";
import { parseId } from "@/lib/route-id";
import { currentClient } from "@/server/auth/client-auth";
import { coreConfig } from "@/server/config/config";
import { db } from "@/server/db";
import { detectDbTimezone } from "@/server/db/time";
import { publicFaq, topicsWithFaqs } from "@/server/domain/client/kb";
import { formatDbDate } from "@/server/format/datetime";
import { safeHtml } from "@/server/format/sanitize";
import { cn } from "@/utils";

import { kbVisible, requireKb } from "../../guard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // titolo dai dati solo se la knowledge base è visibile al visitatore (come la pagina)
  const faqId = parseId(id);
  const faq = faqId && (await kbVisible()) ? await publicFaq(faqId) : null;
  return { title: faq?.question ?? (await getTranslations("portal.kb"))("title") };
}

/** kb/faq.php?id=<id> (faq.inc.php): FAQ pubblicata con allegati e help topic. */
export default async function KbFaqPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireKb(locale);
  const faqId = parseId(id);
  const faq = faqId ? await publicFaq(faqId) : null;
  if (!faq) redirect({ href: "/kb", locale });
  const f = faq!;
  const t = await getTranslations("portal.kb");
  const [cfg, client] = await Promise.all([coreConfig(), currentClient(), detectDbTimezone(db())]);
  const tz = client?.account?.timezone || cfg.str("default_timezone") || "UTC";
  const answer = inlineCidImages(safeHtml(f.answer), "portal");
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <article className="min-w-0 space-y-5 lg:col-span-2">
        <KbBreadcrumb items={[{ href: "/kb", label: t("all") }, { href: `/kb/category/${f.category.id}`, label: f.category.name }]} />
        <PageHeader title={f.question} subtitle={<span className="tabular-nums">{t("updated", { date: formatDbDate(f.updated, tz, locale, "date") })}</span>} />
        <div className={cn(CARD, "p-6 sm:p-8", RICH_CLASS, "text-sm leading-relaxed")} dangerouslySetInnerHTML={{ __html: answer }} />
        {f.attachments.length > 0 && (
          <section>
            <h2 className="mb-2 text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{t("attachments")}</h2>
            <div className="flex flex-wrap gap-2">
              {f.attachments.map((a) => (
                <a
                  key={a.id}
                  href={withBase(`/api/portal/file/${a.key}`)}
                  className={cn(
                    "inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:border-gray-300 hover:text-brand-600 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:text-brand-400",
                    FOCUS,
                  )}
                >
                  <Paperclip aria-hidden="true" className="size-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 font-normal text-gray-400 tabular-nums">{humanSize(a.size)}</span>
                </a>
              ))}
            </div>
          </section>
        )}
        {f.topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
            <span>{t("topics")}:</span>
            {f.topics.map((tp) => (
              <Badge key={tp} size="sm" color="light">
                {tp}
              </Badge>
            ))}
          </div>
        )}
      </article>
      <KbSidebar topics={await topicsWithFaqs(undefined, f.category.id)} />
    </div>
  );
}
