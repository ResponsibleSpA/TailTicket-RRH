import { createHmac, randomBytes } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeSecret, redeemSsoProof, startSsoTransaction, takeSsoTransaction } from "@/server/auth/oauth2-bridge";

const SECRET = "bridge-integration-test-secret-at-least-32-bytes";

function makeProof(overrides: Record<string, unknown> = {}, secret = SECRET) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    realm: "staff",
    uid: 23,
    backend: "oauth2.agent",
    nonce: randomBytes(24).toString("base64url"),
    iat: now,
    exp: now + 60,
    jti: randomBytes(24).toString("base64url"),
    ...overrides,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body, "ascii").digest("base64url");
  return { proof: body + "." + mac, payload };
}

afterEach(() => vi.unstubAllEnvs());

describe("OAuth2 PHP/Next bridge", () => {
  it("requires an independent sufficiently long shared secret", () => {
    vi.stubEnv("TAILTICKET_SSO_SECRET", "");
    expect(bridgeSecret()).toBeNull();
    vi.stubEnv("TAILTICKET_SSO_SECRET", "too-short");
    expect(bridgeSecret()).toBeNull();
    vi.stubEnv("TAILTICKET_SSO_SECRET", SECRET);
    expect(bridgeSecret()).toBe(SECRET);
  });

  it("binds a pending transaction to the realm and a safe internal destination, then consumes it", () => {
    const { nonce, cookie } = startSsoTransaction("staff", "/agent/tickets/123?tab=notes");
    expect(takeSsoTransaction(nonce)).toBeNull(); // URL nonce is not enough
    const forgedVerifier = nonce + "." + randomBytes(24).toString("base64url");
    expect(takeSsoTransaction(forgedVerifier)).toBeNull();
    expect(takeSsoTransaction(cookie)).toEqual({ realm: "staff", next: "/agent/tickets/123?tab=notes", nonce });
    expect(takeSsoTransaction(cookie)).toBeNull();
    const rejected = startSsoTransaction("client", "//evil.test/steal");
    expect(takeSsoTransaction(rejected.cookie)).toEqual({ realm: "client", next: "/tickets", nonce: rejected.nonce });
    const crossRealm = startSsoTransaction("client", "/agent/admin");
    expect(takeSsoTransaction(crossRealm.cookie)).toEqual({ realm: "client", next: "/tickets", nonce: crossRealm.nonce });
  });

  it("accepts a valid assertion once only", () => {
    const { proof, payload } = makeProof();
    expect(redeemSsoProof(proof, SECRET, payload.nonce, "staff")).toMatchObject({ uid: 23, realm: "staff" });
    expect(redeemSsoProof(proof, SECRET, payload.nonce, "staff")).toBeNull();
  });

  it("preserves the native plugin instance in staff and client assertions", () => {
    const staff = makeProof({ backend: "oauth2.agent.p3i2" });
    expect(redeemSsoProof(staff.proof, SECRET, staff.payload.nonce, "staff"))
      .toMatchObject({ backend: "oauth2.agent.p3i2" });
    const client = makeProof({ realm: "client", backend: "oauth2.user.p3i2" });
    expect(redeemSsoProof(client.proof, SECRET, client.payload.nonce, "client"))
      .toMatchObject({ backend: "oauth2.user.p3i2" });
  });

  it.each(["oauth2.agent.evil", "oauth2.agent.p0i2", "oauth2.agent.p3i0", "oauth2.agent.p3i2:other", "oauth2.user.p3i2"])
    ("rejects an invalid or cross-realm instance: %s", (backend) => {
      const { proof, payload } = makeProof({ backend });
      expect(redeemSsoProof(proof, SECRET, payload.nonce, "staff")).toBeNull();
    });

  it("rejects tampering, an unknown secret, wrong nonce, realm or backend", () => {
    const { proof, payload } = makeProof();
    expect(redeemSsoProof(proof, "another-test-secret-with-at-least-32-bytes", payload.nonce, "staff")).toBeNull();
    expect(redeemSsoProof(proof, SECRET, "wrong-nonce", "staff")).toBeNull();
    expect(redeemSsoProof(proof, SECRET, payload.nonce, "client")).toBeNull();
    expect(redeemSsoProof(proof + "invalid", SECRET, payload.nonce, "staff")).toBeNull();
    const wrongBackend = makeProof({ backend: "local" });
    expect(redeemSsoProof(wrongBackend.proof, SECRET, wrongBackend.payload.nonce, "staff")).toBeNull();
  });

  it("rejects expired, future-dated and unreasonably long-lived assertions", () => {
    const now = Math.floor(Date.now() / 1000);
    for (const fields of [
      { iat: now - 100, exp: now - 1 },
      { iat: now + 35, exp: now + 90 },
      { iat: now, exp: now + 3600 },
    ]) {
      const { proof, payload } = makeProof(fields);
      expect(redeemSsoProof(proof, SECRET, payload.nonce, "staff", now)).toBeNull();
    }
  });

  it("refuses invalid IDs and replay identifiers", () => {
    for (const fields of [{ uid: 0 }, { uid: -1 }, { uid: 1.5 }, { jti: "predictable" }]) {
      const { proof, payload } = makeProof(fields);
      expect(redeemSsoProof(proof, SECRET, payload.nonce, "staff")).toBeNull();
    }
  });
});
