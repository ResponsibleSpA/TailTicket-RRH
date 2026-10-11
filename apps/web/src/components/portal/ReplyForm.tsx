"use client";

import { useActionState } from "react";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import RichTextEditor from "@/components/editor/RichTextEditor";
import AttachmentInput from "@/components/forms/AttachmentInput";
import { ReadOnlyNotice, WriteGate } from "@/components/common/WriteGate";
import Alert from "@/components/ui/alert/Alert";

import { replyAction, type ReplyState } from "@/app/[locale]/(client)/actions";

import { BTN_PRIMARY, CARD } from "./styles";
import { useEditorLabels } from "./useEditorLabels";
import { cn } from "@/utils";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

type ReplyFormProps = {
  ticketId: number;
  reopen: boolean;
  attachments: boolean;
  maxFileSize: number;
  posted?: boolean;
};

/** In sola lettura un avviso per i clienti prende il posto del form. */
export default function ReplyForm(props: ReplyFormProps) {
  return (
    <WriteGate fallback={<ReadOnlyNotice portal />}>
      <ReplyFormInner {...props} />
    </WriteGate>
  );
}

/**
 * Risposta del cliente (view.inc.php, form "Post a Reply"). Dopo un invio riuscito la pagina rimonta il
 * form (key) e mostra l'esito qui (`posted`), dove porta il redirect a #reply.
 */
function ReplyFormInner({ ticketId, reopen, attachments, maxFileSize, posted }: ReplyFormProps) {
  const t = useTranslations("portal.ticket");
  const te = useTranslations("portal.errors");
  const labels = useEditorLabels();
  const [state, action, pending] = useActionState<ReplyState, FormData>(replyAction, {});
  const submit = submitKeepingValues(action);
  return (
    <form id="reply" onSubmit={submit} className={cn(CARD, "scroll-mt-24 space-y-4 p-5 sm:p-6")}>
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{t("replyTitle")}</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t("replyHint")}</p>
      </div>
      {posted && !state.error && (
        <div>
          <Alert variant="success" title={t("posted")} message="" />
        </div>
      )}
      {state.error && (
        <div>
          <Alert variant="error" title={te.has(state.error) ? te(state.error) : state.error} message="" />
        </div>
      )}
      <input type="hidden" name="ticketId" value={ticketId} />
      <RichTextEditor name="message" labels={labels} placeholder={t("replyPlaceholder")} />
      {attachments && maxFileSize > 0 && <AttachmentInput name="files" uploadUrl="/api/portal/upload" maxSize={maxFileSize} />}
      {reopen && <Alert variant="warning" title={t("reopenOnReply")} message="" />}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          <Send aria-hidden="true" className="size-4" />
          {pending ? t("posting") : t("post")}
        </button>
      </div>
    </form>
  );
}
