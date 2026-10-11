import { Database, Languages, NotebookText, Server, type LucideIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { PageHeader } from "@/components/common/DataTable";
import InfoRow from "@/components/common/InfoRow";
import Badge from "@/components/ui/badge/Badge";
import { db } from "@/server/db";
import { systemInfo } from "@/server/domain/adminsys/system-info";

import { requireAdmin } from "../guard";
import { adminMetadata } from "../metadata";
import DoctorSection, { DoctorCard, doctorT } from "./DoctorSection";

export const generateMetadata = adminMetadata("system");

/** Card informativa con icona nell'intestazione (server, database, lingue, note). */
function InfoCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <h2 className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900 sm:px-6 dark:border-gray-800 dark:text-white/90">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <Icon aria-hidden className="size-4" />
        </span>
        {title}
      </h2>
      <div className="px-5 py-3 sm:px-6">{children}</div>
    </section>
  );
}

/** Informazioni di sistema (include/staff/system.inc.php): PHP sostituito da Node/Next. */
export default async function SystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("asys.system");
  const info = await systemInfo(db());
  const mib = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mono = (v: string) => <code className="font-mono text-theme-xs break-all">{v}</code>;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InfoCard icon={Server} title={t("server")}>
          <dl className="divide-y divide-gray-100 tabular-nums dark:divide-gray-800">
            <InfoRow label={t("osticketVersion")} value={info.osticketVersion ?? "—"} />
            <InfoRow label={t("nextVersion")} value={info.nextVersion ?? "—"} />
            <InfoRow label={t("nodeVersion")} value={info.nodeVersion} />
            <InfoRow label={t("dbVersion")} value={info.dbVersion} />
            <InfoRow label={t("plugins")} value={String(info.plugins)} />
          </dl>
        </InfoCard>
        <InfoCard icon={Database} title={t("database")}>
          <dl className="divide-y divide-gray-100 tabular-nums dark:divide-gray-800">
            <InfoRow label={t("schema")} value={`${info.dbName} (${info.dbHost})`} />
            <InfoRow label={t("prefix")} value={mono(info.tablePrefix)} />
            <InfoRow label={t("signature")} value={info.schemaSignature ? mono(info.schemaSignature) : "—"} />
            <InfoRow label={t("space")} value={`${mib.format(info.spaceUsedMiB)} MiB`} />
            <InfoRow label={t("attachments")} value={`${mib.format(info.attachmentsMiB)} MiB`} />
            <InfoRow
              label={t("timezone")}
              value={info.configuredDbTimezone && info.configuredDbTimezone !== info.dbTimezone ? `${info.dbTimezone} (${t("interpreted", { tz: info.configuredDbTimezone })})` : info.dbTimezone}
            />
          </dl>
        </InfoCard>
        <InfoCard icon={Languages} title={t("languages")}>
          <div className="flex flex-wrap gap-2 py-1.5">
            {(info.languages.length ? info.languages : ["en_US"]).map((l) => (
              <Badge key={l} size="sm" color="light">
                {l}
              </Badge>
            ))}
          </div>
        </InfoCard>
        <InfoCard icon={NotebookText} title={t("notesTitle")}>
          <p className="py-1.5 text-sm text-gray-600 dark:text-gray-400">{t("notes")}</p>
        </InfoCard>
      </div>
      <Suspense
        fallback={
          <DoctorCard locale={locale}>
            <p className="text-sm text-gray-500 dark:text-gray-400">{doctorT(locale)("loading")}</p>
          </DoctorCard>
        }
      >
        <DoctorSection locale={locale} />
      </Suspense>
    </div>
  );
}
