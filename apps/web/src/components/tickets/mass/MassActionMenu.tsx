"use client";

import { ArrowRightLeft, CircleDot, Download, Ellipsis, Trash2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import MenuButton from "@/components/common/MenuButton";
import { buttonGroupClass, dangerGhostButtonClass, ghostButtonClass, groupButtonClass, menuItemClass } from "@/components/common/menu-classes";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useWriteMode } from "@/context/WriteModeContext";

import type { MassData, MassKind } from "./types";

interface MassActionMenuProps {
  data: MassData;
  /** apre l'azione scelta (il contenitore verifica la selezione) */
  onOpen: (kind: MassKind) => void;
}

/** icone del gruppo principale: nascoste su mobile, dove il gruppo occupa tutta la riga */
const groupIcon = "hidden size-4 text-gray-400 sm:block";

/**
 * Pulsanti e menu delle azioni di massa ammesse dai permessi dell'agente (in sola lettura solo l'export),
 * in ordine di importanza: gruppo unito stato/assegna/trasferisci, "Altro" (unisci, collega), elimina in
 * rosso tenue senza bordo, export della coda in fondo a destra (non dipende dalla selezione).
 */
export default function MassActionMenu({ data, onOpen }: MassActionMenuProps) {
  const t = useTranslations("ticketEdit.mass");
  const writable = useWriteMode().canWrite("operational");
  const can = writable
    ? data.can
    : {
        ...data.can,
        status: false,
        assign: false,
        merge: false,
        link: false,
        transfer: false,
        delete: false,
      };
  const item = (label: string, k: MassKind, c: () => void) => (
    <DropdownItem key={typeof k === "object" ? `s${k.status}` : k} baseClassName={menuItemClass} onClick={() => onOpen(k)} onItemClick={c}>
      {label}
    </DropdownItem>
  );
  const grouped = (can.status && data.statuses.length > 0) || can.assign || can.transfer;

  return (
    <>
      {grouped && (
        <div role="group" aria-label={t("toolbar")} className={`${buttonGroupClass} w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none`}>
          {can.status && data.statuses.length > 0 && (
            <MenuButton label={t("status")} icon={<CircleDot aria-hidden className={groupIcon} />} className={groupButtonClass}>
              {(c) => data.statuses.map((s) => item(s.name, { status: s.id }, c))}
            </MenuButton>
          )}
          {can.assign && (
            <MenuButton label={t("assign")} icon={<UserPlus aria-hidden className={groupIcon} />} className={groupButtonClass}>
              {(c) => (
                <>
                  {item(t("claim"), "claim", c)}
                  {item(t("toAgent"), "assignAgents", c)}
                  {item(t("toTeam"), "assignTeams", c)}
                </>
              )}
            </MenuButton>
          )}
          {can.transfer && (
            <button type="button" className={groupButtonClass} onClick={() => onOpen("transfer")}>
              <ArrowRightLeft aria-hidden className={groupIcon} />
              {t("transfer")}
            </button>
          )}
        </div>
      )}
      {(can.merge || can.link) && (
        <MenuButton label={t("more")} icon={<Ellipsis aria-hidden className="size-4" />} className={ghostButtonClass}>
          {(c) => (
            <>
              {can.merge && item(t("merge"), "merge", c)}
              {can.link && item(t("link"), "link", c)}
            </>
          )}
        </MenuButton>
      )}
      {can.delete && (
        <button type="button" className={dangerGhostButtonClass} onClick={() => onOpen("delete")}>
          <Trash2 aria-hidden className="size-4" />
          {t("delete")}
        </button>
      )}
      {can.export && (
        <button type="button" className={`${ghostButtonClass} ms-auto`} onClick={() => onOpen("export")}>
          <Download aria-hidden className="size-4" />
          {t("export")}
        </button>
      )}
    </>
  );
}
