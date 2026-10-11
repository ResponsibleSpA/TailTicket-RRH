"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { useTranslations } from "next-intl";

import ComponentCard from "@/components/common/ComponentCard";
import DynamicForm from "@/components/forms/dynamic/DynamicForm";
import FieldShell from "@/components/forms/dynamic/FieldShell";
import { selectCls } from "@/components/forms/dynamic/styles";
import type { DynamicFormView } from "@/lib/forms/dynamic-field";
import { initials } from "@/lib/format/initials";
import { cn } from "@/utils";

import { first, type SubmittedValues } from "./types";
import UserPicker, { type PickedUser } from "./UserPicker";

interface Props {
  userForm: DynamicFormView | null;
  search: (q: string) => Promise<PickedUser[]>;
  values?: SubmittedValues;
  fieldErrors?: Record<number, string[]>;
  errors: { user?: string; email?: string; name?: string };
  /** utente scelto in precedenza (ripristino dopo un errore) */
  initialUser?: PickedUser | null;
  initialCcs?: PickedUser[];
}

/** Richiedente (esistente o nuovo), collaboratori in Cc e destinatari dell'avviso di apertura. */
export default function UserSection({ userForm, search, values, fieldErrors, errors, initialUser, initialCcs }: Props) {
  const t = useTranslations("createTicket");
  // dopo un errore si torna sulla modalità scelta (userMode), non su "Nuovo utente" solo perché manca uid
  const sent = first(values, "userMode");
  const [mode, setMode] = useState<"existing" | "new">(sent === "new" && userForm ? "new" : sent === "existing" || !values || first(values, "uid") || !userForm ? "existing" : "new");
  const [user, setUser] = useState<PickedUser | null>(initialUser ?? null);
  const [ccs, setCcs] = useState<PickedUser[]>(initialCcs ?? []);
  // errori dell'invio `values` già corretti scegliendo un utente
  const [fixedFor, setFixedFor] = useState<SubmittedValues | undefined | null>(null);
  const fixed = !!values && fixedFor === values;
  // Ticket::open senza uid chiede email e nome (come il PHP): in "Utente esistente" significa che non è stato scelto nessuno
  const userErrors = fixed
    ? []
    : mode === "existing" && !user && (errors.email || errors.name)
      ? [t("user.selectUser"), errors.user].filter((e): e is string => !!e)
      : [errors.user, errors.email, errors.name].filter((e): e is string => !!e);
  const pickUser = (u: PickedUser) => {
    setUser(u);
    setFixedFor(values);
  };

  // controllo segmentato: la scelta attiva è una "card" bianca sul fondo grigio, senza colore pieno
  const tab = (m: "existing" | "new", label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "h-8 flex-1 rounded-md px-3 text-theme-sm font-medium whitespace-nowrap focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden sm:flex-none",
        mode === m
          ? "bg-white text-gray-900 shadow-theme-xs ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
      )}
    >
      {label}
    </button>
  );

  return (
    <ComponentCard title={t("sections.user")}>
      <input type="hidden" name="userMode" value={mode} />
      {userForm && (
        <div className="flex w-full gap-1 rounded-lg bg-gray-100 p-1 sm:inline-flex sm:w-auto dark:bg-white/5">
          {tab("existing", t("user.existingUser"))}
          {tab("new", t("user.newUser"))}
        </div>
      )}
      {mode === "existing" ? (
        <FieldShell htmlFor="user-search" label={user ? t("user.selected") : t("user.search")} required errors={userErrors}>
          {user ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/2">
              <input type="hidden" name="uid" value={user.id} />
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-theme-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                {initials(user.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900 dark:text-white/90">{user.name}</span>
                <span title={user.email} className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setUser(null)}
                className="shrink-0 rounded-md px-2 py-1 text-theme-sm font-medium text-brand-600 hover:bg-brand-50 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                {t("user.change")}
              </button>
            </div>
          ) : (
            <UserPicker id="user-search" placeholder={t("user.searchPlaceholder")} search={search} onPick={pickUser} />
          )}
        </FieldShell>
      ) : (
        userForm && (
          <div className="space-y-4">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t("user.newUserHint")}</p>
            {userErrors.map((e) => (
              <p key={e} role="alert" className="text-theme-xs text-error-600 dark:text-error-400">
                {e}
              </p>
            ))}
            <DynamicForm form={userForm} values={values} errors={fieldErrors} />
          </div>
        )
      )}

      <FieldShell htmlFor="cc-search" label={t("user.ccs")}>
        {ccs.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {ccs.map((c) => (
              <li
                key={c.id}
                className="flex max-w-full items-center gap-1.5 rounded-md bg-gray-50 py-1 ps-2.5 pe-1.5 text-theme-xs text-gray-700 ring-1 ring-gray-200 ring-inset dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
              >
                <input type="hidden" name="ccs" value={c.id} />
                <span className="truncate">
                  {c.name} <span className="text-gray-500 dark:text-gray-400">{c.email}</span>
                </span>
                <button type="button" aria-label={t("user.remove")} onClick={() => setCcs((p) => p.filter((x) => x.id !== c.id))} className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-hidden dark:hover:bg-white/10 dark:hover:text-white">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <UserPicker
          id="cc-search"
          placeholder={t("user.ccsPlaceholder")}
          search={search}
          exclude={[...ccs.map((c) => c.id), ...(user ? [user.id] : [])]}
          onPick={(u) => setCcs((p) => [...p, u])}
        />
      </FieldShell>

      <FieldShell htmlFor="reply-to" label={t("user.notice")}>
        <select id="reply-to" name="reply-to" defaultValue={first(values, "reply-to") || "all"} className={selectCls}>
          <option value="all">{t("user.noticeAll")}</option>
          <option value="user">{t("user.noticeUser")}</option>
          <option value="none">{t("user.noticeNone")}</option>
        </select>
      </FieldShell>
    </ComponentCard>
  );
}
