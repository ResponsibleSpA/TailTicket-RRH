import { getLocale, getTranslations } from "next-intl/server";

import DatePicker from "@/components/form/date-picker";
import { ChevronDown } from "lucide-react";

interface StatsFilterProps {
  /** primo giorno del periodo (yyyy-mm-dd) */
  start: string;
  period: string;
  periods: readonly string[];
  group: string;
  /** "Dal … al … incluso (fuso …)" */
  rangeText: string;
}

/** Filtro del periodo della dashboard (data di inizio + durata) come il form di scp/dashboard.php; invio in GET. */
export default async function StatsFilter({ start, period, periods, group, rangeText }: StatsFilterProps) {
  const t = await getTranslations("dashboard");
  const ts = await getTranslations("stats");
  const locale = await getLocale();
  return (
    <div className="space-y-1.5">
      <form action="/agent" className="flex flex-wrap items-center gap-2 text-sm">
        <label className="w-full xsm:w-44">
          <span className="sr-only">{t("from")}</span>
          <DatePicker id="stats-start" name="start" defaultDate={start} locale={locale} placeholder={ts("datePlaceholder")} />
        </label>
        <label className="relative w-full xsm:w-44">
          <span className="sr-only">{t("period")}</span>
          <select
            name="period"
            defaultValue={period}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            {periods.map((p) => (
              <option key={p} value={p} className="dark:bg-gray-900">
                {t(`periods.${p.replace(/[+ ]/g, "")}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        </label>
        <input type="hidden" name="group" value={group} />
        <button
          type="submit"
          className="h-11 rounded-lg border border-gray-300 bg-white px-4 font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {t("refresh")}
        </button>
      </form>
      <p className="text-theme-xs text-gray-500 dark:text-gray-400">{rangeText}</p>
    </div>
  );
}
