"use client";

import { useTranslations } from "next-intl";
import type React from "react";

import { Link } from "@/i18n/navigation";
import { Lock, MessageSquare, Paperclip } from "lucide-react";
import type { BoardCard } from "@/server/domain/board/types";
import { cn } from "@/utils";

import AssigneeAvatar from "./AssigneeAvatar";
import DueBadge from "./DueBadge";
import PriorityPill, { priorityStripe } from "./PriorityPill";

interface BoardCardItemProps {
  card: BoardCard;
  /** la card si può trascinare */
  draggable: boolean;
  /** è la card trascinata (segnaposto attenuato) */
  dragging?: boolean;
  /** spostamento in corso sul server */
  pending?: boolean;
  /** "fantasma" che segue il puntatore */
  ghost?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  /** clic semplice sulla card: anteprima (ctrl/cmd/clic centrale aprono il ticket) */
  onOpen?: () => void;
  /** menu delle azioni (Sposta in…) */
  menu?: React.ReactNode;
  shouldSuppressClick?: () => boolean;
}

/** Card di un ticket nella board (stile Jira): numero, oggetto, utente, priorità, scadenze, contatori, assegnatario. */
export default function BoardCardItem({
  card,
  draggable,
  dragging,
  pending,
  ghost,
  onPointerDown,
  onOpen,
  menu,
  shouldSuppressClick,
}: BoardCardItemProps) {
  const t = useTranslations("board.card");
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldSuppressClick?.()) {
      e.preventDefault();
      return;
    }
    if (
      !onOpen ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    )
      return;
    e.preventDefault();
    onOpen();
  };

  return (
    <article
      data-card-id={card.id}
      onPointerDown={onPointerDown}
      onContextMenu={
        draggable
          ? (e) =>
              (e.nativeEvent as PointerEvent).pointerType === "touch" &&
              e.preventDefault()
          : undefined
      }
      aria-busy={pending || undefined}
      className={cn(
        // card neutra (docs/brand/ui.md): bordo 1px, ombra minima che cresce al passaggio del mouse
        "group relative rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs transition-[box-shadow,border-color] select-none",
        "hover:border-gray-300 hover:shadow-theme-sm has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-brand-500/30",
        "[-webkit-touch-callout:none] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:hover:border-gray-700",
        priorityStripe(card.priority),
        draggable && "cursor-grab touch-manipulation active:cursor-grabbing",
        dragging && "border-dashed opacity-40 shadow-none",
        pending && "animate-pulse",
        ghost && "cursor-grabbing border-gray-300 shadow-theme-xl ring-1 ring-brand-500/30 dark:border-gray-700 dark:shadow-theme-xl",
      )}
    >
      <div className="flex items-start gap-2">
        <Link
          href={`/agent/tickets/${card.id}`}
          draggable={false}
          onClick={onClick}
          aria-label={t("open", { number: card.number })}
          className="min-w-0 flex-1 outline-hidden after:absolute after:inset-0 after:rounded-xl after:content-['']"
        >
          <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
            <span>#{card.number}</span>
            {card.lockedBy && (
              <span title={t("locked", { name: card.lockedBy })} className="text-warning-600 dark:text-warning-400">
                <Lock className="size-3.5" aria-hidden />
                <span className="sr-only">{t("locked", { name: card.lockedBy })}</span>
              </span>
            )}
          </span>
          <span className="mt-0.5 line-clamp-2 text-sm leading-snug font-medium break-words text-gray-900 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
            {card.subject || "—"}
          </span>
        </Link>
        {menu && (
          <div data-no-drag className="relative z-1 -me-1 -mt-1 shrink-0">
            {menu}
          </div>
        )}
      </div>

      <p
        className="mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400"
        title={[card.user, card.dept, card.topic].filter(Boolean).join(" · ")}
      >
        {card.user}
        {card.dept && <span className="text-gray-400 dark:text-gray-500"> · {card.dept}</span>}
      </p>

      {(card.overdue || card.dueSoon) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <DueBadge card={card} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <PriorityPill priority={card.priority} />
        <div className="flex min-w-0 flex-1 items-center gap-2 text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
          {card.threadCount > 0 && (
            <span className="inline-flex items-center gap-0.5" title={t("thread", { count: card.threadCount })}>
              <MessageSquare className="size-3.5" aria-hidden />
              {card.threadCount}
              <span className="sr-only">
                {t("thread", { count: card.threadCount })}
              </span>
            </span>
          )}
          {card.attachments > 0 && (
            <span className="inline-flex items-center gap-0.5" title={t("attachments", { count: card.attachments })}>
              <Paperclip className="size-3.5" aria-hidden />
              {card.attachments}
              <span className="sr-only">
                {t("attachments", { count: card.attachments })}
              </span>
            </span>
          )}
          <span
            className="truncate"
            title={t("updated", { when: card.updatedTitle })}
          >
            {card.updatedLabel}
          </span>
        </div>
        <AssigneeAvatar assignee={card.assignee} />
      </div>
    </article>
  );
}
