import { ArrowLeft, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import BrandLogo from "@/components/brand/BrandLogo";
import { Link } from "@/i18n/navigation";
import { loadTheme } from "@/server/theme/theme";

/** Nome dell'helpdesk per il titolo della scheda (DB non raggiungibile: il marchio TailTicket). */
async function displayName(): Promise<string> {
  try {
    return (await loadTheme()).displayName;
  } catch {
    return "TailTicket";
  }
}

/**
 * Pagina 404 localizzata. not-found.tsx non riceve i metadata della route (generateMetadata non viene
 * letto): il titolo della scheda "Pagina non trovata · <nome>" è un <title> di React 19, portato nel <head>.
 */
export default async function NotFound() {
  const [t, tb, name] = await Promise.all([getTranslations("notFound"), getTranslations("brand"), displayName()]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 dark:bg-gray-900">
      <title>{`${t("title")} · ${name}`}</title>
      <header className="flex justify-center pt-10">
        <Link href="/" aria-label={t("backHome")} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
          <BrandLogo audience="client" height={36} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="flex max-w-md flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">
            <SearchX aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-6 text-theme-xs font-semibold tracking-widest text-brand-600 uppercase tabular-nums dark:text-brand-400">{t("error")} 404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl dark:text-white/90">{t("title")}</h1>
          <p className="mt-3 text-base text-gray-500 dark:text-gray-400">{t("message")}</p>
          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("backHome")}
          </Link>
        </div>
      </main>
      <p className="pb-6 text-center text-theme-xs text-gray-400 dark:text-gray-500">{tb("basedOn")}</p>
    </div>
  );
}
