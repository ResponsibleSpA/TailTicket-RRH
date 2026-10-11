"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils";

import { NOTICE_TONES } from "./dialog-ui";

/** Select del composer (stessa altezza e stile dei campi dei dialoghi). */
export const composerSelectCls =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden sm:w-auto sm:min-w-44 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

/** Etichetta sopra un controllo del composer. */
export function ComposerField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex w-full flex-col gap-1.5 text-theme-sm font-medium text-gray-700 sm:w-auto dark:text-gray-400", className)}>
      {label}
      {children}
    </label>
  );
}

/** Avviso del composer (lock, errore, invio riuscito). */
export function ComposerAlert({ tone, role, children }: { tone: keyof typeof NOTICE_TONES; role?: "alert" | "status"; children: ReactNode }) {
  return (
    <p role={role} className={cn("mx-4 mt-4 rounded-lg px-4 py-2.5 text-theme-sm ring-1 ring-inset sm:mx-5", NOTICE_TONES[tone])}>
      {children}
    </p>
  );
}

/** Scheda "Rispondi" / "Nota interna" (pattern tab WAI-ARIA, pannello `${id}-panel`). */
export function TabButton({ id, active, onClick, icon: Icon, children }: { id: string; active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode }) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-theme-sm font-medium focus-visible:bg-gray-50 focus-visible:outline-hidden sm:px-5 dark:focus-visible:bg-white/5",
        active
          ? "border-brand-500 text-gray-900 dark:text-white/90"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200",
      )}
    >
      <Icon aria-hidden className={cn("size-4", active ? "text-brand-500 dark:text-brand-400" : "text-gray-400")} />
      {children}
    </button>
  );
}

/** Piede del form: opzioni a sinistra, invio a destra, su una fascia grigia separata. */
export function ComposerFooter({ children, submit }: { children: ReactNode; submit: ReactNode }) {
  return (
    <div className="-mx-4 -mb-4 flex flex-wrap items-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/60 px-4 py-4 sm:-mx-5 sm:-mb-5 sm:gap-4 sm:px-5 dark:border-gray-800 dark:bg-white/2">
      {children}
      <div className="ms-auto w-full sm:w-auto">{submit}</div>
    </div>
  );
}

/** Pulsante di invio (primario: uno solo per scheda). */
export function SubmitButton({ pending, label, pendingLabel, icon: Icon }: { pending: boolean; label: string; pendingLabel: string; icon: LucideIcon }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden disabled:opacity-60 sm:w-auto"
    >
      <Icon aria-hidden className="size-4" />
      {pending ? pendingLabel : label}
    </button>
  );
}
