import { getTranslations } from "next-intl/server";

import type { TicketDetail } from "@/server/domain/ticket/ticket";

import InfoRow from "./InfoRow";
import SideCard from "./SideCard";

/** Scheda "Utente": contatti dell'utente del ticket e organizzazione. */
export default async function TicketUserCard({ ticket }: { ticket: TicketDetail }) {
  const t = await getTranslations("ticket");
  return (
    <SideCard title={t("user")}>
      <dl className="divide-y divide-gray-100 dark:divide-gray-800">
        <InfoRow label={t("name")}>{ticket.user_name}</InfoRow>
        <InfoRow label={t("email")} truncate>{ticket.user_email}</InfoRow>
        <InfoRow label={t("phone")}>{ticket.user_phone}</InfoRow>
        <InfoRow label={t("organization")}>{ticket.org_name}</InfoRow>
      </dl>
    </SideCard>
  );
}
