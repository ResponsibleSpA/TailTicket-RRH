import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ALL_PERMISSIONS } from "@/server/domain/admin/role";

/** Chiave di traduzione di un permesso: next-intl usa il punto per annidare, quindi "ticket.close" → "ticket_close". */
const msgKey = (perm: string) => perm.replace(/\./g, "_");

/** Chip neutro di un permesso: un permesso non è uno stato, quindi niente colori (docs/brand/ui.md). */
function PermChip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <li title={title} className="rounded-md bg-gray-50 px-2 py-0.5 text-theme-xs text-gray-700 ring-1 ring-gray-200 ring-inset dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
      {children}
    </li>
  );
}

/**
 * Permessi con etichette leggibili, raggruppati per area ("Ticket" → assegnare, chiudere…) nell'ordine di
 * RolePermission::allPermissions (ALL_PERMISSIONS). Le chiavi sconosciute restano visibili così come sono.
 */
export default function PermissionList({ perms }: { perms: readonly string[] }) {
  const t = useTranslations("permissions");
  const granted = new Set(perms);
  const known = ALL_PERMISSIONS.filter((p) => granted.has(p.key));
  const unknown = perms.filter((p) => !ALL_PERMISSIONS.some((d) => d.key === p));
  const groups = [...new Set(known.map((p) => p.group))];
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t(`groups.${g}`)}</p>
          <ul className="flex flex-wrap gap-1.5">
            {known
              .filter((p) => p.group === g)
              .map((p) => {
                // la chiave tecnica resta come suggerimento solo accanto all'etichetta tradotta
                const translated = t.has(`items.${msgKey(p.key)}`);
                return (
                  <PermChip key={p.key} title={translated ? p.key : undefined}>
                    {translated ? t(`items.${msgKey(p.key)}`) : p.title}
                  </PermChip>
                );
              })}
          </ul>
        </div>
      ))}
      {unknown.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {unknown.map((p) => (
            <PermChip key={p}>{p}</PermChip>
          ))}
        </ul>
      )}
    </div>
  );
}
