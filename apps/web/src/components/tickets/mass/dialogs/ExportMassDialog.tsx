"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { exportAdhocAction } from "@/app/[locale]/(staff)/agent/(panel)/tickets/actions-mass";

import { Field, Select } from "@/components/tickets/edit/inputs";
import { Modal } from "@/components/ui/modal";
import { withBase } from "@/lib/base-path";
import { tryAction } from "@/lib/try-action";

import { dialogButtonClass, dialogClass, DialogFooter, dialogScrollClass, DialogTitle, PrimaryButton, SecondaryButton } from "../../dialog-ui";
import type { MassData } from "../types";

/** Dialogo di export (templates/queue-export.tmpl.php): campi, separatore, download del CSV. */
export default function ExportMassDialog({ data, onClose }: { data: MassData; onClose: () => void }) {
  const t = useTranslations("ticketEdit.mass");
  const te = useTranslations("ticketEdit");
  const [fields, setFields] = useState(data.exportFields.map((f) => f.path));
  const [delimiter, setDelimiter] = useState(",");
  const params = new URLSearchParams({ queue: String(data.queueId), delimiter });
  if (data.sort) params.set("sort", data.sort);
  if (data.dir) params.set("dir", data.dir);
  for (const f of fields) params.append("fields", f);
  const href = withBase(`/api/agent/tickets/export?${params.toString()}`);
  // ricerca ad hoc: niente id di coda per l'URL dell'export, il CSV arriva dalla server action
  const [downloading, startDownload] = useTransition();
  const [failed, setFailed] = useState(false);
  const downloadAdhoc = (adhoc: NonNullable<MassData["adhoc"]>) =>
    startDownload(async () => {
      setFailed(false);
      const res = await tryAction(() =>
        exportAdhocAction(adhoc, {
          fields,
          delimiter,
          sort: data.sort,
          dir: data.dir,
        }),
      );
      if (!res.ok || "error" in res.value) return setFailed(true);
      const url = URL.createObjectURL(new Blob([res.value.content], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = res.value.filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    });
  const toggle = (path: string, on: boolean) => setFields((l) => (on ? data.exportFields.map((x) => x.path).filter((p) => l.includes(p) || p === path) : l.filter((p) => p !== path)));
  return (
    <Modal isOpen onClose={onClose} className={dialogClass("lg")}>
      <div className={dialogScrollClass}>
        <DialogTitle>
          {t(data.adhoc ? "exportTitleList" : "exportTitle", {
            queue: data.queueName,
          })}
        </DialogTitle>
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">{t("exportHelp")}</p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-lg border border-gray-200 p-4 sm:grid-cols-3 dark:border-gray-800">
          {data.exportFields.map((f) => (
            <label key={f.path} className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-400">
              <input type="checkbox" checked={fields.includes(f.path)} onChange={(e) => toggle(f.path, e.target.checked)} className="size-4 accent-brand-500" />
              {f.label}
            </label>
          ))}
        </div>
        <Field label={t("delimiter")}>
          <Select
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: ",", label: t("delimiters.comma") },
              { value: ";", label: t("delimiters.semicolon") },
              { value: "\t", label: t("delimiters.tab") },
              { value: "|", label: t("delimiters.pipe") },
            ]}
          />
        </Field>
        <DialogFooter>
          {failed && (
            <p role="alert" className="text-theme-xs text-error-600 sm:me-auto dark:text-error-400">
              {te("errors.generic")}
            </p>
          )}
          <SecondaryButton onClick={onClose}>{te("cancel")}</SecondaryButton>
          {data.adhoc ? (
            <PrimaryButton type="button" disabled={!fields.length || downloading} onClick={() => downloadAdhoc(data.adhoc!)}>
              <Download aria-hidden className="size-4" />
              {downloading ? te("working") : t("download")}
            </PrimaryButton>
          ) : (
            <a href={fields.length ? href : undefined} aria-disabled={!fields.length} onClick={() => setTimeout(onClose, 300)} className={dialogButtonClass.primary}>
              <Download aria-hidden className="size-4" />
              {t("download")}
            </a>
          )}
        </DialogFooter>
      </div>
    </Modal>
  );
}
