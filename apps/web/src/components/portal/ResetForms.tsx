"use client";

import { useActionState } from "react";

import { useTranslations } from "next-intl";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";

import { pwresetLoginAction, pwresetRequestAction, type ResetState } from "@/app/[locale]/(client)/actions";
import { submitKeepingValues } from "@/lib/submit-keeping-values";
import { cn } from "@/utils";

import { BTN_PRIMARY, CARD } from "./styles";

/** pwreset.php: richiesta del link (pwreset.request.php) o accesso con il token (pwreset.login.php). */
export default function ResetForms({ token }: { token?: string }) {
  const t = useTranslations("portal.pwreset");
  const te = useTranslations("portal.errors");
  const [state, action, pending] = useActionState<ResetState, FormData>(token ? pwresetLoginAction : pwresetRequestAction, {});
  const submit = submitKeepingValues(action);
  if (state.sent)
    return (
      <div>
        <Alert variant="success" title={t("sent")} message={t("sentText")} />
      </div>
    );
  return (
    <form onSubmit={submit} className={cn(CARD, "space-y-5 p-6 sm:p-8")}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{token ? t("loginText") : t("requestText")}</p>
      {state.error && (
        <div>
          <Alert variant="error" title={te.has(state.error) ? te(state.error) : state.error} message="" />
        </div>
      )}
      {token && <input type="hidden" name="token" value={token} />}
      <div>
        <Label htmlFor="userid">{t("userid")}</Label>
        <Input id="userid" name="userid" autoComplete="username" required />
      </div>
      <button type="submit" disabled={pending} className={cn(BTN_PRIMARY, "w-full")}>
        {token ? t("login") : t("send")}
      </button>
    </form>
  );
}
