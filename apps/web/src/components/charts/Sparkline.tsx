"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { baseOptions, useChartTokens, type ChartTokens } from "@/lib/charts/theme";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type SparkTone = "primary" | "success" | "error" | "neutral";

const color = (t: ChartTokens, tone: SparkTone) => ({ primary: t.primary, success: t.success, error: t.error, neutral: t.neutral })[tone];

/** Mini grafico a colonne dei KPI (conteggi giornalieri): solo l'andamento, senza assi né tooltip. */
export default function Sparkline({ data, tone = "primary", height = 44 }: { data: number[]; tone?: SparkTone; height?: number }) {
  const t = useChartTokens();
  const options = useMemo<ApexOptions>(() => {
    const base = baseOptions(t);
    return {
      ...base,
      chart: { ...base.chart, type: "bar", sparkline: { enabled: true }, animations: { enabled: false } },
      colors: [color(t, tone)],
      plotOptions: { bar: { columnWidth: "70%", borderRadius: 1 } },
      tooltip: { enabled: false },
      yaxis: { min: 0 },
    };
  }, [t, tone]);
  // con meno di due punti non c'è un andamento da mostrare
  if (data.length < 2) return <div style={{ height }} aria-hidden />;
  return (
    <div aria-hidden className="-mx-1">
      <ReactApexChart key={t.dark ? "dark" : "light"} options={options} series={[{ name: "", data }]} type="bar" height={height} />
    </div>
  );
}
