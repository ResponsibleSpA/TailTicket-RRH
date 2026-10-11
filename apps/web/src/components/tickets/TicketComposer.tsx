"use client";

import { Lock, MessageSquareReply, Send, StickyNote } from "lucide-react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import RichTextEditor, { type RichTextEditorHandle } from "@/components/editor/RichTextEditor";
import AttachmentInput from "@/components/forms/AttachmentInput";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/utils";

import { cannedTextAction, lockAction, postNoteAction, postReplyAction, releaseLockAction, type LockState, type PostState } from "@/app/[locale]/(staff)/agent/(panel)/tickets/[id]/actions";
import { submitKeepingValues } from "@/lib/submit-keeping-values";

import { ComposerAlert, ComposerField, ComposerFooter, composerSelectCls as selectCls, SubmitButton, TabButton } from "./ComposerParts";

export interface ComposerLabels {
  reply: string;
  note: string;
  send: string;
  sendReply: string;
  sendNote: string;
  noteHint: string;
  sending: string;
  replyTo: string;
  replyAll: string;
  replyUser: string;
  replyNone: string;
  collaborators: string;
  signature: string;
  sigNone: string;
  sigMine: string;
  sigDept: string;
  statusAfter: string;
  statusUnchanged: string;
  canned: string;
  cannedPick: string;
  noteTitle: string;
  replyPlaceholder: string;
  notePlaceholder: string;
  posted: string;
  lockedBy: string;
  errors: Record<string, string>;
  editor: {
    bold: string;
    italic: string;
    underline: string;
    bullets: string;
    numbers: string;
    link: string;
    quote: string;
    linkPrompt: string;
  };
}

interface Props {
  ticketId: number;
  canReply: boolean;
  lockMode: number;
  statuses: { id: number; name: string; state: string }[];
  currentStatusId: number;
  collaborators: {
    userId: number;
    name: string;
    email: string;
    active: boolean;
  }[];
  canned: { id: number; title: string }[];
  hasMySignature: boolean;
  deptSignature: boolean;
  defaultSignature: string;
  labels: ComposerLabels;
  /** endpoint di upload degli allegati (assente = allegati non mostrati) */
  uploadUrl?: string;
  /** dimensione massima di un allegato in byte */
  maxFileSize?: number;
}

/** Stato del form con il numero di invii riusciti (chiave degli allegati: si svuotano solo dopo un invio). */
type ComposerState = PostState & { sent?: number };

