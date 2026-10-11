"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { baseOptions, useChartTokens, type ChartTokens } from "@/lib/charts/theme";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Tone = "primary" | "success" | "error" | "neutral";
const color = (t: ChartTokens, tone: Tone) => ({ primary: t.primary, success: t.success, error: t.error, neutral: t.neutral })[tone];

/**
 * Barre orizzontali affiancate per categoria (es. ticket aperti e chiusi per reparto): un'etichetta per riga,
 * al massimo due o tre serie con i colori del tema.
 */
export default function BarBreakdown({
  categories,
  series,
}: {
  categories: string[];
  series: { name: string; tone: Tone; data: number[] }[];
}) {
  const t = useChartTokens();
  const options = useMemo<ApexOptions>(() => {
    const base = baseOptions(t);
    return {
      ...base,
      chart: { ...base.chart, type: "bar" },
      colors: series.map((s) => color(t, s.tone)),
      plotOptions: { bar: { horizontal: true, barHeight: "62%", borderRadius: 3, borderRadiusApplication: "end" } },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      grid: { ...base.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      xaxis: {
        categories,
        labels: { formatter: (v: string) => String(Math.round(Number(v))), style: { fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { maxWidth: 140, style: { fontSize: "12px" } } },
      tooltip: { ...base.tooltip, shared: true, intersect: false },
    };
  }, [t, categories, series]);
  // altezza proporzionale alle righe: niente barre giganti con pochi reparti
  const height = Math.max(180, categories.length * 46 + 70);
  return <ReactApexChart key={t.dark ? "dark" : "light"} options={options} series={series.map(({ name, data }) => ({ name, data }))} type="bar" height={height} />;
}
