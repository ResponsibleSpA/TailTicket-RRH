import { Folder } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import { FaqLinkList, KbEmpty, SubcategoryChip } from "@/components/portal/KbParts";
import KbSidebar from "@/components/portal/KbSidebar";
import { CARD, FOCUS } from "@/components/portal/styles";
import { Link } from "@/i18n/navigation";
import { publicCategories, searchFaqs, topicsWithFaqs } from "@/server/domain/client/kb";
import { safeHtml } from "@/server/format/sanitize";
import { cn } from "@/utils";

import { requireKb } from "./guard";

export async function generateMetadata() {
  const t = await getTranslations("portal.kb");
  return { title: t("title") };
}

/** kb/index.php e kb/faq.php?a=search (knowledgebase.inc.php): categorie oppure risultati della ricerca. */
export default async function KbPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; cid?: string; topicId?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireKb(locale);
  const sp = await searchParams;
  const t = await getTranslations("portal.kb");
  const searching = !!(sp.q || sp.cid || sp.topicId);
  const [cats, topics] = await Promise.all([publicCategories(), topicsWithFaqs()]);
  const results = searching ? await searchFaqs({ q: sp.q, categoryId: Number(sp.cid) || undefined, topicId: Number(sp.topicId) || undefined }) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <div className="min-w-0 space-y-5 lg:col-span-2">
        <PageHeader
          title={searching ? t("results") : t("title")}
          subtitle={searching ? (results.length ? t("matched", { count: results.length }) : undefined) : t("subtitle")}
        />
        {searching ? (
          results.length ? (
            <div className={cn(CARD, "px-5 py-2")}>
              <FaqLinkList faqs={results} />
            </div>
          ) : (
            <KbEmpty text={t("noResults")} />
          )
        ) : cats.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {cats.map((c) => (
              <li key={c.id} className={cn(CARD, "flex flex-col p-5")}>
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <Folder aria-hidden="true" className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">
                      <Link href={`/kb/category/${c.id}`} className={cn("text-gray-900 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400", FOCUS)}>
                        {c.name}
                      </Link>
                    </h2>
                    {c.count ? <p className="text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">{t("faqCount", { count: c.count })}</p> : null}
                  </div>
                </div>
                {c.description && (
                  <div
                    className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400"
                    dangerouslySetInnerHTML={{
                      __html: safeHtml(c.description),
                    }}
                  />
                )}
                {c.subcategories.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {c.subcategories.map((s) => (
                      <li key={s.id}>
                        <SubcategoryChip id={s.id} name={s.name} count={s.count} />
                      </li>
                    ))}
                  </ul>
                )}
                {c.faqs.length > 0 && <FaqLinkList faqs={c.faqs} className="mt-2" />}
              </li>
            ))}
          </ul>
        ) : (
          <KbEmpty text={t("none")} />
        )}
      </div>
      <KbSidebar topics={topics} categories={cats.map((c) => ({ id: c.id, name: c.name }))} q={sp.q} />
    </div>
  );
}
