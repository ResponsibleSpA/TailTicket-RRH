import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

/** Paginazione con link (server component): conserva gli altri parametri della query. */
export default function LinkPager({
  page,
  totalPages,
  href,
  labels,
}: {
  page: number;
  totalPages: number | null;
  /** costruisce l'URL di una pagina */
  href: (p: number) => string;
  labels: { prev: string; next: string };
}) {
  const t = useTranslations("common");
  // una pagina sola: niente paginazione
  if (totalPages !== null && totalPages <= 1 && page <= 1) return null;
  const last = totalPages ?? page + 1;
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(last, page + 2); p++) pages.push(p);
  const btn =
    "flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-gray-700 tabular-nums hover:bg-gray-100 focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden dark:text-gray-400 dark:hover:bg-white/5";
  return (
    <nav className="flex items-center gap-1" aria-label={t("pagination")}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(btn, "border border-gray-200 dark:border-gray-800")}>
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {labels.prev}
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(btn, p === page && "bg-brand-500 text-white hover:bg-brand-600 dark:text-white")}
        >
          {p}
        </Link>
      ))}
      {totalPages === null || page < totalPages ? (
        <Link href={href(page + 1)} className={cn(btn, "border border-gray-200 dark:border-gray-800")}>
          {labels.next}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      ) : null}
    </nav>
  );
}
