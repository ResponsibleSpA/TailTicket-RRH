"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import type { TicketActionState } from "@/app/[locale]/(staff)/agent/(panel)/tickets/[id]/actions-assign";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Modal } from "@/components/ui/modal";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

import { dialogClass, DialogFooter, DialogNotice, DialogTitle, PrimaryButton, SecondaryButton } from "../dialog-ui";

type TicketAction = (prev: TicketActionState, form: FormData) => Promise<TicketActionState>;

interface ActionDialogProps {
  ticketId: number;
  title: string;
  /** messaggio informativo sopra il form (es. assegnatario attuale) */
  notice?: ReactNode;
  /** avviso (giallo) sopra il form, es. Ticket::isCloseable() */
  warning?: ReactNode;
  action: TicketAction;
  submitLabel: string;
  /** segnaposto del campo commenti; omesso = nessun campo commenti */
  commentsPlaceholder?: string;
  onClose: () => void;
  /** azione riuscita (dopo l'eventuale conferma dell'avviso): chiusura, messaggio e aggiornamento */
  onSuccess: (state: TicketActionState) => void;
  /** contenuto fuori dal form principale (es. gestione dei referral, con un proprio form) */
  aside?: ReactNode;
  children?: ReactNode;
}

/** Messaggio d'errore tradotto di un'azione (chiave errors.<codice>, altrimenti generico). */
function useActionError() {
  const t = useTranslations("ticketActions");
  return (state: TicketActionState) => (state.error ? (t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t("errors.generic")) : "");
}

/** Riquadro d'errore con l'eventuale dettaglio tecnico (messaggio del dominio). */
export function ErrorBox({ state }: { state: TicketActionState }) {
  const errorOf = useActionError();
  const error = errorOf(state);
  if (!error) return null;
  return (
    <DialogNotice tone="error" role="alert">
      {error}
      {/* dettaglio del dominio (testo PHP in inglese) solo per gli errori generici */}
      {state.detail && state.error === "status_failed" && <span className="block text-theme-xs opacity-80">{state.detail}</span>}
    </DialogNotice>
  );
}

/**
 * Finestra modale di un'azione: form con server action, commenti opzionali, errori tradotti.
 * Con esito positivo chiama onSuccess; se il dominio restituisce un avviso (es. figli non aggiornati)
 * lo mostra e attende la chiusura esplicita.
 */
export default function ActionDialog({
  ticketId,
  title,
  notice,
  warning,
  action,
  submitLabel,
  commentsPlaceholder,
  onClose,
  onSuccess,
  aside,
  children,
}: ActionDialogProps) {
  const t = useTranslations("ticketActions");
  const tc = useTranslations("composer");
  const [state, formAction, pending] = useActionState<TicketActionState, FormData>(action, {});
  const done = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.ok && !state.warn && done.current !== state.nonce) {
      done.current = state.nonce;
      onSuccess(state);
    }
  }, [state, onSuccess]);

  const warned = state.ok && !!state.warn;
  const submit = submitKeepingValues(formAction);

  return (
    <Modal isOpen onClose={warned ? () => onSuccess(state) : onClose} className={dialogClass()}>
      <div className="space-y-5">
        <DialogTitle>{title}</DialogTitle>
        {warned ? (
          <>
            <DialogNotice tone="warning" role="status">
              {t("childrenFailed", { tickets: state.warn ?? "" })}
            </DialogNotice>
            <DialogFooter>
              <PrimaryButton type="button" onClick={() => onSuccess(state)}>
                {t("close")}
              </PrimaryButton>
            </DialogFooter>
          </>
        ) : (
          <>
            {aside}
            <form onSubmit={submit} className="space-y-5">
              <input type="hidden" name="ticketId" value={ticketId} />
              {notice && <DialogNotice tone="info">{notice}</DialogNotice>}
              {warning && <DialogNotice tone="warning">{warning}</DialogNotice>}
              <ErrorBox state={state} />
              {children}
              {commentsPlaceholder !== undefined && (
                <RichTextEditor
                  name="comments"
                  placeholder={commentsPlaceholder}
                  minHeight={90}
                  labels={{
                    bold: tc("editor.bold"),
                    italic: tc("editor.italic"),
                    underline: tc("editor.underline"),
                    bullets: tc("editor.bullets"),
                    numbers: tc("editor.numbers"),
                    link: tc("editor.link"),
                    quote: tc("editor.quote"),
                    linkPrompt: tc("editor.linkPrompt"),
                  }}
                />
              )}
              <DialogFooter>
                <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
                <PrimaryButton disabled={pending}>{pending ? t("working") : submitLabel}</PrimaryButton>
              </DialogFooter>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
