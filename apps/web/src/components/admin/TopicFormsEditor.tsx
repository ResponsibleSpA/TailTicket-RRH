"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import type { FormField } from "@/lib/admin/form-schema";
import { cn } from "@/utils";

import { BTN_SECONDARY } from "./styles";

type TopicFormsField = Extract<FormField, { kind: "topic-forms" }>;

/** Only associated forms submit fields; removing a form keeps its unsaved choices for re-adding it. */
export default function TopicFormsEditor({ field }: { field: TopicFormsField }) {
  const t = useTranslations("admTopics");
  const id = useId();
  const [selected, setSelected] = useState(field.selectedForms);
  const [enabled, setEnabled] = useState(() => new Set(field.enabledFields));
  const [pick, setPick] = useState("");
  const available = field.forms.filter((form) => !selected.includes(form.id));

  return (
    <div className="space-y-4">
      {/* A nonempty array also represents "all unchecked" in both PHP and TypeScript. */}
      <input type="hidden" name={field.fieldsName} value="" />
      {selected.map((formId) => {
        const form = field.forms.find((item) => item.id === formId);
        if (!form) return null;
        return (
          <section key={form.id} aria-labelledby={`${id}-${form.id}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <input type="hidden" name={field.name} value={form.id} />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 id={`${id}-${form.id}`} className="text-sm font-semibold text-gray-800 dark:text-white/90">{form.title}</h3>
              {form.required ? (
                <span className="text-theme-xs text-gray-500 dark:text-gray-400">{t("alwaysIncluded")}</span>
              ) : (
                <button type="button" className={BTN_SECONDARY} aria-label={t("removeFormNamed", { name: form.title })} onClick={() => setSelected(selected.filter((value) => value !== form.id))}>
                  {t("removeForm")}
                </button>
              )}
            </div>
            <fieldset>
              <legend className="mb-2 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("fields")}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {form.fields.map((item) => (
                  <label key={item.value} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      name={field.fieldsName}
                      value={item.value}
                      checked={enabled.has(item.value)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setEnabled((current) => {
                          const next = new Set(current);
                          if (checked) next.add(item.value);
                          else next.delete(item.value);
                          return next;
                        });
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                    />
                    <span>
                      {item.label}
                      {!item.clientVisible && <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{t("portalHidden")}</span>}
                    </span>
                  </label>
                ))}
              </div>
              {form.fields.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t("noFormFields")}</p>}
            </fieldset>
          </section>
        );
      })}
      {available.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select value={pick} onChange={(event) => setPick(event.target.value)} aria-label={t("chooseForm")} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="">{t("chooseForm")}</option>
            {available.map((form) => <option key={form.id} value={form.id}>{form.title}</option>)}
          </select>
          <button type="button" className={cn(BTN_SECONDARY, "shrink-0")} disabled={!pick} onClick={() => {
            setSelected([...selected, pick]);
            setPick("");
          }}>{t("addForm")}</button>
        </div>
      )}
    </div>
  );
}
