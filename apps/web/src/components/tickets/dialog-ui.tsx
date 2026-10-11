"use client";

import type { ReactNode } from "react";

import { cn } from "@/utils";

/**
 * Pezzi comuni delle finestre modali dei ticket (azioni, "Gestisci", azioni di massa): stessa larghezza,
 * titolo, avvisi, piede e pulsanti, così tutti i dialoghi si somigliano (docs/brand/ui.md).
 */

const WIDTHS = { md: "max-w-[600px]", lg: "max-w-[760px]", xl: "max-w-[840px]" };

/** Classi della Modal: margine dai bordi, larghezza massima e spaziatura interna. */
export const dialogClass = (width: keyof typeof WIDTHS = "md") => cn("m-4 w-full p-5 sm:p-7", WIDTHS[width]);

/** Contenuto lungo: scorre dentro la finestra. */
export const dialogScrollClass = "custom-scrollbar max-h-[80vh] space-y-5 overflow-y-auto pe-1";

/** Titolo del dialogo (primo heading: la Modal lo usa come nome accessibile); lascia spazio alla X. */
export function DialogTitle({ children }: { children: ReactNode }) {
  return <h4 className="pe-12 text-lg leading-7 font-semibold tracking-tight break-words text-gray-900 sm:pt-1 dark:text-white/90">{children}</h4>;
}

export const NOTICE_TONES = {
  info: "bg-blue-light-50 text-blue-light-700 ring-blue-light-600/15 dark:bg-blue-light-500/10 dark:text-blue-light-400 dark:ring-blue-light-500/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-600/15 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/20",
  error: "bg-error-50 text-error-700 ring-error-600/15 dark:bg-error-500/10 dark:text-error-400 dark:ring-error-500/20",
  success: "bg-success-50 text-success-700 ring-success-600/15 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/20",
};

/** Riquadro informativo, di avviso o d'errore dentro un dialogo. */
export function DialogNotice({ tone, role, children }: { tone: keyof typeof NOTICE_TONES; role?: "alert" | "status"; children: ReactNode }) {
  return (
    <div role={role} className={cn("rounded-lg px-4 py-3 text-theme-sm ring-1 ring-inset", NOTICE_TONES[tone])}>
      {children}
    </div>
  );
}

/** Piede con i pulsanti: a destra da sm in su, impilati (principale sopra) su mobile. */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3 dark:border-gray-800", className)}>{children}</div>
  );
}

const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium focus-visible:ring-3 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/** Aspetto dei pulsanti dei dialoghi: secondario (bordo), principale (primario) o distruttivo (rosso). */
export const dialogButtonClass = {
  secondary: `${base} border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-brand-500/20 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white`,
  primary: `${base} bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 focus-visible:ring-brand-500/30`,
  danger: `${base} bg-error-600 text-white shadow-theme-xs hover:bg-error-700 focus-visible:ring-error-500/30`,
};

/** Pulsante secondario (Annulla, Chiudi, azioni secondarie dentro il dialogo). */
export function SecondaryButton({ onClick, type = "button", disabled, children }: { onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; children: ReactNode }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={dialogButtonClass.secondary}>
      {children}
    </button>
  );
}

/** Pulsante principale del dialogo (invio del form), rosso per le azioni irreversibili. */
export function PrimaryButton({
  type = "submit",
  onClick,
  disabled,
  danger,
  children,
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={danger ? dialogButtonClass.danger : dialogButtonClass.primary}>
      {children}
    </button>
  );
}
