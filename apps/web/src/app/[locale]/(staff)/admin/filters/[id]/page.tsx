import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import BackLink from "@/components/adminsys/BackLink";
import SysForm from "@/components/adminsys/SysForm";
import SysNotice from "@/components/adminsys/SysNotice";
import { Notices } from "@/components/admin/Outcome";
import { PageHeader } from "@/components/common/DataTable";
import { redirect } from "@/i18n/navigation";
import { Filter } from "@/lib/osticket/flags";
import { idOrNotFound } from "@/lib/route-id";
import { db } from "@/server/db";
import { filterInfo } from "@/server/domain/adminsys/filter";

import { requireAdmin } from "../../guard";
import { saveFilterAction } from "../actions";
import { FilterFields } from "../form";
import { filterLabels } from "../labels";
import { adminMetadata } from "../../metadata";

export const generateMetadata = adminMetadata("filters");

export default async function EditFilterPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const filterId = idOrNotFound(id);
  const info = await filterInfo(db(), filterId);
  if (!info) notFound();
  // la ban list ha la sua pagina (scp/filters.php → banlist.php)
  if (info.filter.name.toLowerCase() === "system ban list") redirect({ href: "/admin/banlist", locale });
  const t = await getTranslations("asys.filters");
  const c = await getTranslations("asys.common");
  const sp = await searchParams;
  const flags = info.filter.flags ?? 0;
  return (
    <div className="space-y-6">
      <PageHeader title={info.filter.name} subtitle={t("edit")} actions={<BackLink href="/admin/filters" label={c("back")} />} />
      <SysNotice sp={sp} />
      {/* avvisi sul filtro (oggetti eliminati o disattivati): un solo riquadro */}
      <Notices
        items={[
          ...(flags & Filter.DELETED_OBJECT ? [{ key: "deleted", tone: "warning" as const, content: t("flags.deleted") }] : []),
          ...(flags & Filter.INACTIVE_DEPT ? [{ key: "dept", tone: "warning" as const, content: t("flags.dept") }] : []),
          ...(flags & Filter.INACTIVE_HT ? [{ key: "topic", tone: "warning" as const, content: t("flags.topic") }] : []),
        ]}
      />
      <SysForm action={saveFilterAction.bind(null, filterId)} labels={await filterLabels()}>
        <FilterFields info={info} />
      </SysForm>
    </div>
  );
}
