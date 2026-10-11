"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  addCollaboratorAction,
  searchUsersAction,
  updateCollaboratorsAction,
  type EditActionState,
} from "@/app/[locale]/(staff)/agent/(panel)/tickets/[id]/actions-edit";
import UserPicker from "@/components/tickets/create/UserPicker";
import { Modal } from "@/components/ui/modal";

import { dialogClass, DialogFooter, dialogScrollClass, DialogTitle, PrimaryButton, SecondaryButton } from "../../dialog-ui";
import { EditErrorBox } from "../EditDialog";
import type { TicketExtraData } from "../types";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

/** Esito positivo di un form: richiama `fn` una sola volta per invio. */
function useOnOk(state: EditActionState, fn: () => void) {
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (state.ok && seen.current !== state.nonce) {
      seen.current = state.nonce;
      fn();
    }
  }, [state, fn]);
}

/**
 * Gestione dei collaboratori (templates/collaborators.tmpl.php): attivi (`cid[]`), da rimuovere
 * (`del[]`) e aggiunta di un utente esistente (add-collaborator).
 */
export default function CollaboratorsDialog({
  data,
  onClose,
  onSuccess,
  onAdded,
}: {
  data: TicketExtraData;
  onClose: () => void;
  onSuccess: (s: EditActionState) => void;
  onAdded: () => void;
}) {
  const t = useTranslations("ticketEdit");
  const [state, action, pending] = useActionState<EditActionState, FormData>(updateCollaboratorsAction, {});
  const [addState, addAction, adding] = useActionState<EditActionState, FormData>(addCollaboratorAction, {});
  const [picked, setPicked] = useState<{ id: number; name: string } | null>(null);
  // esito dell'aggiunta già superato da una nuova scelta: il suo errore non si mostra più
  const [pickedAfter, setPickedAfter] = useState<EditActionState | null>(null);
  useOnOk(state, () => onSuccess(state));
  useOnOk(addState, () => {
    setPicked(null);
    onAdded();
  });

  return (
    <Modal isOpen onClose={onClose} className={dialogClass()}>
      <div className={dialogScrollClass}>
        <DialogTitle>{t("collabTitle", { number: data.number })}</DialogTitle>
        <form onSubmit={submitKeepingValues(action)} className="space-y-4">
          <input type="hidden" name="ticketId" value={data.ticketId} />
          <EditErrorBox state={state} />
          {data.collaborators.length === 0 ? (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">{t("noCollaborators")}</p>
          ) : (
            <>
              <table className="w-full text-theme-sm">
                <thead>
                  <tr className="text-theme-xs text-gray-500 uppercase dark:text-gray-400">
                    <th className="py-2 text-start">{t("collaborator")}</th>
                    <th className="py-2 text-center">{t("active")}</th>
                    <th className="py-2 text-center">{t("remove")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.collaborators.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-0 py-2.5 pe-3">
                        <p className="truncate text-gray-800 dark:text-white/90">{c.name}</p>
                        <p title={c.email} className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {c.email}
                        </p>
                      </td>
                      <td className="py-2 text-center">
                        <input type="checkbox" name="cid" value={c.id} defaultChecked={c.active} aria-label={t("collabActive", { name: c.name })} className="size-4 accent-brand-500" />
                      </td>
                      <td className="py-2 text-center">
                        <input type="checkbox" name="del" value={c.id} aria-label={t("collabRemove", { name: c.name })} className="size-4 accent-error-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <PrimaryButton disabled={pending}>{pending ? t("working") : t("saveChanges")}</PrimaryButton>
              </div>
            </>
          )}
        </form>
        <form onSubmit={submitKeepingValues(addAction)} className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <input type="hidden" name="ticketId" value={data.ticketId} />
          <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{t("addCollaborator")}</p>
          {pickedAfter !== addState && <EditErrorBox state={addState} />}
          <UserPicker
            id="collab-user"
            placeholder={t("searchUser")}
            search={searchUsersAction}
            onPick={(u) => {
              setPicked(u);
              setPickedAfter(addState);
            }}
            exclude={[data.edit.userId, ...data.collaborators.map((c) => c.userId)]}
          />
          {picked && (
            <div className="flex items-center justify-between gap-3 text-theme-sm text-gray-800 dark:text-white/90">
              <span className="min-w-0 truncate">{picked.name}</span>
              <input type="hidden" name="userId" value={picked.id} />
              <SecondaryButton type="submit" disabled={adding}>
                {adding ? t("working") : t("add")}
              </SecondaryButton>
            </div>
          )}
        </form>
        <DialogFooter>
          <SecondaryButton onClick={onClose}>{t("close")}</SecondaryButton>
        </DialogFooter>
      </div>
    </Modal>
  );
}
