"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";

import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils";

import { menuButtonClass } from "./menu-classes";

/**
 * Pulsante con menu a discesa (stile TailAdmin, pattern "menu button" WAI-ARIA); `children` riceve la
 * funzione da chiamare dopo la scelta di una voce: chiude il menu e riporta il focus sul pulsante (da lì
 * lo riprende la finestra di dialogo che la voce apre, alla sua chiusura).
 */
export default function MenuButton({
  label,
  width = "w-56",
  icon,
  className = menuButtonClass,
  children,
}: {
  label: string;
  /** larghezza del menu (classe Tailwind) */
  width?: "w-56" | "w-60" | "w-64";
  /** icona prima dell'etichetta */
  icon?: ReactNode;
  /** aspetto del pulsante (menu-classes: bordo, testo o gruppo); predefinito il pulsante con bordo */
  className?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const triggerId = `${menuId}-trigger`;
  const close = useCallback(() => setOpen(false), []);
  // il pulsante si cerca per id: la funzione è passata ai figli durante il render
  const choose = useCallback(() => {
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  }, [triggerId]);
  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn("dropdown-toggle", className)}
      >
        {icon}
        {label}
        <ChevronDown aria-hidden="true" className={cn("size-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      <Dropdown id={menuId} role="menu" triggerRef={triggerRef} isOpen={open} onClose={close} className={cn(width, "p-2")}>
        {children(choose)}
      </Dropdown>
    </div>
  );
}
