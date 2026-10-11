import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { withBase } from "@/lib/base-path";
import { cn } from "@/utils";

import { CARD, FIELD, FOCUS } from "./styles";

/** Riquadro della barra laterale con un elenco di link neutri. */
function LinkBox({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <section className={cn(CARD, "p-5")}>
      <h2 className="mb-2 text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{title}</h2>
      <ul className="-mx-2 space-y-0.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn("block rounded-lg px-2 py-1.5 text-theme-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400", FOCUS)}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Barra laterale della knowledge base: ricerca, help topic con FAQ, categorie. */
export default async function KbSidebar({ topics, categories, q }: { topics: { id: number; name: string }[]; categories?: { id: number; name: string }[]; q?: string }) {
  const t = await getTranslations("portal.kb");
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <form action={withBase("/kb")} method="get" role="search" className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input type="search" name="q" defaultValue={q ?? ""} placeholder={t("search")} aria-label={t("search")} className={cn(FIELD, "w-full ps-10")} />
      </form>
      {topics.length > 0 && <LinkBox title={t("topics")} links={topics.map((tp) => ({ href: `/kb?topicId=${tp.id}`, label: tp.name }))} />}
      {categories && categories.length > 0 && <LinkBox title={t("categories")} links={categories.map((c) => ({ href: `/kb/category/${c.id}`, label: c.name }))} />}
    </aside>
  );
}
