"use client";

import { ArrowRightLeft, CircleDot, Ellipsis, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import type { TicketActionState } from "@/app/[locale]/(staff)/agent/(panel)/tickets/[id]/actions-assign";
import ActionNotice from "@/components/common/ActionNotice";
import MenuButton from "@/components/common/MenuButton";
import { buttonGroupClass, ghostButtonClass, groupButtonClass, menuItemClass } from "@/components/common/menu-classes";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useRouter } from "@/i18n/navigation";

import { useTicketNotice } from "../view/use-ticket-notice";

import ActionDialogs from "./ActionDialogs";
import type { ActionKind, TicketActionsData } from "./types";

/** icone dei pulsanti del gruppo: nascoste su mobile, dove il gruppo occupa tutta la riga */
const groupIcon = "hidden size-4 text-gray-400 sm:block";

/**
 * Barra azioni della vista ticket: assegna, trasferisci, stato (gruppo unito, le azioni di tutti i
 * giorni) e "Altro" come pulsante di testo. Dopo un'azione riuscita segue i
 * data-redirect di ticket-view.inc.php/status-options.tmpl.php: assegnazione, trasferimento e chiusura
 * tornano alla lista dei ticket; presa in carico, rilascio, segna risposto, referral e riapertura
 * ricaricano la vista e mostrano l'esito.
 */
export default function TicketActionsBar({ data }: { data: TicketActionsData }) {
  const t = useTranslations("ticketActions");
  const router = useRouter();
  const [kind, setKind] = useState<ActionKind | null>(null);
  // un solo esito visibile nella testata: il nuovo sostituisce quelli delle altre barre
  const [notice, setNotice] = useTicketNotice<string>();
  const closeDialog = useCallback(() => setKind(null), []);

  const onSuccess = useCallback(
    (state: TicketActionState) => {
      const k = kind;
      setKind(null);
      if (k === null) return;
      const status = typeof k === "object" ? data.statuses.find((s) => s.id === k.status) : undefined;
      const done = k === "assignAgent" || k === "assignTeam" ? "assign" : k === "transfer" ? "transfer" : status && status.state !== "open" ? "status" : null;
      if (done) {
        // la lista mostra l'esito (TicketDoneNotice), come il messaggio di sessione del PHP
        router.push(`/agent/tickets?done=${done}&tid=${data.ticketId}`);
        return;
      }
      let text: string;
      if (status) text = t("done.status", { status: status.name });
      else if (state.removed !== undefined) text = t("done.removed", { count: state.removed });
      else text = t(`done.${k as Exclude<ActionKind, object>}`);
      setNotice(text);
      router.refresh();
    },
    [kind, data.statuses, data.ticketId, router, t, setNotice],
  );

  const item = (label: string, k: ActionKind, close: () => void) => (
    <DropdownItem key={typeof k === "object" ? `s${k.status}` : k} baseClassName={menuItemClass} onClick={() => setKind(k)} onItemClick={close}>
      {label}
    </DropdownItem>
  );
  const { can } = data;
  const hasMore = can.release || can.mark || can.refer;
  // status-options.tmpl.php: stati diversi dall'attuale
  const menuStatuses = data.statuses.filter((s) => s.id !== data.currentStatusId);

  const grouped = can.assign || can.transfer || (can.status && menuStatuses.length > 0);

  return (
    <>
      {grouped && (
        <div role="group" aria-label={t("toolbar")} className={`${buttonGroupClass} w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none`}>
          {can.assign && (
            <MenuButton width="w-60" label={data.isAssigned ? t("reassign") : t("assign")} icon={<UserPlus aria-hidden className={groupIcon} />} className={groupButtonClass}>
              {(close) => (
                <>
                  {can.claim && item(t("claim"), "claim", close)}
                  {item(t("toAgent"), "assignAgent", close)}
                  {item(t("toTeam"), "assignTeam", close)}
                </>
              )}
            </MenuButton>
          )}
          {can.transfer && (
            <button type="button" onClick={() => setKind("transfer")} className={groupButtonClass}>
              <ArrowRightLeft aria-hidden className={groupIcon} />
              {t("transfer")}
            </button>
          )}
          {can.status && menuStatuses.length > 0 && (
            <MenuButton width="w-60" label={t("changeStatus")} icon={<CircleDot aria-hidden className={groupIcon} />} className={groupButtonClass}>
              {(close) => menuStatuses.map((s) => item(s.name, { status: s.id }, close))}
            </MenuButton>
          )}
        </div>
      )}
      {hasMore && (
        <MenuButton width="w-60" label={t("more")} icon={<Ellipsis aria-hidden className="hidden size-4 sm:block" />} className={ghostButtonClass}>
          {(close) => (
            <>
              {can.release && item(t("releaseMenu"), "release", close)}
              {can.mark && (data.isAnswered ? item(t("markUnanswered"), "markUnanswered", close) : item(t("markAnswered"), "markAnswered", close))}
              {can.refer && item(t("manageReferrals"), "refer", close)}
            </>
          )}
        </MenuButton>
      )}
      {notice && (
        <ActionNotice closeLabel={t("close")} onClose={() => setNotice(null)}>
          {notice}
        </ActionNotice>
      )}
      {kind !== null && <ActionDialogs kind={kind} data={data} onClose={closeDialog} onSuccess={onSuccess} />}
    </>
  );
}
