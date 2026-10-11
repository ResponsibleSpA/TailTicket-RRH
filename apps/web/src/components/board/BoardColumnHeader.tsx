"use client";

import { useTranslations } from "next-intl";

import type { BoardColumn } from "@/server/domain/board/types";
import { cn } from "@/utils";

import { ColumnMark } from "./ColumnTitle";

/** Intestazione di una colonna: indicatore, titolo, numero di ticket. */
export default function BoardColumnHeader({
  column,
  count,
  dimmed,
  isMeLabel,
}: {
  column: BoardColumn;
  count: number;
  /** colonna non ammessa per la card trascinata */
  dimmed?: boolean;
  isMeLabel?: boolean;
}) {
  const t = useTranslations("board.column");
  return (
    <div
      className={cn(
        // intestazione piatta (stile Linear): indicatore, titolo e contatore discreto sopra la colonna
        "flex min-h-9 snap-start items-center gap-2 px-1.5 transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      <ColumnMark column={column} />
      <h2
        className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white/90"
        title={column.title}
      >
        {column.title}
        {isMeLabel && column.isMe && (
          <span className="ms-1.5 text-theme-xs font-normal text-gray-500 dark:text-gray-400">
            ({t("me")})
          </span>
        )}
      </h2>
      <span
        className="me-auto text-theme-sm text-gray-400 tabular-nums dark:text-gray-500"
        aria-label={t("count", { count })}
      >
        {count}
      </span>
    </div>
  );
}
