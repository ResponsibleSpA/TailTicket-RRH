"use client";

import { type ReactNode, useActionState } from "react";

import { LogIn, type LucideIcon, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

import { BTN_PRIMARY, BTN_SECONDARY, CARD, TEXT_LINK } from "./styles";
import { accessLinkAction, portalLoginAction, type AccessLinkState, type PortalLoginState } from "@/app/[locale]/(client)/actions";

interface Props {
  next?: string;
  /** errore arrivato dal link (view, conferma) */
  linkError?: string;
  /** login con account disponibile (client_registration != disabled) */
  showLogin: boolean;
  canRegister: boolean;
  /** con client_verify_email il link arriva via email, altrimenti accesso diretto */
  verifyEmail: boolean;
  canOpen: boolean;
  allowReset: boolean;
  defaults: { login?: string; email?: string; number?: string };
  banner: { title: string; html: string } | null;
}

/** intestazione di una delle due schede: icona, titolo e descrizione */
function CardHead({ icon: Icon, title, children, as: H }: { icon: LucideIcon; title: string; children: ReactNode; as: "h1" | "h2" }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <H className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white/90">{title}</H>
        {children}
      </div>
    </div>
  );
}

/** login.php: accesso con account (login.inc.php) e verifica dello stato con numero del ticket (accesslink.inc.php). */
export default function LoginPanel({ next, linkError, showLogin, canRegister, verifyEmail, canOpen, allowReset, defaults, banner }: Props) {
  const t = useTranslations("portal.login");
  const te = useTranslations("portal.errors");
  const [login, loginAction, loginPending] = useActionState<PortalLoginState, FormData>(portalLoginAction, {});
  const [link, linkAction, linkPending] = useActionState<AccessLinkState, FormData>(accessLinkAction, {});
  const err = (code?: string) => (code ? (te.has(code) ? te(code) : code) : null);

  return (
    <div className={cn("mx-auto grid gap-6 sm:py-4", showLogin ? "max-w-5xl lg:grid-cols-2" : "max-w-xl")}>
      {showLogin && (
        <section className={cn(CARD, "p-6 sm:p-8")}>
          <CardHead icon={LogIn} title={banner?.title || t("title")} as="h1">
            {banner ? (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: banner.html }} />
            ) : (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
            )}
          </CardHead>
          {login.error && (
            <div className="mt-4">
              <Alert variant="error" title={err(login.error)!} message="" />
            </div>
          )}
          <form action={loginAction} className="mt-6 space-y-5">
            <input type="hidden" name="next" value={next ?? ""} />
            <div>
              <Label htmlFor="login">{t("login")}</Label>
              <Input id="login" name="login" autoComplete="username" defaultValue={login.login ?? defaults.login} required />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
            </div>
            <button type="submit" className={cn(BTN_PRIMARY, "w-full")} disabled={loginPending}>
              {loginPending ? t("signingIn") : t("signIn")}
            </button>
            <div className="flex flex-wrap justify-between gap-2 text-theme-sm">
              {allowReset && (
                <Link href="/pwreset" className={TEXT_LINK}>
                  {t("forgot")}
                </Link>
              )}
              {canRegister && (
                <span className="text-gray-500 dark:text-gray-400">
                  {t("notRegistered")}{" "}
                  <Link href="/account" className={TEXT_LINK}>
                    {t("createAccount")}
                  </Link>
                </span>
              )}
            </div>
            <p className="border-t border-gray-100 pt-4 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {t("agent")}{" "}
              <Link href="/agent/login" className={TEXT_LINK}>
                {t("agentLink")}
              </Link>
            </p>
          </form>
        </section>
      )}

      <section id="access" className={cn(CARD, "scroll-mt-24 p-6 sm:p-8")}>
        <CardHead icon={Ticket} title={t("accessTitle")} as={showLogin ? "h2" : "h1"}>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{verifyEmail ? t("accessVerify") : t("accessDirect")}</p>
        </CardHead>
        {(link.error || linkError) && (
          <div className="mt-4">
            <Alert variant="error" title={err(link.error ?? linkError)!} message="" />
          </div>
        )}
        {link.sent && (
          <div className="mt-4">
            <Alert variant="success" title={t("linkSent")} message="" />
          </div>
        )}
        <form action={linkAction} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" placeholder={t("emailPlaceholder")} defaultValue={link.email ?? defaults.email} required />
          </div>
          <div>
            <Label htmlFor="number">{t("number")}</Label>
            <Input id="number" name="number" placeholder={t("numberPlaceholder")} defaultValue={link.number ?? defaults.number} required />
          </div>
          {/* accanto all'accesso con account il pulsante è secondario: un solo primario per pagina */}
          <button type="submit" className={cn(showLogin ? BTN_SECONDARY : BTN_PRIMARY, "w-full")} disabled={linkPending}>
            {verifyEmail ? t("sendLink") : t("viewTicket")}
          </button>
        </form>
        {canOpen && (
          <p className="mt-5 text-theme-sm text-gray-500 dark:text-gray-400">
            {t("firstTime")}{" "}
            <Link href="/open" className={TEXT_LINK}>
              {t("openNew")}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
