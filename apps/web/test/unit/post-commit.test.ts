import { beforeEach, expect, it, vi } from "vitest";

import { runWrite } from "@/server/domain/write";
import { currentWriteContext } from "@/server/system/write-mode";

const state = vi.hoisted(() => ({ events: [] as string[] }));
vi.mock("@/server/db", () => ({
  db: () => ({ transaction: () => ({ execute: async (fn: (tx: object) => Promise<unknown>) => {
    state.events.push("begin");
    const result = await fn({});
    state.events.push("commit");
    return result;
  } }) }),
}));
vi.mock("@/server/config/config", () => ({ loadConfigNamespace: async () => ({}) }));
vi.mock("@/server/db/time", () => ({ detectDbTimezone: async () => "UTC" }));
vi.mock("@/server/system/schema-compat", () => ({ assertWritableSchema: vi.fn() }));
vi.mock("@/server/system/write-journal", () => ({ requestOpForJournal: async () => undefined }));
vi.mock("@/server/domain/forms/entry", () => ({ bindRequestContext: vi.fn() }));
vi.mock("@/server/domain/ticket/context", () => ({ staffActor: vi.fn() }));
vi.mock("@/server/system/write-mode", async (original) => ({
  ...await original<typeof import("@/server/system/write-mode")>(),
  canWrite: async () => true,
}));

beforeEach(() => { state.events.length = 0; });

it("returns the committed ticket before slow notifications and preserves the write scope", async () => {
  let finish: (() => Promise<void>) | undefined;
  let release!: () => void;
  const slowMail = new Promise<void>((resolve) => { release = resolve; });
  const result = await runWrite({ actor: { kind: "user", id: 12, name: "Test", email: "test@example.com", hasAccount: true, ip: "127.0.0.1" } }, async (ctx) => {
    ctx.after.push(async () => {
      expect(currentWriteContext()).toMatchObject({ scope: "operational", actor: { type: "client", id: 12 }, op: "ticket.open" });
      state.events.push("mail");
      await slowMail;
      state.events.push("delivered");
    });
    return { ok: true, ticketId: 42 };
  }, "ticket.open", (job) => { finish = job; });
  expect(result).toEqual({ ok: true, ticketId: 42 });
  expect(state.events).toEqual(["begin", "commit"]);
  expect(currentWriteContext()).toBeUndefined();
  const delivery = finish!();
  expect(state.events).toEqual(["begin", "commit", "mail"]);
  release();
  await delivery;
  expect(state.events).toEqual(["begin", "commit", "mail", "delivered"]);
});

it("keeps scripts and differential tests synchronous with notifications in order", async () => {
  await runWrite({ actor: null }, async (ctx) => {
    ctx.after.push(async () => { state.events.push("first"); });
    ctx.after.push(async () => { state.events.push("second"); });
    return true;
  });
  expect(state.events).toEqual(["begin", "commit", "first", "second"]);
});

it("never schedules notifications when the transaction fails", async () => {
  const schedule = vi.fn();
  const mail = vi.fn();
  await expect(runWrite({ actor: null }, async (ctx) => {
    ctx.after.push(mail);
    throw new Error("rollback");
  }, undefined, schedule)).rejects.toThrow("rollback");
  expect(schedule).not.toHaveBeenCalled();
  expect(mail).not.toHaveBeenCalled();
  expect(state.events).toEqual(["begin"]);
});

it("continues the remaining notifications after one fails", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    let finish: (() => Promise<void>) | undefined;
    await runWrite({ actor: null }, async (ctx) => {
      ctx.after.push(async () => { throw new Error("SMTP failure"); });
      ctx.after.push(async () => { state.events.push("second"); });
    }, undefined, (job) => { finish = job; });
    await finish!();
    expect(state.events).toEqual(["begin", "commit", "second"]);
    expect(log).toHaveBeenCalledOnce();
  } finally {
    log.mockRestore();
  }
});
