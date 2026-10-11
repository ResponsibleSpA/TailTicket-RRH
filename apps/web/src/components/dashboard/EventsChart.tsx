"use client";

import type { ApexOptions } from "apexcharts";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { baseOptions, useChartTokens, type ChartTokens } from "@/lib/charts/theme";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/** Giorno yyyy-mm-dd come istante UTC: le etichette si formattano in UTC, senza slittamenti di fuso. */
const dayMs = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Serie visibili all'apertura (docs/brand/ui.md: al massimo poche serie); le altre si attivano dalla legenda. */
const VISIBLE = new Set(["created", "closed"]);

/** Colore per tipo di evento: stati con il colore semantico, il resto neutro (tutte nascoste all'apertura). */
function seriesColor(t: ChartTokens, key: string): string {
  switch (key) {
    case "created":
      return t.primary;
    case "closed":
      return t.success;
    case "overdue":
      return t.error;
    case "reopened":
      return t.warning;
    case "assigned":
      return t.primarySoft;
    default:
      return t.neutral;
  }
}

/**
 * Eventi per giorno (OverviewReport::getPlotData) come colonne affiancate: i conteggi giornalieri sono
 * interi e spesso piccoli, una curva suggerirebbe valori intermedi che non esistono. Creati e chiusi in
 * evidenza, gli altri eventi dalla legenda.
 */
export default function EventsChart({ days, series }: { days: string[]; series: { key: string; name: string; data: number[] }[] }) {
  const locale = useLocale();
  const t = useChartTokens();

  const options = useMemo<ApexOptions>(() => {
    const short = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
    const label = (v: string | number | undefined) => {
      const d = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? dayMs(v) : NaN;
      return Number.isNaN(d) ? String(v ?? "") : short.format(d).replace(/\.$/, "");
    };
    const ticks = (n: number) => Math.max(1, Math.min(days.length - 1, n));
    const base = baseOptions(t);
    return {
      ...base,
      chart: { ...base.chart, type: "bar" },
      colors: series.map((s) => seriesColor(t, s.key)),
      plotOptions: { bar: { columnWidth: days.length > 45 ? "85%" : "62%", borderRadius: 2, borderRadiusApplication: "end" } },
      stroke: { show: true, width: 1, colors: ["transparent"] },
      xaxis: {
        categories: days,
        type: "category",
        tickAmount: ticks(7),
        tickPlacement: "on",
        labels: { rotate: 0, hideOverlappingLabels: true, trim: false, formatter: label, style: { fontSize: "11px" } },
        axisTicks: { show: false },
        axisBorder: { show: false },
        tooltip: { enabled: false },
        crosshairs: { fill: { type: "solid", color: t.dark ? "rgba(255,255,255,0.04)" : "rgba(16,24,40,0.04)" } },
      },
      yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)), style: { fontSize: "11px" } } },
      tooltip: {
        ...base.tooltip,
        shared: true,
        intersect: false,
        x: {
          formatter: (_v: number, o?: { dataPointIndex?: number }) => {
            const d = days[o?.dataPointIndex ?? -1];
            return d ? long.format(dayMs(d)) : "";
          },
        },
      },
      // Telefono: meno etichette sull'asse X, così restano leggibili senza sovrapporsi
      responsive: [{ breakpoint: 640, options: { xaxis: { tickAmount: ticks(4) } } }],
    };
  }, [days, series, locale, t]);

  // se nel periodo non ci sono né creati né chiusi, si mostrano tutte le serie
  const anyVisible = series.some((s) => VISIBLE.has(s.key));
  const data = series.map((s) => ({ name: s.name, data: s.data, hidden: anyVisible && !VISIBLE.has(s.key) }));
  return <ReactApexChart key={t.dark ? "dark" : "light"} options={options} series={data} type="bar" height={300} />;
}
