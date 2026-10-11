import { useTranslations } from "next-intl";

import Badge from "@/components/ui/badge/Badge";
import type { BoardCard } from "@/server/domain/board/types";

/** Scadenza della card (scaduto / scade presto): badge di stato tenue, la data completa nel title. */
export default function DueBadge({ card }: { card: Pick<BoardCard, "overdue" | "dueSoon" | "dueLabel"> }) {
  const t = useTranslations("board.card");
  if (!card.overdue && !card.dueSoon) return null;
  return (
    <span className="inline-flex" title={card.dueLabel ? t("due", { date: card.dueLabel }) : undefined}>
      <Badge size="sm" color={card.overdue ? "error" : "warning"}>
        {card.overdue ? t("overdue") : t("dueSoon")}
      </Badge>
    </span>
  );
}
