import { ArrowRight, Database, GitBranch, HeartPulse, PenLine, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { WriteMode } from "@/lib/write-mode";
import { runDoctor } from "@/server/system/doctor";
import { cn } from "@/utils";

/** Stato di un indicatore: colore del pallino (verde/giallo/rosso solo per stati reali). */
type Tone = "ok" | "warn" | "error" | "neutral";
const DOT: Record<Tone, string> = {
  ok: "bg-success-500",
  warn: "bg-warning-500",
  error: "bg-error-500",
  neutral: "bg-gray-300 dark:bg-gray-600",
};

/** Riquadro di un indicatore: etichetta con icona, valore con pallino di stato, riga secondaria. */
function StatusTile({ icon: Icon, label, tone, value, sub }: { icon: LucideIcon; label: string; tone: Tone; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white/90">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[tone])} />
        <span className="truncate">{value}</span>
      </p>
      {sub && <p className="mt-1 truncate text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">{sub}</p>}
    </div>
  );
}

/** Esito dei controlli del doctor (in streaming: verifica anche SMTP, qualche secondo). */
async function DoctorTile() {
  const t = await getTranslations("admHome.health");
  const r = await runDoctor().catch(() => null);
  if (!r) return <StatusTile icon={Stethoscope} label={t("checks")} tone="warn" value={t("checksFailed")} />;
  const { ok, warn, block } = r.summary;
  return (
    <StatusTile
      icon={Stethoscope}
      label={t("checks")}
      tone={block ? "error" : warn ? "warn" : "ok"}
      value={block ? t("checksBlocked", { n: block }) : t("checksPassed", { n: ok })}
      sub={t("checksLine", { ok, warn, block })}
    />
  );
}

interface StatusData {
  online: boolean;
  tailticket: string;
  osticket: string;
  schema: string;
  schemaVerified: boolean;
  mysql: string;
  node: string;
  mode: { configured: WriteMode; effective: WriteMode };
}

/**
 * Stato del sistema in una sola card: help desk, versioni, schema, modalità di scrittura e controlli
 * del doctor; in fondo database e runtime, con il rimando a Informazioni di sistema.
 */
export default async function StatusPanel({ s }: { s: StatusData }) {
  const t = await getTranslations("admHome.health");
  const reduced = s.mode.effective !== s.mode.configured;
  return (
    <section aria-labelledby="admin-status" className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
        <h2 id="admin-status" className="text-base font-semibold text-gray-900 dark:text-white/90">
          {t("title")}
        </h2>
        <Link href="/admin/system" className="group inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
          {t("details")}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      </header>
      <div className="mt-1 grid grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-gray-100 rtl:lg:divide-x-reverse dark:lg:divide-gray-800">
        <StatusTile icon={HeartPulse} label={t("helpdesk")} tone={s.online ? "ok" : "error"} value={s.online ? t("online") : t("offline")} sub={t("helpdeskSub")} />
        <StatusTile icon={GitBranch} label={t("version")} tone="neutral" value={`TailTicket ${s.tailticket}`} sub={`osTicket ${s.osticket}`} />
        <StatusTile
          icon={ShieldCheck}
          label={t("schema")}
          tone={s.schemaVerified ? "ok" : "warn"}
          value={s.schemaVerified ? t("schemaVerified") : t("schemaUnverified")}
          sub={
            <code title={s.schema} className="font-mono">
              {s.schema.slice(0, 12) || "—"}
            </code>
          }
        />
        <StatusTile
          icon={PenLine}
          label={t("mode")}
          tone={s.mode.effective === "full" ? "ok" : reduced ? "error" : "warn"}
          value={t(`modes.${s.mode.effective}`)}
          sub={reduced ? t("modeReduced", { mode: t(`modes.${s.mode.configured}`) }) : t(`modeSub.${s.mode.effective}`)}
        />
        <div className="col-span-2 lg:col-span-1">
          <Suspense fallback={<StatusTile icon={Stethoscope} label={t("checks")} tone="neutral" value={t("checksLoading")} />}>
            <DoctorTile />
          </Suspense>
        </div>
      </div>
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-gray-100 px-5 py-3 text-theme-xs text-gray-500 sm:px-6 dark:border-gray-800 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <Database aria-hidden className="size-3.5" />
          {s.mysql}
        </span>
        <span>Node.js {s.node}</span>
      </footer>
    </section>
  );
}
