import { useTranslations } from "next-intl";

interface TicketSourceBadgeProps {
  source: string;
}

export default function TicketSourceBadge({ source }: TicketSourceBadgeProps) {
  const t = useTranslations("ticketEdit.sources");
  return (
    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-400">
      {t.has(source) ? t(source) : source}
    </span>
  );
}
