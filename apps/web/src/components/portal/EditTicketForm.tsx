"use client";

import { useActionState } from "react";

import { useTranslations } from "next-intl";

import DynamicForm from "@/components/forms/dynamic/DynamicForm";
import { ReadOnlyNotice, WriteGate } from "@/components/common/WriteGate";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import type { DynamicFormView } from "@/lib/forms/dynamic-field";

import { editTicketAction, type EditState } from "@/app/[locale]/(client)/actions";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

import { Panel } from "./PortalUi";
import { BTN_PRIMARY, BTN_SECONDARY } from "./styles";

type EditTicketFormProps = {
  ticketId: number;
  forms: DynamicFormView[];
  values: Record<string, string[]>;
};

/** In sola lettura un avviso per i clienti prende il posto del form. */
export default function EditTicketForm(props: EditTicketFormProps) {
  return (
    <WriteGate fallback={<ReadOnlyNotice portal />}>
      <EditTicketFormInner {...props} />
    </WriteGate>
  );
}

/** tickets.php?a=edit (edit.inc.php): campi del ticket modificabili dal proprietario. */
function EditTicketFormInner({ ticketId, forms, values }: EditTicketFormProps) {
  const t = useTranslations("portal.ticket");
  const te = useTranslations("portal.errors");
  const [state, action, pending] = useActionState<EditState, FormData>(editTicketAction, {});
  const submit = submitKeepingValues(action);
  return (
    <form onSubmit={submit} className="space-y-6">
      {state.error && state.error !== "invalid" && <Alert variant="error" title={te.has(state.error) ? te(state.error) : state.error} message="" />}
      <input type="hidden" name="ticketId" value={ticketId} />
      {forms.map((f) => (
        <Panel key={f.id} title={f.title || undefined}>
          <DynamicForm form={f} values={state.values ?? values} errors={state.fieldErrors} />
        </Panel>
      ))}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={`/tickets/${ticketId}`} className={BTN_SECONDARY}>
          {t("cancel")}
        </Link>
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {t("save")}
        </button>
      </div>
    </form>
  );
}
