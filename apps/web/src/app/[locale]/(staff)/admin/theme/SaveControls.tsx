"use client";

import { RotateCcw } from "lucide-react";

import UndoChange from "@/components/admin/UndoChange";
import { ReadOnlyNote, useReadOnlyHint } from "@/components/common/WriteGate";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";

import type { SaveThemeState } from "./actions";

interface SaveControlsProps {
  state: SaveThemeState;
  dirty: boolean;
  pending: boolean;
  /** il colore primario è valido */
  canSave: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}

/** Esito del salvataggio, salva / annulla modifiche e ripristino del tema predefinito. */
export default function SaveControls({ state, dirty, pending, canSave, onSave, onDiscard, onReset }: SaveControlsProps) {
  const t = useTranslations("admin.theme");
  const te = useTranslations("admUi.errors");
  const x = useTranslations("admTheme");
  // amministrazione non scrivibile: l'anteprima resta, il salvataggio no
  const readOnly = useReadOnlyHint("admin");
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
      <ReadOnlyNote scope="admin" />
      {/* stato delle modifiche: in sospeso (da salvare) o allineate al tema attivo */}
      <p aria-live="polite" className="flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
        <span aria-hidden className={cn("size-2 rounded-full", dirty ? "bg-warning-500" : "bg-gray-300 dark:bg-gray-600")} />
        {dirty ? x("unsaved") : x("upToDate")}
      </p>
      {state.status === "saved" && <Alert variant="success" title={t("saved")} message="" />}
      {/* il tema è nel layout radice: dopo l'annullamento si ricarica la pagina */}
      {state.status === "saved" && state.change && <UndoChange change={state.change} inline onUndone={() => window.location.reload()} />}
      {state.status === "error" && <Alert variant="error" title={t("error")} message={state.message === "read_only" ? te("read_only") : (state.message ?? "")} />}
      <div className="flex gap-3">
        <Button onClick={onSave} disabled={!dirty || pending || !canSave || !!readOnly} title={readOnly} className="flex-1">
          {pending ? t("saving") : t("save")}
        </Button>
        <Button variant="outline" onClick={onDiscard} disabled={!dirty || pending}>
          {t("discard")}
        </Button>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-theme-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
      >
        <RotateCcw aria-hidden className="size-3.5" />
        {t("resetDefaults")}
      </button>
    </div>
  );
}
