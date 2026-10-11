import { getTranslations } from "next-intl/server";

import type { TicketCollaborator } from "@/server/domain/ticket/view";

import SideCard from "./SideCard";

/** Scheda "Collaboratori" del thread (i disattivati barrati). */
export default async function TicketCollaboratorsCard({ collaborators }: { collaborators: TicketCollaborator[] }) {
  const t = await getTranslations("ticket");
  return (
    <SideCard title={t("collaborators")}>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {collaborators.map((c) => (
          <li key={c.id} className="min-w-0 py-2 text-theme-sm">
            <p className={c.active ? "truncate text-gray-800 dark:text-white/90" : "truncate text-gray-400 line-through dark:text-gray-500"}>{c.name}</p>
            {c.email && (
              <p title={c.email} className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                {c.email}
              </p>
            )}
          </li>
        ))}
      </ul>
    </SideCard>
  );
}
