"use client";

import { Inbox, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import type { ThemeSettings } from "@/lib/theme/schema";
import { cn } from "@/utils";

/** andamento d'esempio del mini grafico (altezze in %) */
const BARS = [38, 52, 44, 66, 58, 74, 90];

/** Barra laterale in miniatura con lo stile scelto (chiara, scura o colore del marchio, come AppSidebar). */
function MiniSidebar({ style, appName }: { style: ThemeSettings["sidebar_style"]; appName: string }) {
  const dark = style !== "light";
  return (
    <div
      className={cn("flex w-[30%] shrink-0 flex-col gap-1.5 border-e p-2.5", style === "light" && "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900", style === "dark" && "border-gray-800 bg-gray-900")}
      style={style === "brand" ? { backgroundColor: "var(--color-brand-950)", borderColor: "var(--color-brand-900)" } : undefined}
    >
      <p className={cn("mb-1 truncate text-[11px] font-semibold", dark ? "text-white" : "text-gray-900 dark:text-white")}>{appName}</p>
      <span className={cn("flex h-5 items-center rounded-md px-1.5", dark ? "bg-white/10" : "bg-brand-50 dark:bg-brand-500/15")}>
        <span className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-white/80" : "bg-brand-500")} />
      </span>
      {[60, 45, 70, 50].map((w) => (
        <span key={w} className="flex h-5 items-center px-1.5">
          <span className={cn("h-1.5 rounded-full", dark ? "bg-white/25" : "bg-gray-200 dark:bg-gray-700")} style={{ width: `${w}%` }} />
        </span>
      ))}
    </div>
  );
}

/**
 * Anteprima dal vivo: una piccola schermata dell'interfaccia (barra laterale, indicatore con grafico,
 * riga di ticket) e gli elementi di base, con il tema in modifica già applicato alla pagina.
 */
export default function PreviewCard({ settings, appName }: { settings: ThemeSettings; appName: string }) {
  const t = useTranslations("admin.theme");
  const x = useTranslations("admTheme");
  return (
    <ComponentCard title={t("preview")} desc={x("previewDesc")}>
      <div aria-hidden className="flex h-60 overflow-hidden rounded-xl border border-gray-200 text-start dark:border-gray-800">
        <MiniSidebar style={settings.sidebar_style} appName={appName} />
        <div className="min-w-0 flex-1 space-y-2.5 bg-gray-50 p-2.5 dark:bg-gray-950">
          <div className="flex h-6 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-gray-400 dark:border-gray-800 dark:bg-white/3">
            <Search className="size-3" />
            <span className="h-1.5 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-white/3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{x("kpi")}</p>
              <Inbox className="size-3 text-gray-400" />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-lg leading-none font-semibold text-gray-900 tabular-nums dark:text-white/90">53</p>
              <div className="flex h-8 items-end gap-0.5">
                {BARS.map((h, i) => (
                  <span key={i} className={cn("w-1.5 rounded-sm", i === BARS.length - 1 ? "bg-brand-500" : "bg-brand-200 dark:bg-brand-500/30")} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-white/3">
            <p className="truncate text-[11px] font-medium text-gray-900 dark:text-white/90">{t("sample.subject")}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded bg-success-50 px-1 text-[9px] font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">{t("sample.open")}</span>
              <span className="truncate text-[9px] text-gray-500 dark:text-gray-400">{t("sample.meta")}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full w-2/3 rounded-full bg-brand-500" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-md bg-brand-500 px-2 py-1 text-[10px] font-medium text-white">{t("sample.primary")}</span>
            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-700 ring-1 ring-gray-300 ring-inset dark:bg-white/3 dark:text-gray-300 dark:ring-gray-700">
              {t("sample.secondary")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" color="primary">
          {t("sample.badge")}
        </Badge>
        <Badge size="sm" color="success">
          {t("sample.open")}
        </Badge>
        <Badge size="sm" color="warning">
          {t("sample.overdue")}
        </Badge>
      </div>
    </ComponentCard>
  );
}
