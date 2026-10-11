import { useTranslations } from "next-intl";

import PriorityBadge from "@/components/common/PriorityBadge";
import type { BoardPriority } from "@/server/domain/board/types";

/**
 * Striscia laterale della card per urgenza (i colori di osTicket sono tinte di sfondo molto chiare): un segno sottile
 * dentro il bordo, solo per le urgenze alte; le altre card restano con il bordo neutro di 1px.
 */
export function priorityStripe(
  priority: Pick<BoardPriority, "urgency"> | null,
): string {
  // solo le urgenze alte hanno colore (docs/brand/ui.md), come il pallino di PriorityBadge
  const stripe = "before:absolute before:inset-y-3 before:start-0 before:w-0.75 before:rounded-e-full before:content-['']";
  switch (priority?.urgency) {
    case 1:
      return `${stripe} before:bg-error-500`;
    case 2:
      return `${stripe} before:bg-warning-500`;
    default:
      return "";
  }
}

/** Priorità della card: lo stesso badge di liste e intestazione del ticket (PriorityBadge). */
export default function PriorityPill({
  priority,
  className,
}: {
  priority: BoardPriority | null;
  className?: string;
}) {
  const t = useTranslations("board.card");
  if (!priority) return null;
  return <PriorityBadge name={priority.name} urgency={priority.urgency} title={t("priority", { name: priority.name })} className={className} />;
}
