import { Lock, Paperclip } from "lucide-react";
import { renderThreadBody } from "@/components/common/thread-body";
import { ThreadEntryType } from "@/lib/osticket/object-types";
import type { ThreadEntryView } from "@/server/domain/ticket/ticket";
import { formatDbDate, isoOf } from "@/server/format/datetime";
import { cn } from "@/utils";
import { withBase } from "@/lib/base-path";
import { initials } from "@/lib/format/initials";
import { humanSize } from "@/lib/format/size";

/**
 * Messaggi e risposte sono card neutre (si distinguono per l'avatar); le note interne restano tinte di
 * giallo perché è uno stato reale: non sono visibili all'utente (docs/brand/ui.md).
 */
const KIND_STYLE: Record<ThreadEntryView["type"], string> = {
  M: "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3",
  R: "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3",
  N: "border-warning-200 bg-warning-25 dark:border-warning-500/25 dark:bg-warning-500/5",
};

const AVATAR_STYLE: Record<ThreadEntryView["type"], string> = {
  M: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
  R: "bg-brand-50 text-brand-700 ring-1 ring-brand-500/15 ring-inset dark:bg-brand-500/15 dark:text-brand-300",
  N: "bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
};

export default function ThreadEntryCard({
  entry,
  tz,
  locale,
  labels,
  iframeWhitelist,
}: {
  entry: ThreadEntryView;
  tz: string;
  locale: string;
  /** `sources`: origini tradotte (le stesse di lista e dettagli) */
  labels: {
    note: string;
    reply: string;
    message: string;
    edited: string;
    via: string;
    sources?: Record<string, string>;
  };
  iframeWhitelist: string[];
}) {
  const kindLabel = entry.type === ThreadEntryType.NOTE ? labels.note : entry.type === ThreadEntryType.RESPONSE ? labels.reply : labels.message;
  const files = entry.attachments.filter((a) => !a.inline);
  return (
    <article id={`entry-${entry.id}`} className={cn("rounded-2xl border", KIND_STYLE[entry.type])}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-inherit px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-theme-xs font-semibold", AVATAR_STYLE[entry.type])}>
            {initials(entry.poster)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-theme-sm font-semibold text-gray-900 dark:text-white/90">{entry.poster}</p>
            <p className={cn("flex items-center gap-1 text-theme-xs", entry.type === ThreadEntryType.NOTE ? "text-warning-700 dark:text-warning-400" : "text-gray-500 dark:text-gray-400")}>
              {entry.type === ThreadEntryType.NOTE && <Lock aria-hidden className="size-3" />}
              {kindLabel}
              {entry.source ? ` · ${labels.via} ${labels.sources?.[entry.source] ?? entry.source}` : ""}
            </p>
          </div>
        </div>
        <time dateTime={isoOf(entry.created)} className="ms-12 text-theme-xs text-gray-500 tabular-nums sm:ms-0 dark:text-gray-400">
          {formatDbDate(entry.created, tz, locale, "full")}
          {entry.editor_name ? ` · ${labels.edited} ${entry.editor_name}` : ""}
        </time>
      </header>
      {entry.title && entry.type === ThreadEntryType.NOTE && <p className="px-4 pt-4 text-theme-sm font-semibold text-gray-800 sm:px-5 dark:text-white/90">{entry.title}</p>}
      <div
        className="thread-body prose prose-sm dark:prose-invert max-w-none px-4 py-4 break-words text-gray-700 sm:px-5 dark:text-gray-300"
        dangerouslySetInnerHTML={{
          __html: renderThreadBody(entry, { area: "agent", iframeWhitelist }),
        }}
      />
      {files.length > 0 && (
        <footer className="flex flex-wrap gap-2 border-t border-inherit px-4 py-3 sm:px-5">
          {files.map((a) => (
            <a
              key={a.id}
              href={withBase(`/api/agent/file/${a.key}`)}
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-theme-xs text-gray-700 hover:border-gray-300 hover:text-gray-900 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:text-white"
            >
              <Paperclip aria-hidden className="size-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{a.name}</span>
              <span className="shrink-0 text-gray-400 tabular-nums">{humanSize(a.size)}</span>
            </a>
          ))}
        </footer>
      )}
    </article>
  );
}
