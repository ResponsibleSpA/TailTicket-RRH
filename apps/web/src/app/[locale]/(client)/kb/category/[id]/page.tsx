import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import { FaqLinkList, KbBreadcrumb, KbEmpty, SubcategoryChip } from "@/components/portal/KbParts";
import KbSidebar from "@/components/portal/KbSidebar";
import { Panel } from "@/components/portal/PortalUi";
import { redirect } from "@/i18n/navigation";
import { parseId } from "@/lib/route-id";
import { publicCategory } from "@/server/domain/client/kb";
import { safeHtml } from "@/server/format/sanitize";

import { kbVisible, requireKb } from "../../guard";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // titolo dai dati solo se la knowledge base è visibile al visitatore (come la pagina)
  const catId = parseId(id);
  const cat = catId && (await kbVisible()) ? await publicCategory(catId) : null;
  return { title: cat?.name ?? (await getTranslations("portal.kb"))("title") };
}

/** kb/faq.php?cid=<id> (faq-category.inc.php): categoria pubblica, sottocategorie e FAQ. */
export default async function KbCategoryPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireKb(locale);
  const catId = parseId(id);
  const cat = catId ? await publicCategory(catId) : null;
  if (!cat) redirect({ href: "/kb", locale });
  const c = cat!;
  const t = await getTranslations("portal.kb");
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <div className="min-w-0 space-y-5 lg:col-span-2">
        <KbBreadcrumb items={[{ href: "/kb", label: t("all") }, ...(c.parent ? [{ href: `/kb/category/${c.parent.id}`, label: c.parent.name }] : []), { label: c.name }]} />
        <PageHeader title={c.name} />
        {c.description && <div className="text-theme-sm text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: safeHtml(c.description) }} />}
        {c.subcategories.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {c.subcategories.map((s) => (
              <li key={s.id}>
                <SubcategoryChip id={s.id} name={s.name} count={s.count} />
              </li>
            ))}
          </ul>
        )}
        {c.faqs.length ? (
          <Panel title={t("faqs")} className="pb-2 sm:pb-3">
            <FaqLinkList faqs={c.faqs} className="-mt-2" />
          </Panel>
        ) : (
          !c.subcategories.length && <KbEmpty text={t("emptyCategory")} />
        )}
      </div>
      <KbSidebar topics={c.topics} />
    </div>
  );
}
