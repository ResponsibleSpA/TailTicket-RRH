import { describe, expect, it } from "vitest";

import { parsePortalAreas, portalAreaChoices, topicsForArea } from "@/lib/portal-areas";

const areas = [
  { id: "it", name: "IT / Sanitari", departmentIds: [1, 4] },
  { id: "maintenance", name: "Manutenzione", departmentIds: [5] },
];
const topics = [
  { id: 12, name: "Informatica", deptId: 1 },
  { id: 17, name: "Applicativi Sanitari", deptId: 4 },
  { id: 28, name: "Manutenzione", deptId: 5 },
];

describe("aree del portale", () => {
  it("raggruppa IT e Sanitari mantenendo l'argomento e il reparto di destinazione di osTicket", () => {
    expect(topicsForArea(topics, areas[0]).map((topic) => topic.id)).toEqual([12, 17]);
    expect(topicsForArea(topics, areas[1])).toEqual([topics[2]]);
  });

  it("una modifica del reparto nell'help topic sposta la scelta nell'altra area", () => {
    const changed = topics.map((topic) => topic.id === 12 ? { ...topic, deptId: 5 } : topic);
    expect(topicsForArea(changed, areas[0]).map((topic) => topic.id)).toEqual([17]);
    expect(topicsForArea(changed, areas[1]).map((topic) => topic.id)).toEqual([12, 28]);
  });

  it("mantiene selezionabili i nuovi reparti di osTicket e nasconde le aree senza argomenti pubblici", () => {
    const choices = portalAreaChoices(areas, [topics[0], { id: 99, name: "Altro", deptId: 9 }], "Altri servizi");
    expect(choices.map((area) => area.name)).toEqual(["IT / Sanitari", "Altri servizi"]);
    expect(topicsForArea([{ id: 99, name: "Altro", deptId: 9 }], choices[1]).map((topic) => topic.id)).toEqual([99]);
    expect(portalAreaChoices([], topics, "Altro")).toEqual([]);
  });

  it("rifiuta reparti duplicati e configurazioni invalide, senza alterare i permessi osTicket", () => {
    expect(parsePortalAreas(undefined)).toEqual([]);
    expect(() => parsePortalAreas(JSON.stringify([...areas, { id: "other", name: "Altro", departmentIds: [5] }]))).toThrow();
    expect(() => parsePortalAreas("invalid")).toThrow();
  });
});
