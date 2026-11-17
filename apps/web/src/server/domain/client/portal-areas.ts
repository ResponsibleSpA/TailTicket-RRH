import "server-only";

import { parsePortalAreas } from "@/lib/portal-areas";

let previous: string | undefined;
let cached: ReturnType<typeof parsePortalAreas> = [];

export function portalAreas() {
  const raw = process.env.TAILTICKET_PORTAL_AREAS;
  if (raw !== previous) {
    const parsed = parsePortalAreas(raw);
    cached = parsed;
    previous = raw;
  }
  return cached;
}
