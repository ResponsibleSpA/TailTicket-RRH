import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { createTranslator } from "next-intl";
import type { ReactNode } from "react";

import Outcome from "@/components/admin/Outcome";
import Summary from "@/components/admin/Summary";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import doctorEn from "@/messages/doctor/en.json";
import doctorIt from "@/messages/doctor/it.json";
import { runDoctor } from "@/server/system/doctor";
import { sortChecks } from "@/server/system/doctor/format";
import { errorText, isWritable, type DoctorCheck, type DoctorLevel } from "@/server/system/doctor/types";
import { cn } from "@/utils";

/**
 * Sezione "Collegamento a osTicket": risultati del doctor (src/server/system/doctor) raggruppati per
 * livello. Il doctor verifica anche la connessione SMTP (timeout di pochi secondi): la sezione arriva
 * in streaming per non rallentare il resto della pagina. I testi dei controlli sono in italiano e non
 * contengono segreti. Messaggi dell'interfaccia in src/messages/doctor/<locale>.json, caricati qui.
 */
const LEVELS: readonly DoctorLevel[] = ["block", "warn", "info", "ok"];
const LEVEL: Record<DoctorLevel, { badge: "error" | "warning" | "info" | "success"; icon: LucideIcon; tint: string }> = {
  block: { badge: "error", icon: CircleAlert, tint: "text-error-500 dark:text-error-400" },
  warn: { badge: "warning", icon: TriangleAlert, tint: "text-warning-500 dark:text-warning-400" },
  info: { badge: "info", icon: Info, tint: "text-blue-light-500 dark:text-blue-light-400" },
  ok: { badge: "success", icon: CircleCheck, tint: "text-success-500 dark:text-success-400" },
};

export function doctorT(locale: string) {
  return createTranslator({
    locale,
    messages: locale === "en" ? doctorEn : doctorIt,
    namespace: "doctor",
  });
}

export function DoctorCard({ locale, children }: { locale: string; children: ReactNode }) {
  const t = doctorT(locale);
  return (
    <ComponentCard title={t("title")} desc={t("desc")}>
      {children}
    </ComponentCard>
  );
}

/** Un controllo: icona del livello, titolo, esito e, se c'è, cosa fare in un riquadro a parte. */
function CheckRow({ c, hintLabel }: { c: DoctorCheck; hintLabel: string }) {
  const { icon: Icon, tint } = LEVEL[c.level];
  return (
    <li className="flex gap-3 p-4 text-sm">
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", tint)} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white/90">{c.title}</p>
        <p className="mt-1 break-words text-gray-600 dark:text-gray-400">{c.detail}</p>
        {c.hint && (
          <div className="mt-2.5 rounded-lg bg-gray-50 px-3 py-2 text-theme-sm text-gray-600 dark:bg-white/3 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-200">{hintLabel}: </span>
            <span className="break-words whitespace-pre-wrap">{c.hint}</span>
          </div>
        )}
      </div>
    </li>
  );
}

export default async function DoctorSection({ locale }: { locale: string }) {
  const t = doctorT(locale);
  let report;
  try {
    report = await runDoctor();
  } catch (ex) {
    return (
      <DoctorCard locale={locale}>
        <Outcome tone="error" role="alert">
          {t("error", { message: errorText(ex) })}
        </Outcome>
      </DoctorCard>
    );
  }
  const checks = sortChecks(report.checks);
  const ok = isWritable(report);
  return (
    <DoctorCard locale={locale}>
      <Outcome tone={ok ? "success" : "error"} role="status" title={ok ? t("writable") : t("blocked", { count: report.summary.block })}>
        <p className="tabular-nums">{t("summary", report.summary)}</p>
      </Outcome>
      {LEVELS.map((level) => {
        const group = checks.filter((c) => c.level === level);
        if (!group.length) return null;
        const heading = (
          <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
            <Badge size="sm" color={LEVEL[level].badge}>
              {t(`levels.${level}`)}
            </Badge>
            <span className="text-gray-500 tabular-nums dark:text-gray-400">{group.length}</span>
          </span>
        );
        const list = (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {group.map((c) => (
              <CheckRow key={c.id} c={c} hintLabel={t("hint")} />
            ))}
          </ul>
        );
        // i controlli superati restano chiusi: in evidenza solo ciò che richiede attenzione
        if (level === "ok")
          return (
            <details key={level} className="group">
              <Summary className="py-1">{heading}</Summary>
              <div className="mt-3">{list}</div>
            </details>
          );
        return (
          <section key={level} aria-labelledby={`doctor-${level}`} className="space-y-3">
            <h4 id={`doctor-${level}`}>{heading}</h4>
            {list}
          </section>
        );
      })}
      <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
        <h4 className="mb-3 text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">{t("legendTitle")}</h4>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {LEVELS.map((level) => {
            const Icon = LEVEL[level].icon;
            return (
              <div key={level} className="flex items-start gap-2">
                <dt className="flex shrink-0 items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                  <Icon aria-hidden className={cn("size-4", LEVEL[level].tint)} />
                  {t(`levels.${level}`)}
                </dt>
                <dd className="text-gray-500 dark:text-gray-400">{t(`legend.${level}`)}</dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">{t("contentNote")}</p>
      </div>
    </DoctorCard>
  );
}
