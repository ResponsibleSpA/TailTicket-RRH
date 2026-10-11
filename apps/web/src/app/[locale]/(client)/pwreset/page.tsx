import { ArrowLeft, KeyRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ResetForms from "@/components/portal/ResetForms";
import { FOCUS } from "@/components/portal/styles";
import { Link, redirect } from "@/i18n/navigation";
import { coreConfig } from "@/server/config/config";
import { db } from "@/server/db";
import { cn } from "@/utils";

export async function generateMetadata() {
  const t = await getTranslations("portal.pwreset");
  return { title: t("title") };
}

/**
 * pwreset.php: senza token richiesta del link; con il token di un account da confermare si passa
 * alla conferma (route handler /pwreset/confirm), altrimenti si chiede di nuovo il nome utente.
 */
export default async function PwresetPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string; form?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, form } = await searchParams;
  const t = await getTranslations("portal.pwreset");
  const cfg = await coreConfig();
  if (token && !form) {
    const row = await db().selectFrom("config").select("value").where("namespace", "=", "pwreset").where("key", "=", token).executeTakeFirst();
    if (!row) redirect({ href: "/", locale });
    redirect({ href: `/pwreset/confirm?token=${encodeURIComponent(token)}`, locale });
  }
  return (
    // colonna centrata della larghezza della scheda (max-w-md), come una pagina di accesso
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-2 text-center sm:py-10">
      <span className="flex size-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">
        <KeyRound aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">{t("title")}</h1>
      <div className="mt-6 w-full text-start">
        {!token && !cfg.bool("allow_pw_reset") ? <p className="text-center text-sm text-gray-500 dark:text-gray-400">{t("disabled")}</p> : <ResetForms token={token} />}
      </div>
      <Link href="/login" className={cn("mt-6 inline-flex items-center gap-1.5 rounded text-theme-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white", FOCUS)}>
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        {t("backToLogin")}
      </Link>
    </div>
  );
}
