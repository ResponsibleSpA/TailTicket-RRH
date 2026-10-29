import { once } from "node:events";
import { createServer, type RequestListener, type Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import { oauth2Provider } from "@/server/auth/oauth2-bridge";

const SECRET = "attach-test-secret-independent-at-least-32-bytes";
const servers: Server[] = [];

async function endpoint(handler: RequestListener): Promise<string> {
  const server = createServer(handler);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test port");
  return `http://127.0.0.1:${address.port}/api/tailticket-sso.php`;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  })));
});

describe("OAuth2 provider discovery against an attached PHP endpoint", () => {
  it("authenticates to the explicit PHP URL and offers only the registered realm", async () => {
    const requests: { url?: string; key?: string | string[]; cookie?: string }[] = [];
    const url = await endpoint((request, response) => {
      requests.push({ url: request.url, key: request.headers["x-tailticket-sso-key"], cookie: request.headers.cookie });
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ staff: { id: "oauth2.agent", label: "Google" } }));
    });
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", url);
    vi.stubEnv("OST_PHP_URL", "https://classic.example.test:8443");

    expect(await oauth2Provider("staff")).toBe("Google");
    expect(await oauth2Provider("client")).toBeNull();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual({ url: "/api/tailticket-sso.php?action=providers", key: SECRET, cookie: undefined });
  });

  it("does not send the signing secret to a redirected endpoint", async () => {
    let redirectedRequests = 0;
    const target = await endpoint((_request, response) => {
      redirectedRequests++;
      response.end(JSON.stringify({ staff: { id: "oauth2.agent", label: "Google" } }));
    });
    const source = await endpoint((_request, response) => {
      response.writeHead(302, { Location: target });
      response.end();
    });
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", source);

    expect(await oauth2Provider("staff")).toBeNull();
    expect(redirectedRequests).toBe(0);
  });

  it("recognizes native instance identifiers and rejects a changed provider at handoff", async () => {
    const url = await endpoint((_request, response) => {
      response.end(JSON.stringify({
        staff: { id: "oauth2.agent.p3i2", label: "Google" },
        client: { id: "oauth2.user.p3i2", label: "Google" },
      }));
    });
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", url);

    expect(await oauth2Provider("staff")).toBe("Google");
    expect(await oauth2Provider("client")).toBe("Google");
    expect(await oauth2Provider("staff", "oauth2.agent.p3i2")).toBe("Google");
    expect(await oauth2Provider("staff", "oauth2.agent.p3i9")).toBeNull();
    expect(await oauth2Provider("staff", "oauth2.agent")).toBeNull();
    expect(await oauth2Provider("client", "oauth2.agent.p3i2")).toBeNull();
  });

  it.each([
    [403, "Authentication not available"],
    [503, "PHP unavailable"],
    [200, "<html>Classic login</html>"],
    [200, "{}"],
    [200, "null"],
    [200, JSON.stringify({ staff: { id: "oauth2.user", label: "Google" } })],
  ])("fails closed for status %i with response %s", async (status, body) => {
    const url = await endpoint((_request, response) => {
      response.writeHead(status);
      response.end(body);
    });
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", url);
    expect(await oauth2Provider("staff")).toBeNull();
  });

  it("stays disabled when attach has no shared secret or discovery URL", async () => {
    vi.stubEnv("TAILTICKET_SSO_SECRET", "");
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", "https://classic.example.test/api/tailticket-sso.php");
    expect(await oauth2Provider("staff")).toBeNull();
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    vi.stubEnv("TAILTICKET_SSO_PHP_INTERNAL_URL", "");
    expect(await oauth2Provider("staff")).toBeNull();
  });
});
