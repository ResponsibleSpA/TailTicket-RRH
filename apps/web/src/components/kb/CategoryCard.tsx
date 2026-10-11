import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { FolderOpen } from "lucide-react";

import VisibilityBadge, { type VisibilityLabels } from "./VisibilityBadge";

/** Categoria di primo livello nella pagina principale della KB (#kb di faq-categories.inc.php). */
export default function CategoryCard({
  id,
  name,
  visibility,
  countLabel,
  descriptionHtml,
  labels,
  children,
}: {
  id: number;
  name: string;
  visibility: 0 | 1 | 2;
  countLabel: string;
  descriptionHtml: string;
  labels: VisibilityLabels;
  /** sottocategorie */
  children?: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition-colors has-[h3_a:hover]:border-gray-300 dark:border-gray-800 dark:bg-white/3 dark:has-[h3_a:hover]:border-gray-700">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <FolderOpen className="size-4" />
        </span>
        <h3 className="min-w-0 flex-1 self-center text-base font-semibold break-words text-gray-900 dark:text-white/90">
          <Link href={`/agent/kb/category/${id}`} className="hover:text-brand-600 dark:hover:text-brand-400">
            {name}
          </Link>
        </h3>
        <VisibilityBadge visibility={visibility} labels={labels} />
      </div>
      {descriptionHtml && (
        <div className="thread-body line-clamp-3 text-sm break-words text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      )}
      {children}
      <p className="mt-auto border-t border-gray-100 pt-3 text-theme-xs text-gray-500 tabular-nums dark:border-gray-800 dark:text-gray-400">{countLabel}</p>
    </section>
  );
}