/** Risposta / nota interna con gestione del lock come ticket-view.inc.php + osticket.js. */
export default function TicketComposer(props: Props) {
  const { ticketId, labels, lockMode } = props;
  const [tab, setTab] = useState<"reply" | "note">(props.canReply ? "reply" : "note");
  const [lock, setLock] = useState<LockState>({ id: 0 });
  const lockRef = useRef<LockState>({ id: 0 });
  const router = useRouter();
  const replyEditor = useRef<RichTextEditorHandle>(null);
  const noteEditor = useRef<RichTextEditorHandle>(null);
  const replyForm = useRef<HTMLFormElement>(null);
  const noteForm = useRef<HTMLFormElement>(null);

  // Dopo l'invio il server rilascia il lock: si azzera anche lo stato locale
  const withLockReset =
    (fn: (prev: PostState, fd: FormData) => Promise<PostState>) =>
    async (prev: ComposerState, fd: FormData): Promise<ComposerState> => {
      const r = await fn(prev, fd);
      if (r.ok) {
        lockRef.current = { id: 0 };
        setLock({ id: 0 });
      }
      return { ...r, sent: (prev.sent ?? 0) + (r.ok ? 1 : 0) };
    };
  const [replyState, replyAction, replyPending] = useActionState<ComposerState, FormData>(withLockReset(postReplyAction), {});
  const [noteState, noteAction, notePending] = useActionState<ComposerState, FormData>(withLockReset(postNoteAction), {});

  const acquire = useCallback(async () => {
    if (!lockMode) return;
    const res = await lockAction(ticketId, lockRef.current.id || undefined);
    lockRef.current = res;
    setLock(res);
  }, [lockMode, ticketId]);

  // Modalità "alla visualizzazione": lock subito; rinnovo prima della scadenza; rilascio all'uscita
  useEffect(() => {
    if (lockMode === 1) void acquire();
    return () => {
      if (lockRef.current.id) void releaseLockAction(ticketId);
    };
  }, [acquire, lockMode, ticketId]);

  useEffect(() => {
    if (!lock.id || !lock.time) return;
    const t = setTimeout(() => void acquire(), Math.max(10, lock.time - 30) * 1000);
    return () => clearTimeout(t);
  }, [lock, acquire]);

  const state = tab === "reply" ? replyState : noteState;
  // Dopo un invio riuscito il form torna ai valori iniziali (solo allora: dopo un errore resta com'è)
  useEffect(() => {
    if (!state.ok) return;
    (tab === "reply" ? replyForm : noteForm).current?.reset();
    (tab === "reply" ? replyEditor : noteEditor).current?.clear();
    // chiusura del ticket: ritorno alla lista con l'esito (TicketDoneNotice)
    if (state.closed) router.push(`/agent/tickets?done=status&tid=${ticketId}`);
    else router.refresh();
  }, [state.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const insertCanned = async (id: string) => {
    if (!id) return;
    const html = await cannedTextAction(ticketId, Number(id));
    if (html) replyEditor.current?.insertHtml(html);
  };

  const statusSelect = (
    <ComposerField label={labels.statusAfter}>
      <select name="statusId" defaultValue="" className={selectCls}>
        <option value="">{labels.statusUnchanged}</option>
        {props.statuses
          .filter((s) => s.id !== props.currentStatusId)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </select>
    </ComposerField>
  );

  const errorText = state.error ? (labels.errors[state.error] ?? state.error) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div role="tablist" className="flex border-b border-gray-200 px-1 dark:border-gray-800">
        {props.canReply && (
          <TabButton id={`composer-${ticketId}-reply`} active={tab === "reply"} onClick={() => setTab("reply")} icon={MessageSquareReply}>
            {labels.reply}
          </TabButton>
        )}
        <TabButton id={`composer-${ticketId}-note`} active={tab === "note"} onClick={() => setTab("note")} icon={StickyNote}>
          {labels.note}
        </TabButton>
      </div>

      {lock.lockedBy && <ComposerAlert tone="warning">{labels.lockedBy.replace("{name}", lock.lockedBy)}</ComposerAlert>}
      {errorText && (
        <ComposerAlert tone="error" role="alert">
          {errorText}
        </ComposerAlert>
      )}
      {state.ok && !state.closed && (
        <ComposerAlert tone="success" role="status">
          {labels.posted}
        </ComposerAlert>
      )}

      <form
        ref={replyForm}
        onSubmit={submitKeepingValues(replyAction)}
        id={`composer-${ticketId}-reply-panel`}
        role="tabpanel"
        aria-labelledby={`composer-${ticketId}-reply`}
        className={cn("space-y-4 p-4 sm:p-5", tab !== "reply" && "hidden")}
      >
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="lockCode" value={lock.code ?? ""} />
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <ComposerField label={labels.replyTo}>
            <select name="replyTo" defaultValue="all" className={selectCls}>
              <option value="all">{labels.replyAll}</option>
              <option value="user">{labels.replyUser}</option>
              <option value="none">{labels.replyNone}</option>
            </select>
          </ComposerField>
          {props.canned.length > 0 && (
            <ComposerField label={labels.canned}>
              <select defaultValue="" onChange={(e) => void insertCanned(e.target.value)} className={selectCls}>
                <option value="">{labels.cannedPick}</option>
                {props.canned.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </ComposerField>
          )}
        </div>
        {props.collaborators.length > 0 && (
          <fieldset className="text-theme-sm text-gray-700 dark:text-gray-400">
            <legend className="mb-1.5 font-medium">{labels.collaborators}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {props.collaborators.map((c) => (
                <label key={c.userId} className="flex min-w-0 items-center gap-2">
                  <input type="checkbox" name="ccs" value={c.userId} defaultChecked={c.active} className="size-4 shrink-0 accent-brand-500" />
                  <span className="truncate">
                    {c.name} <span className="text-gray-400">&lt;{c.email}&gt;</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <RichTextEditor ref={replyEditor} name="response" placeholder={labels.replyPlaceholder} onActivity={lockMode === 2 ? acquire : undefined} labels={labels.editor} />
        {props.uploadUrl && <AttachmentInput key={`r${replyState.sent ?? 0}`} name="files" uploadUrl={props.uploadUrl} maxSize={props.maxFileSize} />}
        <ComposerFooter submit={<SubmitButton pending={replyPending} label={labels.sendReply} pendingLabel={labels.sending} icon={Send} />}>
          <ComposerField label={labels.signature}>
            <select name="signature" defaultValue={props.defaultSignature} className={selectCls}>
              <option value="none">{labels.sigNone}</option>
              {props.hasMySignature && <option value="mine">{labels.sigMine}</option>}
              {props.deptSignature && <option value="dept">{labels.sigDept}</option>}
            </select>
          </ComposerField>
          {statusSelect}
        </ComposerFooter>
      </form>

      <form
        ref={noteForm}
        onSubmit={submitKeepingValues(noteAction)}
        id={`composer-${ticketId}-note-panel`}
        role="tabpanel"
        aria-labelledby={`composer-${ticketId}-note`}
        className={cn("space-y-4 p-4 sm:p-5", tab !== "note" && "hidden")}
      >
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="lockCode" value={lock.code ?? ""} />
        {/* la nota non arriva all'utente: lo si dice prima di scriverla */}
        <p className="flex items-center gap-2 text-theme-xs text-warning-700 dark:text-warning-400">
          <Lock aria-hidden className="size-3.5 shrink-0" />
          {labels.noteHint}
        </p>
        <input
          name="title"
          placeholder={labels.noteTitle}
          aria-label={labels.noteTitle}
          className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <RichTextEditor ref={noteEditor} name="note" placeholder={labels.notePlaceholder} onActivity={lockMode === 2 ? acquire : undefined} labels={labels.editor} />
        {props.uploadUrl && <AttachmentInput key={`n${noteState.sent ?? 0}`} name="files" uploadUrl={props.uploadUrl} maxSize={props.maxFileSize} />}
        <ComposerFooter submit={<SubmitButton pending={notePending} label={labels.sendNote} pendingLabel={labels.sending} icon={StickyNote} />}>{statusSelect}</ComposerFooter>
      </form>
    </div>
  );
}
