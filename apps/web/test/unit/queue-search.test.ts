import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, type CompiledQuery } from "kysely";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { ConfigNamespace } from "@/server/config/config";
import type { DB } from "@/server/db/schema.gen";
import { TablePrefixPlugin } from "@/server/db/table-prefix-plugin";
import { listQueueTickets } from "@/server/domain/queue/engine";
import { adhocQueue, quickSearchCriteria } from "@/server/domain/queue/queues";
import { Agent, PermissionSet } from "@/server/domain/staff/staff";

vi.mock("@/server/env", () => ({ installConfig: () => ({ tablePrefix: "ost_" }) }));
vi.mock("@/server/config/config", async (original) => {
  const actual = await original<typeof import("@/server/config/config")>();
  return { ...actual, coreConfig: async () => new actual.ConfigNamespace("core", new Map()) };
});

const queries: CompiledQuery[] = [];
const executor = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (d) => new MysqlIntrospector(d),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
  plugins: [new TablePrefixPlugin("ost_")],
  log: (event) => { queries.push(event.query); },
});

afterEach(() => { queries.length = 0; });
afterAll(() => executor.destroy());

function agent(searchAll: boolean): Agent {
  return new Agent(
    { staff_id: 7, assigned_only: 0, permissions: JSON.stringify({ "search.all": searchAll ? 1 : 0 }) } as Agent["row"],
    new Map(),
    { id: 1, name: "", perms: new PermissionSet("{}") },
    [2], [], [],
    new ConfigNamespace("staff.7", new Map()),
  );
}

describe("ricerca ticket: SQL della lista e del totale", () => {
  // Con search.all il filtro full-text è nel JOIN: può non esserci alcun predicato WHERE.
  it.each(["ciao", "ab"])("search.all: ricerca %s senza WHERE vuoto", async (text) => {
    const staff = agent(true);
    const queue = adhocQueue(staff, quickSearchCriteria(text)!, text);
    await listQueueTickets(staff, queue, { page: 2, pageSize: 10 }, { userTz: "UTC" }, executor);
    const list = queries.find((q) => q.sql.includes("SELECT T.ticket_id"))!;
    const count = queries.find((q) => q.sql.includes("SELECT COUNT(DISTINCT T.ticket_id)"))!;
    expect(list.sql).toMatch(/WHERE\s+1\s+GROUP BY T\.ticket_id/);
    expect(count.sql).toMatch(/WHERE\s+1\s*$/);
    expect(list.parameters.slice(-2)).toEqual([10, 10]);
    for (const q of [list, count]) {
      expect(q.sql).not.toContain("T.staff_id =");
      expect(q.sql.includes("MATCH (Z1.title, Z1.content)")).toBe(text.length >= 3);
      if (text.length >= 3) expect(q.parameters).toContain(text);
    }
  });

  it("senza search.all conserva i vincoli di visibilità nella lista e nel totale", async () => {
    const staff = agent(false);
    const queue = adhocQueue(staff, quickSearchCriteria("ciao")!, "ciao");
    await listQueueTickets(staff, queue, { pageSize: 10 }, { userTz: "UTC" }, executor);
    const results = queries.filter((q) => q.sql.includes("SELECT T.ticket_id") || q.sql.includes("SELECT COUNT(DISTINCT T.ticket_id)"));
    expect(results).toHaveLength(2);
    for (const q of results) {
      expect(q.sql).toContain("T.staff_id = ?");
      expect(q.sql).toContain("T.dept_id IN (?)");
      expect(q.parameters).toContain(staff.id);
      expect(q.parameters).toContain(staff.deptIds[0]);
    }
  });
});
