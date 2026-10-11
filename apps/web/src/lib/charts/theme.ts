"use client";

import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Tema comune dei grafici (docs/brand/ui.md): colori letti dai token CSS del tema, così seguono il primario
 * scelto in admin (Tema) e la modalità scura; font, griglia, tooltip e assi uguali in tutta l'interfaccia.
 */
export interface ChartTokens {
  dark: boolean;
  primary: string;
  primarySoft: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  grid: string;
  surface: string;
}

const FALLBACK: ChartTokens = {
  dark: false,
  primary: "#465fff",
  primarySoft: "#9cb9ff",
  neutral: "#98a2b3",
  success: "#12b76a",
  warning: "#f79009",
  error: "#f04438",
  text: "#667085",
  grid: "#f2f4f7",
  surface: "#ffffff",
};

function readTokens(dark: boolean): ChartTokens {
  if (typeof window === "undefined") return { ...FALLBACK, dark };
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    dark,
    primary: v("--color-brand-500", FALLBACK.primary),
    primarySoft: v(dark ? "--color-brand-700" : "--color-brand-200", FALLBACK.primarySoft),
    neutral: v(dark ? "--color-gray-600" : "--color-gray-300", FALLBACK.neutral),
    success: v("--color-success-500", FALLBACK.success),
    warning: v("--color-warning-500", FALLBACK.warning),
    error: v("--color-error-500", FALLBACK.error),
    text: v(dark ? "--color-gray-400" : "--color-gray-500", FALLBACK.text),
    grid: dark ? "rgba(255,255,255,0.06)" : v("--color-gray-100", FALLBACK.grid),
    surface: dark ? v("--color-gray-900", "#101828") : "#ffffff",
  };
}

/** Token dei grafici, aggiornati al cambio di modalità chiara/scura. */
export function useChartTokens(): ChartTokens {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [tokens, setTokens] = useState<ChartTokens>(() => readTokens(dark));
  // la classe "dark" su <html> cambia nello stesso giro di render: si rilegge al frame successivo
  useEffect(() => {
    const id = requestAnimationFrame(() => setTokens(readTokens(dark)));
    return () => cancelAnimationFrame(id);
  }, [dark]);
  return tokens;
}

/** Opzioni di base comuni a tutti i grafici. */
export function baseOptions(t: ChartTokens): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
      background: "transparent",
      foreColor: t.text,
      animations: { enabled: true, speed: 350 },
      parentHeightOffset: 0,
    },
    theme: { mode: t.dark ? "dark" : "light" },
    dataLabels: { enabled: false },
    grid: {
      borderColor: t.grid,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 4, right: 8, top: 0, bottom: 0 },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "left",
      fontSize: "12px",
      markers: { size: 4, strokeWidth: 0, shape: "circle" },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    tooltip: { theme: t.dark ? "dark" : "light", style: { fontSize: "12px" } },
    states: { hover: { filter: { type: "none" } }, active: { filter: { type: "none" } } },
  };
}
