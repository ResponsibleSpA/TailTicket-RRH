import { Building2, Inbox, UserCog, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import KpiCard from "@/components/dashboard/KpiCard";
import pkg from "../../../../../package.json";
import { adminSummary } from "@/server/domain/admin/dashboard";
import { knownSchema, VERIFIED_SCHEMAS } from "@/server/system/schema-compat";
import { uiWriteMode } from "@/server/system/write-mode-ui";

import SettingsHub from "./_home/SettingsHub";
import StatusPanel from "./_home/StatusPanel";
import { requireAdmin } from "./guard";
import { adminMetadata } from "./metadata";

export const generateMetadata = adminMetadata("home");

/**
 * Home dell'area admin: stato del sistema (help desk, versioni, schema, modalità di scrittura, controlli),
 * pochi conteggi significativi e le sezioni dell'amministrazione con icona e descrizione.
 */
export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admHome");
  const [s, wm] = await Promise.all([adminSummary(), uiWriteMode()]);
  const c = s.counts;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={s.helpdeskTitle || t("subtitle")} />
      <StatusPanel
        s={{
          online: s.online,
          tailticket: pkg.version,
          osticket: knownSchema(s.schema)?.series ?? "—",
          schema: s.schema,
          schemaVerified: VERIFIED_SCHEMAS.some((v) => v.signature === s.schema),
          mysql: s.mysql,
          node: s.node,
          mode: { configured: wm.configured, effective: wm.effective },
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard label={t("counts.openTickets")} value={c.openTickets} icon={Inbox} href="/agent" locale={locale} foot={t("kpi.openFoot")} />
        <KpiCard
          label={t("counts.activeAgents")}
          value={c.activeAgents}
          icon={UserCog}
          href="/admin/agents"
          locale={locale}
          foot={t("kpi.agentsFoot", { total: c.agents, admins: c.admins })}
        />
        <KpiCard
          label={t("counts.departments")}
          value={c.departments}
          icon={Building2}
          href="/admin/departments"
          locale={locale}
          foot={t("kpi.deptsFoot", { topics: c.topics, teams: c.teams })}
        />
        <KpiCard label={t("counts.users")} value={c.users} icon={Users} locale={locale} foot={t("kpi.usersFoot")} />
      </div>
      <SettingsHub counts={c} locale={locale} />
    </div>
  );
}
