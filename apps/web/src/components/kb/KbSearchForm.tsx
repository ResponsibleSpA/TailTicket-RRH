import { ChevronDown, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { withBase } from "@/lib/base-path";

interface KbSearchOption {
  id: number;
  label: string;
}

interface KbSearchLabels {
  search: string;
  searchButton: string;
  reset: string;
  category: string;
  topic: string;
  allCategories: string;
  allTopics: string;
}

// stessi campi della barra della board: bordo neutro, anello di focus col primario
const control =
  "h-10 w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

/** Select con la freccia di Lucide al posto di quella del sistema. */
function SelectBox({ name, defaultValue, label, children }: { name: string; defaultValue: string; label: string; children: ReactNode }) {
  return (
    <span className="relative min-w-0">
      <select name={name} defaultValue={defaultValue} aria-label={label} className={`${control} appearance-none truncate ps-3 pe-9`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" aria-hidden />
    </span>
  );
}

/**
 * Ricerca FAQ con filtri per categoria e help topic (form #kbSearch di faq-categories.inc.php).
 * Form GET senza JavaScript: i filtri sono parametri dell'URL (q, cid, topicId).
 */
export default function KbSearchForm({
  q,
  categoryId,
  topicId,
  categories,
  topics,
  labels,
  active,
}: {
  q: string;
  categoryId: number;
  topicId: number;
  categories: readonly KbSearchOption[];
  topics: readonly KbSearchOption[];
  labels: KbSearchLabels;
  active: boolean;
}) {
  return (
    <form action={withBase("/agent/kb")} method="get" role="search" className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <span className="relative min-w-0">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={labels.search}
          aria-label={labels.search}
          className={`${control} ps-9 pe-3 placeholder:text-gray-400 dark:placeholder:text-white/30`}
        />
      </span>
      <SelectBox name="cid" defaultValue={String(categoryId)} label={labels.category}>
        <option value="0">{labels.allCategories}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </SelectBox>
      <SelectBox name="topicId" defaultValue={String(topicId)} label={labels.topic}>
        <option value="0">{labels.allTopics}</option>
        {topics.map((tp) => (
          <option key={tp.id} value={tp.id}>
            {tp.label}
          </option>
        ))}
      </SelectBox>
      <div className="flex gap-2">
        <button type="submit" name="a" value="search" className="h-10 flex-1 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden md:flex-none">
          {labels.searchButton}
        </button>
        {active && (
          <Link
            href="/agent/kb"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 md:flex-none dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {labels.reset}
          </Link>
        )}
      </div>
    </form>
  );
}
