import { z } from "zod";

const schema = z.array(z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  departmentIds: z.array(z.number().int().positive()).min(1),
})).superRefine((areas, ctx) => {
  const ids = new Set<string>();
  const departments = new Set<number>();
  for (const area of areas) {
    if (ids.has(area.id)) ctx.addIssue({ code: "custom", message: "Duplicate area" });
    ids.add(area.id);
    for (const id of area.departmentIds) {
      if (departments.has(id)) ctx.addIssue({ code: "custom", message: "Duplicate department" });
      departments.add(id);
    }
  }
});

export type PortalArea = z.infer<typeof schema>[number];
export interface PortalTopicOption { id: number; name: string; deptId: number }

/** Presentation only: routing and access remain governed by native osTicket topics and permissions. */
export function parsePortalAreas(raw: string | undefined): PortalArea[] {
  if (!raw?.trim()) return [];
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new Error("Invalid TAILTICKET_PORTAL_AREAS configuration");
  }
}

export function areaForDepartment(areas: readonly PortalArea[], deptId: number): PortalArea | undefined {
  return areas.find((area) => area.departmentIds.includes(deptId));
}

export function topicsForArea(topics: readonly PortalTopicOption[], area: PortalArea): PortalTopicOption[] {
  return topics.filter((topic) => area.departmentIds.includes(topic.deptId));
}

/** Newly configured osTicket departments stay selectable without changing the deployment. */
export function portalAreaChoices(areas: PortalArea[], topics: PortalTopicOption[], otherLabel: string): PortalArea[] {
  if (!areas.length) return [];
  const extra = [...new Set(topics.filter((topic) => !areaForDepartment(areas, topic.deptId)).map((topic) => topic.deptId))];
  const configured = areas.filter((area) => topicsForArea(topics, area).length > 0);
  let otherId = "other";
  while (areas.some((area) => area.id === otherId)) otherId += "_";
  return extra.length ? [...configured, { id: otherId, name: otherLabel, departmentIds: extra }] : configured;
}
