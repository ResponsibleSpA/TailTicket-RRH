import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/osticket/callback/route";

describe("OAuth2 callback behind the attach reverse proxy", () => {
  it("returns to the public origin with a relative redirect and clears an invalid pending cookie", async () => {
    const request = new NextRequest("https://0.0.0.0:3000/api/auth/osticket/callback?proof=invalid", {
      headers: { Host: "ticket.responsible.hospital", Cookie: "ostn_oauth2_pending=invalid" },
    });
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("/login?sso_error=1");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.cookies.get("ostn_oauth2_pending")?.value).toBe("");
    expect(response.cookies.get("ostn_staff")).toBeUndefined();
    expect(response.cookies.get("ostn_client")).toBeUndefined();
  });
});
