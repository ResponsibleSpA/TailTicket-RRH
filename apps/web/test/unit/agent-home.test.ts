import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatQueueName } from "@/lib/format/queue-name";
import en from "@/messages/en.json";
import itMessages from "@/messages/it.json";
import { ConfigNamespace } from "@/server/config/config";
import { defaultQueueId } from "@/server/domain/queue/context";
import type { Agent } from "@/server/domain/staff/staff";

const system = vi.hoisted(() => ({ queue: undefined as string | undefined }));
vi.mock("@/server/config/config", async (original) => {
  const actual = await original<typeof import("@/server/config/config")>();
  return {
    ...actual,
    coreConfig: async () => new actual.ConfigNamespace("core", new Map(system.queue === undefined ? [] : [["default_ticket_queue", system.queue]])),
  };
});
vi.mock("@/server/domain/queue/engine", () => ({ queueCounts: vi.fn() }));
vi.mock("@/server/domain/queue/queues", () => ({ loadQueues: vi.fn(), navigableQueues: vi.fn() }));
vi.mock("@/server/format/datetime", () => ({ agentTimeZone: vi.fn() }));

const agentWithQueue = (queue?: string) => ({
  config: new ConfigNamespace("staff.7", new Map(queue === undefined ? [] : [["default_ticket_queue_id", queue]])),
}) as Agent;

describe("coda iniziale compatibile con osTicket", () => {
  beforeEach(() => { system.queue = undefined; });

  it("rispetta la preferenza personale prima di quella globale", async () => {
    system.queue = "1";
    expect(await defaultQueueId(agentWithQueue("5"))).toBe(5);
  });

  it("con preferenza personale a zero usa la coda di sistema", async () => {
    system.queue = "8";
    expect(await defaultQueueId(agentWithQueue("0"))).toBe(8);
  });

  it("senza preferenze apre la coda dei ticket aperti", async () => {
    expect(await defaultQueueId(agentWithQueue())).toBe(1);
    system.queue = "0";
    expect(await defaultQueueId(agentWithQueue("0"))).toBe(1);
  });
});

describe("nome della coda dei ticket aperti", () => {
  const t = createTranslator({ locale: "it", messages: { queues: itMessages.queues as Record<string, string> }, namespace: "queues" });

  it.each(["Open", "Aperto", "Aperti"])("adatta anche il titolo già salvato nel DB: %s", (title) => {
    expect(formatQueueName(title, 1, t)).toBe("Aperto");
    for (const count of [0, 2, 21, 100]) expect(formatQueueName(title, count, t)).toBe("Aperti");
    expect(formatQueueName(title, null, t)).toBe("Aperti");
  });

  it("preserva i titoli personalizzati e traduce le altre code", () => {
    expect(formatQueueName("Aperti urgenti", 1, t)).toBe("Aperti urgenti");
    expect(formatQueueName("My Tickets", 2, t)).toBe("I miei ticket");
  });

  it("traduce anche il titolo italiano del DB nell'interfaccia inglese", () => {
    const english = createTranslator({ locale: "en", messages: { queues: en.queues as Record<string, string> }, namespace: "queues" });
    expect(formatQueueName("Aperto", 1, english)).toBe("Open");
    expect(formatQueueName("Aperto", 2, english)).toBe("Open");
  });
});
