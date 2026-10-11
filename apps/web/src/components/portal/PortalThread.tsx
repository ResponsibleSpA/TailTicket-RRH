import { CircleCheck, CirclePlus, GitMerge, Paperclip, Pencil, RotateCcw, Users, type LucideIcon } from "lucide-react";
import { renderThreadBody } from "@/components/common/thread-body";
import { ThreadEntry } from "@/lib/osticket/flags";
import { ThreadEntryType } from "@/lib/osticket/object-types";
import type { ThreadEntryView, ThreadEventView } from "@/server/domain/ticket/ticket";
import { formatDbDate, isoOf } from "@/server/format/datetime";
import { withBase } from "@/lib/base-path";
import { humanSize } from "@/lib/format/size";
import { cn } from "@/utils";

import { RICH_CLASS } from "./rich";
import { Avatar } from "./PortalUi";
import { FOCUS } from "./styles";

/** icona degli eventi pubblici del thread */
const EVENT_ICONS: Record<string, LucideIcon> = { created: CirclePlus, closed: CircleCheck, reopened: RotateCcw, edited: Pencil, collab: Users, merged: GitMerge };

function EventIcon({ name }: { name: string }) {
  const Icon = EVENT_ICONS[name];
  return Icon ? <Icon aria-hidden="true" className="size-3.5 text-gray-400" /> : null;
}

interface Labels {
  posted: string;
  staff: string;
  edited: string;
  events: Record<string, string>;
}

/**
 * Thread visibile al cliente (include/client/templates/thread-entries.tmpl.php): messaggi e risposte
 * (mai le note interne), allegati scaricabili dalla route protetta del portale, eventi pubblici
 * (creazione, chiusura, riapertura, modifica, collaboratori, unione) in ordine cronologico.
 */
export default function PortalThread({
  entries,
  events,
  tz,
  locale,
  hideStaffName,
  labels,
}: {
  entries: ThreadEntryView[];
  events: ThreadEventView[];
  tz: string;
  locale: string;
  hideStaffName: boolean;
  labels: Labels;
}) {
  const items: ({ kind: "entry"; at: string; e: ThreadEntryView } | { kind: "event"; at: string; v: ThreadEventView })[] = [
    ...entries.map((e) => ({ kind: "entry" as const, at: e.created, e })),
    ...events.map((v) => ({ kind: "event" as const, at: v.timestamp, v })),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.kind === "event" ? -1 : 1));

  return (
    <ol className="space-y-5">
      {items.map((it) =>
        it.kind === "event" ? (
          <li key={`v${it.v.id}`} className="flex items-center gap-3 text-theme-xs text-gray-500 dark:text-gray-400">
            <span aria-hidden="true" className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="inline-flex items-center gap-1.5">
              <EventIcon name={it.v.name} />
              {labels.events[it.v.name] ?? it.v.name}
              <span className="text-gray-400 tabular-nums dark:text-gray-500">· {formatDbDate(it.v.timestamp, tz, locale)}</span>
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </li>
        ) : (
          <li key={`e${it.e.id}`}>
            <article id={`entry-${it.e.id}`} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
              <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                {/* avatar: tinta del primario per le risposte dello staff, neutro per i messaggi del cliente */}
                <Avatar name={it.e.staff_id && hideStaffName ? labels.staff : it.e.poster} staff={it.e.type === ThreadEntryType.RESPONSE} className="size-8" />
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="min-w-0 text-sm font-semibold text-gray-900 dark:text-white/90">
                    {it.e.staff_id && hideStaffName ? labels.staff : it.e.poster} <span className="font-normal text-gray-500 dark:text-gray-400">{labels.posted}</span>
                    {it.e.title && <span className="ms-2 font-normal text-gray-400 dark:text-gray-500">{it.e.title}</span>}
                  </p>
                  <time dateTime={isoOf(it.e.created)} className="text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
                    {formatDbDate(it.e.created, tz, locale, "full")}
                    {it.e.flags & ThreadEntry.EDITED ? ` · ${labels.edited}` : ""}
                  </time>
                </div>
              </header>
              <div className={cn("px-5 py-4", RICH_CLASS)} dangerouslySetInnerHTML={{ __html: renderThreadBody(it.e, { area: "portal" }) }} />
              {it.e.attachments.some((a) => !a.inline) && (
                <footer className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
                  {it.e.attachments
                    .filter((a) => !a.inline)
                    .map((a) => (
                      <a
                        key={a.id}
                        href={withBase(`/api/portal/file/${a.key}`)}
                        className={cn(
                          "inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:border-gray-300 hover:text-brand-600 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:text-brand-400",
                          FOCUS,
                        )}
                      >
                        <Paperclip aria-hidden="true" className="size-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{a.name}</span>
                        <span className="shrink-0 font-normal text-gray-400 tabular-nums">{humanSize(a.size)}</span>
                      </a>
                    ))}
                </footer>
              )}
            </article>
          </li>
        ),
      )}
    </ol>
  );
}
