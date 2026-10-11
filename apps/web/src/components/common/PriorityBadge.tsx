import { cn } from "@/utils";

/**
 * Colore del pallino per urgenza di osTicket (ticket_priority.priority_urgency: 1 Emergency … 4 Low).
 * I colori configurati in osTicket sono tinte pastello pensate come sfondo, poco leggibili come segnale:
 * qui il colore dice solo quanto è urgente (docs/brand/ui.md), Normal e Low restano neutri.
 */
function urgencyDot(urgency: number | null | undefined): string {
  switch (urgency) {
    case 1:
      return "bg-error-500";
    case 2:
      return "bg-warning-500";
    case 4:
      return "bg-gray-300 dark:bg-gray-600";
    default:
      return "bg-gray-400 dark:bg-gray-500";
  }
}

/** Pallino dell'urgenza da solo (intestazioni e filtri della board). */
export function PriorityDot({ urgency, className }: { urgency: number | null | undefined; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", urgencyDot(urgency), className)} />;
}

/** Priorità di un ticket: pallino per urgenza + nome neutro (liste, intestazione del ticket, board). */
export default function PriorityBadge({ name, urgency, title, className }: { name: string; urgency: number | null | undefined; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gray-50 px-2 py-0.5 text-theme-xs font-medium text-gray-700 ring-1 ring-gray-200 ring-inset dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
        className,
      )}
    >
      <PriorityDot urgency={urgency} className="size-1.5" />
      {name}
    </span>
  );
}
