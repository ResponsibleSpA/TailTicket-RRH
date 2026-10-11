import { Inbox } from "lucide-react";

/** Lista senza ticket (tabella e schede): icona, messaggio e suggerimento, al centro e in grigio. */
export default function TicketListEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
        <Inbox aria-hidden className="size-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white/90">{title}</p>
      <p className="mt-1 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">{hint}</p>
    </div>
  );
}
