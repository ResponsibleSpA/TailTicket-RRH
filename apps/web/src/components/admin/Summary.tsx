import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils";

/**
 * Intestazione di un <details> dell'area admin: freccia Lucide al posto del marcatore del browser,
 * ruotata quando il pannello è aperto. Il <details> che la contiene deve avere la classe `group`.
 */
export default function Summary({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <ChevronRight aria-hidden className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
      {children}
    </summary>
  );
}
