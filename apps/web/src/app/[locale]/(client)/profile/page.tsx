import { CircleCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/DataTable";
import AccountForm from "@/components/portal/AccountForm";
import { CARD } from "@/components/portal/styles";
import Alert from "@/components/ui/alert/Alert";
import { redirect } from "@/i18n/navigation";
import { UserAccountStatus } from "@/lib/osticket/flags";
import { clientResetToken } from "@/server/auth/client-auth";
import { coreConfig } from "@/server/config/config";
import { db } from "@/server/db";
import { configuredLanguages, profileFormValues, renderedContent } from "@/server/domain/client/ui";
import { baseForms } from "@/server/domain/ticket/create-ui";
import { cn } from "@/utils";

import { requireClient } from "../guard";

export async function generateMetadata() {
  const t = await getTranslations("portal.account");
  return { title: t("profileTitle") };
}

/**
 * profile.php: dati di contatto modificabili dai clienti, fuso orario, lingua e password. Gli ospiti
 * (accesso da link) tornano al ticket (protezione dalla presa di controllo dell'account, come il PHP).
 */
export default async function ProfilePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ pwchange?: string; confirmed?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const client = await requireClient(locale, "/profile", { skipPwCheck: true });
  if (client.guest) redirect({ href: `/tickets/${client.guest.ticketId}`, locale });
  const t = await getTranslations("portal.account");
  const cfg = await coreConfig();
  const [{ user }, values, resetToken] = await Promise.all([baseForms(db(), cfg, "client"), profileFormValues(cfg, client.id), clientResetToken()]);
  const acct = client.account;
  const forced = !!acct && (acct.status & UserAccountStatus.REQUIRE_PASSWD_RESET) !== 0;
  const resetAllowed = !!acct && !(acct.status & UserAccountStatus.FORBID_PASSWD_RESET);
  const thanks = sp.confirmed ? await renderedContent(cfg, "registration-thanks") : null;
  const langs = configuredLanguages(cfg).map((code) => ({ code, label: code }));
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("profileTitle")} subtitle={t("profileSubtitle")} />
      {thanks && (
        <section className={cn(CARD, "flex gap-4 p-5 sm:p-6")}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <CircleCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{thanks.title}</h2>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: thanks.html }} />
          </div>
        </section>
      )}
      {(forced || sp.pwchange) && <Alert variant="warning" title={t("pwchangeRequired")} message="" />}
      <AccountForm
        mode="profile"
        userForm={user}
        values={values}
        timezone={acct?.timezone ?? ""}
        lang={acct?.lang ?? ""}
        languages={langs}
        showPassword={resetAllowed}
        requireCurrent={!resetToken}
      />
    </div>
  );
}
