"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import { KeyRound, MailCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import DynamicForm from "@/components/forms/dynamic/DynamicForm";
import FieldShell from "@/components/forms/dynamic/FieldShell";
import { inputCls, selectCls } from "@/components/forms/dynamic/styles";
import { ReadOnlyNotice, WriteGate } from "@/components/common/WriteGate";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import type { DynamicFormView } from "@/lib/forms/dynamic-field";

import { profileAction, registerAction, type ProfileState, type RegisterState } from "@/app/[locale]/(client)/actions";
import { submitKeepingValues } from "@/lib/submit-keeping-values";
import { cn } from "@/utils";

import { Panel } from "./PortalUi";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "./styles";

interface Props {
  mode: "register" | "profile";
  userForm: DynamicFormView | null;
  /** valori iniziali del form utente (chiavi f.<id>) */
  values: Record<string, string[]>;
  timezone: string;
  lang?: string;
  languages: { code: string; label: string }[];
  /** campi password: sempre in registrazione; nel profilo se il reset è consentito */
  showPassword: boolean;
  /** password attuale richiesta (profilo senza token di reset) */
  requireCurrent: boolean;
  /** campo email non modificabile (ospite che si registra) */
  lockEmail?: boolean;
  notice?: string;
  /** pagina "registration-confirm" mostrata dopo la registrazione */
  doneContent?: { title: string; html: string } | null;
}

/** In sola lettura un avviso per i clienti prende il posto del form. */
export default function AccountForm(props: Props) {
  return (
    <WriteGate fallback={<ReadOnlyNotice portal />}>
      <AccountFormInner {...props} />
    </WriteGate>
  );
}

/** Form account (register.inc.php) e profilo (profile.inc.php) del cliente. */
function AccountFormInner({ mode, userForm, values, timezone, lang, languages, showPassword, requireCurrent, lockEmail, notice, doneContent }: Props) {
  const t = useTranslations("portal.account");
  const te = useTranslations("portal.errors");
  const tf = useTranslations("portal.fieldErrors");
  const [state, action, pending] = useActionState<RegisterState | ProfileState, FormData>(mode === "register" ? registerAction : profileAction, {});
  const tzRef = useRef<HTMLSelectElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // errore in cima e pulsante in fondo: dopo un invio fallito il messaggio viene portato in vista
  useEffect(() => {
    if (!state.error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    errorRef.current?.focus({ preventScroll: true });
  }, [state]);
  // register.inc.php: fuso rilevato dal browser (jstz) se non indicato
  useEffect(() => {
    const el = tzRef.current;
    if (mode === "register" && el && !el.value) {
      try {
        el.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        /* fuso non rilevabile: resta il predefinito di sistema */
      }
    }
  }, [mode]);
  const zones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [timezone].filter(Boolean);
    }
  }, [timezone]);

  if ("done" in state && state.done) {
    return (
      <section className={cn(CARD, "flex flex-col items-center px-6 py-12 text-center")}>
        <span className="flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
          <MailCheck aria-hidden="true" className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white/90">{doneContent?.title || t("registered")}</h2>
        {doneContent ? (
          <div className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: doneContent.html }} />
        ) : (
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{t("registeredText")}</p>
        )}
      </section>
    );
  }

  const fieldErr = (k: string) => {
    const code = state.fields?.[k];
    return code ? [tf.has(code) ? tf(code) : code] : undefined;
  };
  // Errori dei campi del form utente (per nome) → id del campo per i renderer
  const dynErrors: Record<number, string[]> = {};
  for (const f of userForm?.fields ?? []) {
    const code = state.fields?.[f.name] ?? state.fields?.[String(f.id)];
    if (code) dynErrors[f.id] = [code];
  }
  const vals = state.values ? Object.fromEntries(Object.entries(state.values).map(([k, v]) => [k, [v]])) : values;
  const submit = submitKeepingValues(action);
  const hidden = lockEmail ? (userForm?.fields.filter((f) => f.name === "email").map((f) => f.id) ?? []) : [];

  return (
    <form onSubmit={submit} className="space-y-6">
      {notice && <Alert variant="info" title={notice} message="" />}
      {state.error && (
        <div ref={errorRef} tabIndex={-1} className="scroll-mt-24 outline-none">
          <Alert variant="error" title={te.has(state.error) ? te(state.error) : state.error} message="" />
        </div>
      )}

      {userForm && (
        <Panel icon={UserRound} title={userForm.title || t("contact")} description={userForm.instructions || undefined}>
          <DynamicForm form={userForm} values={vals} errors={dynErrors} hidden={hidden} />
        </Panel>
      )}

      <Panel icon={SlidersHorizontal} title={t("preferences")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldShell htmlFor="timezone" label={t("timezone")} errors={fieldErr("timezone")}>
            <select ref={tzRef} id="timezone" name="timezone" defaultValue={state.values?.timezone ?? timezone} className={selectCls}>
              <option value="">{t("timezoneDefault")}</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </FieldShell>
          {mode === "profile" && languages.length > 0 && (
            <FieldShell htmlFor="lang" label={t("language")}>
              <select id="lang" name="lang" defaultValue={state.values?.lang ?? lang ?? ""} className={selectCls}>
                <option value="">{t("languageBrowser")}</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
        </div>
      </Panel>

      {showPassword && (
        <Panel icon={KeyRound} title={t("credentials")}>
          <div className="grid gap-5 sm:grid-cols-3">
            {requireCurrent && (
              <FieldShell htmlFor="cpasswd" label={t("currentPassword")} errors={fieldErr("cpasswd")}>
                <input id="cpasswd" name="cpasswd" type="password" maxLength={128} autoComplete="current-password" className={inputCls} />
              </FieldShell>
            )}
            <FieldShell htmlFor="passwd1" label={mode === "register" ? t("createPassword") : t("newPassword")} required={mode === "register"} errors={fieldErr("passwd1")}>
              <input id="passwd1" name="passwd1" type="password" maxLength={128} autoComplete="new-password" className={inputCls} />
            </FieldShell>
            <FieldShell htmlFor="passwd2" label={t("confirmPassword")} required={mode === "register"} errors={fieldErr("passwd2")}>
              <input id="passwd2" name="passwd2" type="password" maxLength={128} autoComplete="new-password" className={inputCls} />
            </FieldShell>
          </div>
        </Panel>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/" className={BTN_SECONDARY}>
          {t("cancel")}
        </Link>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? t("saving") : mode === "register" ? t("register") : t("update")}
        </button>
      </div>
    </form>
  );
}
