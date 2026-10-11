import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { HUB, type CountKey } from "./sections";

/**
 * Sezioni dell'amministrazione come elenco di voci con icona, nome e descrizione (al posto dei soli
 * link): una card per sezione, voci a griglia; accanto alle voci gestite il numero di elementi.
 */
export default async function SettingsHub({ counts, locale }: { counts: Record<CountKey, number>; locale: string }) {
  const t = await getTranslations("admHome");
  const nav = await getTranslations("adminNav");
  const theme = await getTranslations("admin.theme");
  const label = (key: string) => (key === "theme" ? theme("title") : nav(key));
  return (
    <div className="space-y-6">
      {HUB.map((sec) => (
        <section key={sec.key} aria-labelledby={`hub-${sec.key}`} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
          <header className="flex items-start gap-3 px-5 pt-5 sm:px-6">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <sec.icon aria-hidden className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h2 id={`hub-${sec.key}`} className="text-base font-semibold text-gray-900 dark:text-white/90">
                {t(`hub.${sec.key}.title`)}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t(`hub.${sec.key}.desc`)}</p>
            </div>
          </header>
          <ul className="grid grid-cols-1 gap-1 p-2 pt-3 sm:grid-cols-2 sm:p-3 xl:grid-cols-3">
            {sec.links.map((l) => (
              <li key={l.key}>
                <Link
                  href={l.href}
                  className="group flex h-full items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-white/3 dark:focus-visible:bg-white/3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 ring-inset transition-colors group-hover:text-brand-600 dark:text-gray-400 dark:ring-gray-800 dark:group-hover:text-brand-400">
                    <l.icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white/90">{label(l.key)}</span>
                      {l.count && (
                        <span className="rounded-md bg-gray-100 px-1.5 text-theme-xs font-medium text-gray-600 tabular-nums dark:bg-white/5 dark:text-gray-400">
                          {counts[l.count].toLocaleString(locale)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-theme-xs text-gray-500 dark:text-gray-400">{t(`desc.${l.key}`)}</span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="mt-2 size-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500 rtl:rotate-180 dark:text-gray-600 dark:group-hover:text-gray-400"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
