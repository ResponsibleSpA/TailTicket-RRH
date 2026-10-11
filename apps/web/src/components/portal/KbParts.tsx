import { BookOpen, ChevronRight, FileText, Folder, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

import { CARD, FOCUS } from "./styles";

/** Percorso della knowledge base ("Tutte le categorie › categoria"), con l'ultima voce come pagina corrente. */
export function KbBreadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  const t = useTranslations("portal.kb");
  return (
    <nav aria-label={t("breadcrumb")}>
      <ol className="flex flex-wrap items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
        {items.map((it, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 text-gray-400 rtl:rotate-180" />}
            <li className="min-w-0">
              {it.href ? (
                <Link href={it.href} className={cn("rounded hover:text-gray-800 dark:hover:text-white", FOCUS)}>
                  {it.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-gray-700 dark:text-gray-300">
                  {it.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/** Elenco di FAQ come righe cliccabili: domanda neutra con hover sul primario, graffetta se ha allegati. */
export function FaqLinkList({ faqs, className }: { faqs: { id: number; question: string; attachments?: number | boolean }[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-gray-100 dark:divide-gray-800", className)}>
      {faqs.map((f) => (
        <li key={f.id}>
          <Link href={`/kb/faq/${f.id}`} className={cn("group flex items-start gap-3 py-3 text-theme-sm", FOCUS)}>
            <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 font-medium text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
              {f.question}
              {f.attachments ? <Paperclip aria-hidden="true" className="ms-1.5 inline size-3.5 align-[-2px] text-gray-400" /> : null}
            </span>
            <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-300 group-hover:text-gray-500 rtl:rotate-180 dark:text-gray-600" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Sottocategoria come etichetta cliccabile con il numero di FAQ. */
export function SubcategoryChip({ id, name, count }: { id: number; name: string; count: number }) {
  return (
    <Link
      href={`/kb/category/${id}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-theme-xs font-medium text-gray-700 hover:border-gray-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:text-brand-400",
        FOCUS,
      )}
    >
      <Folder aria-hidden="true" className="size-3.5 text-gray-400" />
      {name}
      <span className="text-gray-400 tabular-nums">{count}</span>
    </Link>
  );
}

/** Stato vuoto della knowledge base (nessuna FAQ, nessun risultato). */
export function KbEmpty({ text }: { text: string }) {
  return (
    <div className={cn(CARD, "flex flex-col items-center px-6 py-12 text-center")}>
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
        <BookOpen aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
