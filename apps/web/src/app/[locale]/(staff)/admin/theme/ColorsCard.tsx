"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { isHexColor, paletteFromHex, relativeLuminance, SHADES } from "@/lib/theme/palette";
import { COLOR_PRESETS } from "@/lib/theme/schema";
import { cn } from "@/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Field } from "./controls";

interface ColorsCardProps {
  /** colore primario corrente */
  color: string;
  /** testo del campo esadecimale (può non essere ancora un colore valido) */
  hexDraft: string;
  /** scelta di un colore valido (preset o selettore) */
  onColor: (color: string) => void;
  /** digitazione nel campo esadecimale */
  onHexDraft: (value: string) => void;
}

/** tonalità mostrate nei campioni dei preset */
const PRESET_SHADES = ["200", "400", "500", "600", "800"] as const;

/** Colore del marchio: preset, colore personalizzato e scala generata, con avviso di basso contrasto. */
export default function ColorsCard({ color, hexDraft, onColor, onHexDraft }: ColorsCardProps) {
  const t = useTranslations("admin.theme");
  const palette = paletteFromHex(color);
  const lowContrast = relativeLuminance(color) > 0.45;
  const invalid = !isHexColor(hexDraft);
  return (
    <ComponentCard title={t("colors")} desc={t("colorsDesc")}>
      <div role="group" aria-label={t("colors")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {COLOR_PRESETS.map((p) => {
          const ramp = paletteFromHex(p.color);
          const active = color === p.color;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onColor(p.color)}
              className={cn(
                "rounded-xl border p-2 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                active ? "border-brand-500 ring-3 ring-brand-500/15" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
              )}
            >
              {/* scala generata dal preset: chiara, base, scura */}
              <span className="flex h-7 overflow-hidden rounded-md ring-1 ring-black/5 ring-inset dark:ring-white/10">
                {PRESET_SHADES.map((sh) => (
                  <span key={sh} className="flex-1" style={{ backgroundColor: ramp[sh] }} />
                ))}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 px-0.5">
                <span className="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-300">{t(`presets.${p.id}`)}</span>
                {active && <Check aria-hidden className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Field label={t("customColor")} htmlFor="theme-color">
          <div className="flex items-center gap-3">
            <input
              id="theme-color"
              type="color"
              value={color}
              onChange={(e) => onColor(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-gray-800"
            />
            <Input
              value={hexDraft}
              onChange={(e) => onHexDraft(e.target.value)}
              className="font-mono w-32"
              aria-label={t("hexLabel")}
              aria-invalid={invalid}
              aria-describedby={invalid ? "theme-hex-error" : undefined}
              error={invalid}
            />
          </div>
          {invalid && (
            <p id="theme-hex-error" className="mt-1.5 text-theme-xs text-error-500">
              {t("hexInvalid")}
            </p>
          )}
        </Field>
      </div>
      <div className="flex overflow-hidden rounded-xl ring-1 ring-black/5 ring-inset dark:ring-white/10">
        {SHADES.map((s) => (
          <div key={s} className="flex-1 py-3 text-center text-[10px] font-medium tabular-nums" style={{ backgroundColor: palette[s], color: Number(s) >= 500 ? "#fff" : "#101828" }}>
            {s}
          </div>
        ))}
      </div>
      {lowContrast && <Alert variant="warning" title={t("lowContrast")} message="" />}
    </ComponentCard>
  );
}
