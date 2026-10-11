import { Info } from "lucide-react";

/**
 * Nota per chi gestisce KB o risposte predefinite: la nuova interfaccia le mostra in sola lettura, la
 * creazione e la modifica restano nel pannello classico (scp/kb.php, scp/canned.php).
 * Nota discreta e neutra (docs/brand/ui.md: niente sfondi colorati grandi per un'informazione di contesto).
 */
export default function ManageInClassic({ note, linkLabel, href }: { note: string; linkLabel: string; href?: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-theme-sm text-gray-600 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">
      <Info className="mt-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
      <span>
        {note}{" "}
        {href && (
          <a href={href} className="font-medium text-brand-600 hover:underline dark:text-brand-400" target="_blank" rel="noreferrer">
            {linkLabel}
          </a>
        )}
      </span>
    </p>
  );
}
