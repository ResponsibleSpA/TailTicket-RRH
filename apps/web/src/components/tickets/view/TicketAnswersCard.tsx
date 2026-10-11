import { getTranslations } from "next-intl/server";

import type { TicketAnswer } from "@/server/domain/ticket/view";

import InfoRow from "./InfoRow";
import SideCard from "./SideCard";

/** Scheda "Campi aggiuntivi": risposte dei form dinamici del ticket. */
export default async function TicketAnswersCard({ answers }: { answers: TicketAnswer[] }) {
  const t = await getTranslations("ticket");
  return (
    <SideCard title={t("additionalFields")}>
      <dl className="divide-y divide-gray-100 dark:divide-gray-800">
        {answers.map((a) => (
          <InfoRow key={`${a.form_title}-${a.name}`} label={a.label}>
            {a.value}
          </InfoRow>
        ))}
      </dl>
    </SideCard>
  );
}
