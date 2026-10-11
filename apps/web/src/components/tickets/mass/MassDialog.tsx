"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import type { MassActionState } from "@/app/[locale]/(staff)/agent/(panel)/tickets/actions-mass";
import { Modal } from "@/components/ui/modal";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

import { dialogClass, DialogFooter, DialogNotice, dialogScrollClass, DialogTitle, PrimaryButton, SecondaryButton } from "../dialog-ui";

type MassAction = (prev: MassActionState, form: FormData) => Promise<MassActionState>;

/** Modale di un'azione di massa: i ticket scelti viaggiano nei campi nascosti `tids`. */
export default function MassDialog({
  title,
  ids,
  action,
  submitLabel,
  onClose,
  onSuccess,
  warning,
  danger,
  wide,
  children,
}: {
  title: string;
  ids: number[];
  action: MassAction;
  submitLabel: string;
  onClose: () => void;
  onSuccess: (s: MassActionState) => void;
  warning?: ReactNode;
  danger?: boolean;
  wide?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("ticketEdit");
  const [state, formAction, pending] = useActionState<MassActionState, FormData>(action, {});
  const done = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (state.ok && done.current !== state.nonce) {
      done.current = state.nonce;
      onSuccess(state);
    }
  }, [state, onSuccess]);
  const submit = submitKeepingValues(formAction);
  const err = state.error ? (t.has(`mass.errors.${state.error}`) ? t(`mass.errors.${state.error}`) : t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t("errors.generic")) : "";
  return (
    <Modal isOpen onClose={onClose} className={dialogClass(wide ? "lg" : "md")}>
      <form onSubmit={submit} className={dialogScrollClass}>
        <DialogTitle>{title}</DialogTitle>
        {ids.map((id) => (
          <input key={id} type="hidden" name="tids" value={id} />
        ))}
        {warning && <DialogNotice tone="warning">{warning}</DialogNotice>}
        {err && (
          <DialogNotice tone="error" role="alert">
            {err}
          </DialogNotice>
        )}
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
