import { ArrowLeft } from "lucide-react";

import NewLink from "@/components/admin/NewLink";
import { Link } from "@/i18n/navigation";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white/90"
    >
      <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" /> {label}
    </Link>
  );
}

/** "Nuovo …" delle liste admin (disattivato se l'amministrazione non è scrivibile). */
export function NewButton({ href, label }: { href: string; label: string }) {
  return <NewLink href={href} label={label} />;
}
