import type { ReactNode } from "react";

import type { DbDateTime } from "@/server/db/schema.gen";
import { formatDbDate } from "@/server/format/datetime";

interface ThreadEventLineProps {
  description: ReactNode;
  timestamp: DbDateTime;
  tz: string;
  locale: string;
}

/** Evento del thread nella timeline (assegnazione, chiusura, trasferimento…): una riga con pallino e data. */
export default function ThreadEventLine({ description, timestamp, tz, locale }: ThreadEventLineProps) {
  return (
    <div className="flex items-start gap-3 px-3 text-theme-sm text-gray-500 dark:text-gray-400">
      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
      <p className="min-w-0">
        {description}
        <span className="ms-2 text-theme-xs whitespace-nowrap text-gray-400 tabular-nums dark:text-gray-500">{formatDbDate(timestamp, tz, locale)}</span>
      </p>
    </div>
  );
}
