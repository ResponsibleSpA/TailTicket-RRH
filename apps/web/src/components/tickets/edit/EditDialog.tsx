"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import type { EditActionState } from "@/app/[locale]/(staff)/agent/(panel)/tickets/[id]/actions-edit";
import { Modal } from "@/components/ui/modal";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

import { dialogClass, DialogFooter, DialogNotice, dialogScrollClass, DialogTitle, PrimaryButton, SecondaryButton } from "../dialog-ui";

type EditAction = (prev: EditActionState, form: FormData) => Promise<EditActionState>;

/** Messaggio d'errore tradotto (ticketEdit.errors.<codice>) con gli eventuali errori dei campi. */
export function EditErrorBox({ state }: { state: EditActionState }) {
  const t = useTranslations("ticketEdit");
  if (!state.error) return null;
  const msg = (code: string) => (t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.generic"));
  const fieldMsg = (code: string) => (t.has(`fieldErrors.${code}`) ? t(`fieldErrors.${code}`) : code);
  return (
    <DialogNotice tone="error" role="alert">
      {msg(state.error)}
      {state.fields && (
        <ul className="mt-1 list-disc ps-5 text-theme-xs">
          {Object.entries(state.fields).map(([k, codes]) => (
            <li key={k}>
              {t.has(`fieldNames.${k.replace(/^field\.\d+$/, "field")}`) ? t(`fieldNames.${k.replace(/^field\.\d+$/, "field")}`) : k}: {codes.map(fieldMsg).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </DialogNotice>
  );
}

interface Props {
  ticketId: number;
  title: string;
  action: EditAction;
  submitLabel: string;
  onClose: () => void;
  onSuccess: (state: EditActionState) => void;
  /** avviso (giallo) sopra il form */
  warning?: ReactNode;
  /** pulsante di conferma rosso (eliminazione) */
  danger?: boolean;
  wide?: boolean;
  children?: ReactNode;
}

/** Finestra modale con form e server action dell'area "ticketedit". */
export default function EditDialog({ ticketId, title, action, submitLabel, onClose, onSuccess, warning, danger, wide, children }: Props) {
  const t = useTranslations("ticketEdit");
  const [state, formAction, pending] = useActionState<EditActionState, FormData>(action, {});
  const done = useRef<number | undefined>(undefined);
  const errorBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok && done.current !== state.nonce) {
      done.current = state.nonce;
      onSuccess(state);
    }
  }, [state, onSuccess]);
  // l'errore è in cima alla finestra e il pulsante in fondo: lo si porta in vista
  useEffect(() => {
    if (state.error)
      errorBox.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [state]);

  const submit = submitKeepingValues(formAction);

  return (
    <Modal isOpen onClose={onClose} className={dialogClass(wide ? "xl" : "md")}>
      <form onSubmit={submit} className={dialogScrollClass}>
        <DialogTitle>{title}</DialogTitle>
        <input type="hidden" name="ticketId" value={ticketId} />
        {warning && <DialogNotice tone="warning">{warning}</DialogNotice>}
        <div ref={errorBox} className="empty:hidden">
          <EditErrorBox state={state} />
        </div>
        {children}
        <DialogFooter>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton disabled={pending} danger={danger}>
            {pending ? t("working") : submitLabel}
          </PrimaryButton>
        </DialogFooter>
      </form>
    </Modal>
  );
}
