import "server-only";

import { loadConfigNamespace } from "../config/config";
import { db } from "../db";
import { detectDbTimezone } from "../db/time";
import { assertWritableSchema } from "../system/schema-compat";
import { requestOpForJournal } from "../system/write-journal";
import { canWrite, currentWriteContext, isReadOnlyError, ReadOnlyModeError, readOnlyResult, withWriteScope, type ReadOnlyResult, type WriteActor } from "../system/write-mode";
import { bindRequestContext } from "./forms/entry";
import type { Agent } from "./staff/staff";
import { staffActor, type WriteContext } from "./ticket/context";
import type { Actor } from "./ticket/events";

/** Le richieste HTTP possono affidare gli effetti post-commit a Next after; script e test li attendono. */
export type PostCommitScheduler = (job: () => Promise<void>) => void;

/**
 * Esegue un'operazione di scrittura in una transazione con il contesto dell'attore; le email e gli altri
 * effetti esterni registrati in `ctx.after` partono solo dopo il commit. Rifiuta le scritture se lo
 * schema del DB osTicket non è tra quelli verificati (src/server/system/schema-compat.ts).
 * Scope di scrittura "operational" (write-mode.ts): se la modalità non lo consente, nessuna query e
 * l'esito è readOnlyResult() (`{ ok: false, error: "read_only", … }`), anche quando il gate rifiuta una
 * query a metà transazione (rollback).
 */
export async function runWrite<T>(who: { agent: Agent; ip: string } | { actor: Actor }, fn: (ctx: WriteContext) => Promise<T>, op?: string, schedule?: PostCommitScheduler): Promise<T | ReadOnlyResult> {
  try {
    return await runWriteOrThrow(who, fn, op, schedule);
  } catch (err) {
    if (isReadOnlyError(err)) return readOnlyResult();
    throw err;
  }
}

/** Come runWrite, ma una scrittura non consentita resta ReadOnlyModeError (harness, script). */
export async function runWriteOrThrow<T>(who: { agent: Agent; ip: string } | { actor: Actor }, fn: (ctx: WriteContext) => Promise<T>, op?: string, schedule?: PostCommitScheduler): Promise<T> {
  if (!(await canWrite("operational"))) throw new ReadOnlyModeError("operational");
  return withWriteScope("operational", () => runWriteTx(who, fn, schedule), {
    actor: journalActor(who),
    op: op ?? (await requestOpForJournal()),
  });
}

function journalActor(who: { agent: Agent } | { actor: Actor }): WriteActor {
  if ("agent" in who) return { type: "agent", id: who.agent.id };
  if (who.actor?.kind === "staff") return { type: "agent", id: who.actor.id };
  if (who.actor?.kind === "user") return { type: "client", id: who.actor.id };
  return { type: "system" };
}

async function runWriteTx<T>(who: { agent: Agent; ip: string } | { actor: Actor }, fn: (ctx: WriteContext) => Promise<T>, schedule?: PostCommitScheduler): Promise<T> {
  const cfg = await loadConfigNamespace("core");
  assertWritableSchema(cfg);
  const dbZone = await detectDbTimezone(db());
  const after: (() => Promise<void>)[] = [];
  const result = await db()
    .transaction()
    .execute(async (tx) => {
      const ctx: WriteContext = {
        tx,
        cfg,
        actor: "agent" in who ? staffActor(who.agent, cfg, who.ip) : who.actor,
        agent: "agent" in who ? who.agent : null,
        dbZone,
        after,
      };
      bindRequestContext(ctx);
      return fn(ctx);
    });
  const context = currentWriteContext();
  const finish = () => withWriteScope("operational", async () => {
    for (const job of after) {
      try {
        await job();
      } catch (err) {
        console.error("[runWrite] effetto post-commit fallito", err);
      }
    }
  }, context ?? {});
  if (after.length) {
    if (schedule) schedule(finish);
    else await finish();
  }
  return result;
}
