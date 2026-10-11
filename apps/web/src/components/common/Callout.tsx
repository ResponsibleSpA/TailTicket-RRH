import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils";

type Tone = "warning" | "info" | "error" | "success";

const TONES: Record<Tone, string> = {
  warning: "border-warning-500/40 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400",
  info: "border-blue-light-500/40 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-400",
  error: "border-error-500/40 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400",
  success: "border-success-500/40 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
};

const ICON: Record<Tone, LucideIcon> = { success: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info };

/** Riquadro di avviso o di esito di un'azione: icona del tono, titolo facoltativo e testo (docs/brand/ui.md). */
export default function Callout({ tone = "warning", role, title, children }: { tone?: Tone; role?: "status" | "alert"; title?: ReactNode; children?: ReactNode }) {
  const Icon = ICON[tone];
  return (
    <div role={role} className={cn("flex gap-3 rounded-lg border p-4 text-sm", TONES[tone])}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children}
      </div>
    </div>
  );
}
