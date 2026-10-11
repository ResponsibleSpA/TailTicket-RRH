import { ArrowLeft, ExternalLink, ListChecks, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ghostButtonClass } from "@/components/common/menu-classes";
import { WriteGate } from "@/components/common/WriteGate";
import TicketActionsMenu from "@/components/tickets/TicketActionsMenu";
import TicketExtraActions from "@/components/tickets/TicketExtraActions";
import PriorityBadge from "@/components/common/PriorityBadge";
import Badge from "@/components/ui/badge/Badge";
import { Link } from "@/i18n/navigation";
import type { Agent } from "@/server/domain/staff/staff";
import type { TicketDetail } from "@/server/domain/ticket/ticket";
import { stripTags } from "@/server/format/html";

import TicketCreatedNotice from "./TicketCreatedNotice";

interface TicketHeaderProps {
  ticket: TicketDetail;
  agent: Agent;
  locale: string;
  taskCount: number;
  /** URL dell'osTicket PHP (rimando al pannello classico), se configurato */
  legacyUrl?: string;
  /** appena aperto da agente (?created=1): mostra "Ticket creato" */
  created?: boolean;
}

/** Intestazione della vista ticket: ritorno alla lista, oggetto, stato e badge, barra delle azioni. */
export default async function TicketHeader({ ticket, agent, locale, taskCount, legacyUrl, created }: TicketHeaderProps) {
  const t = await getTranslations("ticket");
  // Barra delle azioni sotto il titolo, su una riga: a sinistra il gruppo delle azioni di tutti i giorni
  // (assegna, trasferisci, stato) e "Altro"; a destra modifica, "Gestisci", task e pannello classico.
  // Gli esiti delle azioni (ActionNotice, order-last) vanno a capo sotto, a tutta larghezza.
  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <Link
          href="/agent/tickets"
          className="inline-flex items-center gap-1.5 rounded-md text-theme-sm text-gray-500 hover:text-gray-900 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("backToList")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight break-words text-gray-900 dark:text-white/90">
          <span className="font-medium text-gray-400 tabular-nums dark:text-gray-500">#{ticket.number}</span> {stripTags(ticket.subject)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge size="sm" color={ticket.status_state === "open" ? "success" : "light"}>
            {ticket.status_name}
          </Badge>
          {ticket.priority && <PriorityBadge name={ticket.priority} urgency={ticket.priority_urgency} />}
          {ticket.isoverdue && (
            <Badge size="sm" color="error">
              {t("overdue")}
            </Badge>
          )}
          {ticket.isanswered && (
            <Badge size="sm" color="info">
              {t("answered")}
            </Badge>
          )}
          {ticket.locked_by_other && (
            <Badge size="sm" color="warning" startIcon={<Lock className="size-3" />}>
              {t("locked")}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-gray-200 py-3 sm:gap-x-2 dark:border-gray-800">
        {/* in sola lettura le barre delle azioni non compaiono (il banner del guscio spiega perché) */}
        <WriteGate>
          <TicketActionsMenu ticket={ticket} agent={agent} locale={locale} />
          <span aria-hidden className="hidden flex-1 lg:block" />
          <TicketExtraActions ticket={ticket} agent={agent} locale={locale} />
        </WriteGate>
        <Link href={`/agent/tasks?ticket=${ticket.ticket_id}`} className={ghostButtonClass}>
          <ListChecks aria-hidden className="hidden size-4 sm:block" />
          {t("tasks", { count: taskCount })}
        </Link>
        {legacyUrl && (
          <a href={`${legacyUrl}/scp/tickets.php?id=${ticket.ticket_id}`} className={`${ghostButtonClass} whitespace-nowrap`}>
            <ExternalLink aria-hidden className="size-4" />
            {t("openLegacy")}
          </a>
        )}
        {created && <TicketCreatedNotice text={t("created")} closeLabel={t("closeNotice")} />}
      </div>
    </div>
  );
}
