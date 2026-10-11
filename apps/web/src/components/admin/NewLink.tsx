"use client";

import { Plus } from "lucide-react";

import { useReadOnlyHint } from "@/components/common/WriteGate";
import { Link } from "@/i18n/navigation";

const CLS = "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs";

/**
 * Pulsante "Nuovo …" delle liste admin. Se l'amministrazione non è scrivibile resta visibile ma
 * disattivato, con il motivo nel tooltip.
 */
export default function NewLink({ href, label }: { href: string; label: string }) {
  const readOnly = useReadOnlyHint("admin");
  if (!readOnly) {
    return (
      <Link href={href} className={`${CLS} bg-brand-500 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500`}>
        <Plus aria-hidden className="size-4" />
        {label}
      </Link>
    );
  }
  return (
    <span role="link" aria-disabled="true" title={readOnly} className={`${CLS} cursor-not-allowed bg-brand-300 dark:bg-brand-500/40`}>
      <Plus aria-hidden className="size-4" />
      {label}
    </span>
  );
}
