import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import Sparkline, { type SparkTone } from "@/components/charts/Sparkline";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

/** Variazione rispetto al periodo precedente: `good` dice se crescere è un bene (chiusi) o è neutro (nuovi). */
export interface KpiDelta {
  current: number;
  previous: number;
  good: "up" | "neutral";
  labels: { up: (pct: number) => string; down: (pct: number) => string; same: string; new: string; hint: string };
}

function DeltaChip({ d }: { d: KpiDelta }) {
  const diff = d.current - d.previous;
  const pct = d.previous ? Math.round((Math.abs(diff) / d.previous) * 100) : null;
  const text = diff === 0 ? d.labels.same : pct === null ? d.labels.new : diff > 0 ? d.labels.up(pct) : d.labels.down(pct);
  const tone =
    diff === 0 || d.good === "neutral"
      ? "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
      : diff > 0
        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
  const Arrow = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span title={d.labels.hint} className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-theme-xs font-medium tabular-nums", tone)}>
      {diff !== 0 && <Arrow className="size-3.5" />}
      {text}
    </span>
  );
}

/** Card di un indicatore della dashboard (docs/brand/ui.md): etichetta, valore, variazione e andamento. */
export default function KpiCard({
  label,
  value,
  icon: Icon,
  href,
  danger,
  foot,
  delta,
  spark,
  locale,
}: {
  label: string;
  value: number;
  locale: string;
  icon: LucideIcon;
  href?: string;
  /** valore da tenere d'occhio (es. scaduti > 0) */
  danger?: boolean;
  foot?: ReactNode;
  delta?: KpiDelta;
  spark?: { data: number[]; tone: SparkTone };
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            danger ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={cn("text-3xl font-semibold tracking-tight tabular-nums", danger ? "text-error-600 dark:text-error-400" : "text-gray-900 dark:text-white/90")}>
          {value.toLocaleString(locale)}
        </p>
        {spark && (
          <div className="w-24 shrink-0 sm:w-28">
            <Sparkline data={spark.data} tone={spark.tone} />
          </div>
        )}
      </div>
      {/* variazione e nota su tutta la larghezza: accanto al mini grafico verrebbero troncate */}
      {(delta || foot) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
          {delta && <DeltaChip d={delta} />}
          {foot && <span>{foot}</span>}
        </div>
      )}
    </>
  );
  const card = "block rounded-2xl border border-gray-200 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-white/3";
  return href ? (
    <Link href={href} className={cn(card, "hover:border-gray-300 dark:hover:border-gray-700")}>
      {body}
    </Link>
  ) : (
    <div className={card}>{body}</div>
  );
}
