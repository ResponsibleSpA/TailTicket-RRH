import type { ReactNode } from "react";

import Callout from "@/components/common/Callout";

type Tone = "success" | "error" | "warning" | "info";

/** gravità per scegliere il tono di un gruppo di avvisi */
const RANK: Record<Tone, number> = { error: 3, warning: 2, info: 1, success: 0 };

/** Esito o avviso dell'area admin: il Callout comune (icona del tono, titolo facoltativo e testo). */
export default function Outcome({ tone, role, title, children }: { tone: Tone; role?: "status" | "alert"; title?: ReactNode; children?: ReactNode }) {
  return (
    <Callout tone={tone} role={role} title={title}>
      {children}
    </Callout>
  );
}

/**
 * Più avvisi della stessa pagina in un solo riquadro (elenco puntato) invece di una pila di Callout;
 * il tono è quello dell'avviso più grave. Nulla se non ci sono avvisi.
 */
export function Notices({ items }: { items: { tone: Tone; content: ReactNode; key: string }[] }) {
  if (!items.length) return null;
  if (items.length === 1) return <Outcome tone={items[0].tone}>{items[0].content}</Outcome>;
  const tone = items.reduce<Tone>((t, i) => (RANK[i.tone] > RANK[t] ? i.tone : t), "info");
  return (
    <Outcome tone={tone}>
      <ul className="list-disc space-y-1 ps-4">
        {items.map((i) => (
          <li key={i.key}>{i.content}</li>
        ))}
      </ul>
    </Outcome>
  );
}
