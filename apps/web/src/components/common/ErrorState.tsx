"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

/**
 * Contenuto delle pagine di errore (error.tsx dei pannelli e del portale): messaggio localizzato,
 * "Riprova" (retry di Next: ricarica e ridisegna il segmento) e ritorno alla home dell'area. In
 * produzione il messaggio dell'errore non arriva al browser: si mostra solo il codice (digest) da cercare
 * nei log del server.
 */
export default function ErrorState({
  error,
  retry,
  homeHref,
  fullPage = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
  /** senza il guscio dell'area (errore nel layout): centrato nella finestra */
  fullPage?: boolean;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center p-6 text-center", fullPage ? "min-h-screen" : "min-h-[50vh]")}>
      <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-error-500 dark:border-gray-800 dark:bg-white/3 dark:text-error-400">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">{t("title")}</h1>
      <p className="mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">{t("message")}</p>
      {error.digest && <p className="mt-2 font-mono text-theme-xs text-gray-500 dark:text-gray-400">{t("code", { code: error.digest })}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          {t("retry")}
        </button>
        <Link
          href={homeHref}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
