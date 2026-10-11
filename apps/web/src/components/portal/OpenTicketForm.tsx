"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { CircleCheck, LoaderCircle, Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import RetryAlert from "@/components/common/RetryAlert";
import RichTextEditor from "@/components/editor/RichTextEditor";
import AttachmentInput, { AttachmentMemory } from "@/components/forms/AttachmentInput";
import DynamicForm from "@/components/forms/dynamic/DynamicForm";
import FieldShell from "@/components/forms/dynamic/FieldShell";
import { selectCls } from "@/components/forms/dynamic/styles";
import { ReadOnlyNotice, WriteGate } from "@/components/common/WriteGate";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import type { DynamicFormView } from "@/lib/forms/dynamic-field";
import { tryAction } from "@/lib/try-action";
import { cn } from "@/utils";

import { openTicketAction, portalTopicFormsAction, type OpenState } from "@/app/[locale]/(client)/actions";

import { RICH_CLASS } from "./rich";
import { Avatar, Panel } from "./PortalUi";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "./styles";
import { useEditorLabels } from "./useEditorLabels";

interface Props {
  /** form utente per gli ospiti (null per il cliente autenticato) */
  userForm: DynamicFormView | null;
  ticketForm: DynamicFormView | null;
  topics: { id: number; name: string }[];
  defaultTopic: number;
  initialTopic: { forms: DynamicFormView[]; disabled: number[] };
  client: { name: string; email: string } | null;
  maxFileSize: number;
}

/** In sola lettura un avviso per i clienti prende il posto del form. */
export default function OpenTicketForm(props: Props) {
  return (
    <WriteGate fallback={<ReadOnlyNotice portal />}>
      <OpenTicketFormInner {...props} />
    </WriteGate>
  );
}

/** Apertura di un ticket dal portale (include/client/open.inc.php). */
function OpenTicketFormInner({ userForm, ticketForm, topics, defaultTopic, initialTopic, client, maxFileSize }: Props) {
  const t = useTranslations("portal.open");
  const te = useTranslations("portal.errors");
  const tf = useTranslations("dynamicForms");
  const labels = useEditorLabels();
  const [state, action, pending] = useActionState<OpenState, FormData>(openTicketAction, {});
  const [topic, setTopic] = useState(initialTopic);
  const [loading, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // dopo un errore il form si ricostruisce con i valori del server: si porta in vista il primo errore
  useEffect(() => {
    if (!state.nonce || state.created) return;
    formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.nonce, state.created]);
  // argomento il cui caricamento dei form è fallito: messaggio e "Riprova", il resto del modulo resta com'è
  const [topicFailed, setTopicFailed] = useState<number | null>(null);
  const changeTopic = (id: number) =>
    start(async () => {
      setTopicFailed(null);
      if (!id) return setTopic({ forms: [], disabled: [] });
      const res = await tryAction(() => portalTopicFormsAction(id));
      if (res.ok) return setTopic(res.value);
      // i form del vecchio argomento non valgono per quello scelto
      setTopic({ forms: [], disabled: [] });
      setTopicFailed(id);
    });

  if (state.created) {
    return (
      <section className={cn(CARD, "flex flex-col items-center px-6 py-12 text-center")}>
        <span className="flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
          <CircleCheck aria-hidden="true" className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white/90">{t("createdTitle", { number: state.created.number })}</h2>
        {state.created.html ? (
          <div className={`mt-3 max-w-xl text-start ${RICH_CLASS}`} dangerouslySetInnerHTML={{ __html: state.created.html }} />
        ) : (
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{t("createdText")}</p>
        )}
        <Link href="/" className={cn(BTN_SECONDARY, "mt-6")}>
          {t("home")}
        </Link>
      </section>
    );
  }

  const general = state.error ? (te.has(state.error) ? te(state.error) : state.error) : null;
  const err = (k: string) => (state.errors?.[k] ? [te.has(k) ? te(k) : state.errors[k]] : undefined);

  return (
    // gli allegati già caricati restano in AttachmentMemory, fuori dal form ricostruito a ogni errore
    <AttachmentMemory>
      <form ref={formRef} action={action} key={state.nonce ?? 0} className="space-y-6">
        {general && (
          <div>
            <Alert variant="error" title={general} message="" />
          </div>
        )}

        <Panel step={1} title={t("steps.contact")} description={client ? t("steps.contactClient") : userForm?.instructions || t("steps.contactGuest")}>
          {client ? (
            <dl className="grid gap-4 text-theme-sm sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Avatar name={client.name} />
                <div className="min-w-0">
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{t("client")}</dt>
                  <dd className="truncate font-medium text-gray-900 dark:text-white/90">{client.name}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  <Mail aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{t("email")}</dt>
                  <dd className="truncate font-medium text-gray-900 dark:text-white/90">{client.email}</dd>
                </div>
              </div>
            </dl>
          ) : (
            userForm && <DynamicForm form={userForm} values={state.values} errors={state.fieldErrors} />
          )}
        </Panel>

        <Panel step={2} title={t("steps.topic")} description={t("steps.topicText")}>
          <FieldShell htmlFor="topicId" label={t("topic")} required errors={err("topicId")}>
            <select id="topicId" name="topicId" defaultValue={state.values?.topicId?.[0] ?? (defaultTopic || "")} className={selectCls} onChange={(e) => changeTopic(Number(e.target.value))}>
              <option value="">{t("selectTopic")}</option>
              {topics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name}
                </option>
              ))}
            </select>
          </FieldShell>
        </Panel>

        <Panel step={3} title={t("steps.details")} description={t("steps.detailsText")}>
          <div className="space-y-5">
            {ticketForm && (
              <DynamicForm
                form={ticketForm}
                values={state.values}
                errors={state.fieldErrors}
                hidden={topic.disabled}
                renderThread={(f) => (
                  <div className="space-y-3">
                    <FieldShell label={f.label || t("message")} hint={f.hint} required={f.required} errors={state.fieldErrors?.[f.id]?.map((c) => (tf.has(`errors.${c}`) ? tf(`errors.${c}`) : c))}>
                      <RichTextEditor name={f.key} labels={labels} placeholder={t("messagePlaceholder")} defaultValue={state.values?.[f.key]?.[0]} />
                    </FieldShell>
                    {f.config.attachments && maxFileSize > 0 && <AttachmentInput name="files" uploadUrl="/api/portal/upload" maxSize={maxFileSize} />}
                  </div>
                )}
              />
            )}
            {loading && (
              <p className="inline-flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                {t("loadingTopic")}
              </p>
            )}
            {topicFailed !== null && !loading && <RetryAlert message={t("topicLoadError")} retryLabel={t("retry")} onRetry={() => changeTopic(topicFailed)} />}
            {topic.forms.map((f) => (
              <DynamicForm key={f.id} form={f} values={state.values} errors={state.fieldErrors} showTitle />
            ))}
          </div>
        </Panel>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/" className={BTN_SECONDARY}>
            {t("cancel")}
          </Link>
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            <Send aria-hidden="true" className="size-4" />
            {pending ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </AttachmentMemory>
  );
}
