import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { isAgentPath, isPortalPath, safeRedirectPath } from "../actions/redirect-path";
import { sharedStore } from "./bounded-store";

/**
 * Handoff from the official osTicket OAuth2 PHP backend, not another OAuth
 * implementation. Server state is process-local, like the existing MFA and
 * revocation stores: this feature currently requires one Next.js instance.
 */
export type SsoRealm = "staff" | "client";
export const SSO_PENDING_COOKIE = "ostn_oauth2_pending";
export const SSO_PENDING_SECONDS = 300;

interface PendingLogin {
  realm: SsoRealm;
  next: string;
}
interface BridgeProof {
  v: 1;
  realm: SsoRealm;
  uid: number;
  backend: string;
  nonce: string;
  iat: number;
  exp: number;
  jti: string;
}

const pending = sharedStore<PendingLogin>("oauth2-pending", 10_000);
const redeemed = sharedStore<true>("oauth2-redeemed", 10_000);

export function bridgeSecret(): string | null {
  const value = process.env.TAILTICKET_SSO_SECRET ?? "";
  return Buffer.byteLength(value, "utf8") >= 32 ? value : null;
}

/** Only an actually registered, enabled PHP OAuth backend is offered. */
export async function oauth2Provider(realm: SsoRealm): Promise<string | null> {
  const secret = bridgeSecret();
  const endpoint = process.env.TAILTICKET_SSO_PHP_INTERNAL_URL;
  if (!secret || !endpoint) return null;

  try {
    const url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    url.searchParams.set("action", "providers");
    const result = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: { "X-TailTicket-SSO-Key": secret },
    });
    if (!result.ok) return null;
    const payload: unknown = await result.json();
    if (!payload || typeof payload !== "object") return null;
    const option = (payload as Record<string, unknown>)[realm];
    if (!option || typeof option !== "object") return null;
    const { id, label } = option as Record<string, unknown>;
    if (id !== (realm === "staff" ? "oauth2.agent" : "oauth2.user")) return null;
    return typeof label === "string" && label.trim() ? label.trim().slice(0, 100) : "OAuth2";
  } catch {
    // PHP/plugin unavailable: hide the button, leave local authentication intact.
    return null;
  }
}

/** Create a one-time browser-bound login transaction; never trust next from PHP. */
export function startSsoTransaction(realm: SsoRealm, next: unknown): string {
  const nonce = randomBytes(24).toString("base64url");
  const fallback = realm === "staff" ? "/agent" : "/tickets";
  const path = safeRedirectPath(next, fallback, realm === "staff" ? isAgentPath : isPortalPath);
  pending.set(nonce, { realm, next: path }, Math.floor(Date.now() / 1000) + SSO_PENDING_SECONDS);
  return nonce;
}

/** Consume even on a failed callback, so no transaction can be retried. */
export function takeSsoTransaction(nonce: string): PendingLogin | null {
  const tx = pending.get(nonce);
  pending.delete(nonce);
  return tx ?? null;
}

/** Constant-time authentication, strict typed claims, expiry and replay check. */
export function redeemSsoProof(proof: string, secret: string, nonce: string, realm: SsoRealm, now = Math.floor(Date.now() / 1000)): BridgeProof | null {
  if (proof.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(proof)) return null;
  const [body, signature] = proof.split(".");
  const provided = Buffer.from(signature, "base64url");
  const expected = createHmac("sha256", secret).update(body, "ascii").digest();
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  if (p.v !== 1 || p.realm !== realm || p.nonce !== nonce || p.backend !== (realm === "staff" ? "oauth2.agent" : "oauth2.user")) return null;
  if (!Number.isSafeInteger(p.uid) || (p.uid as number) <= 0) return null;
  if (!Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp)) return null;
  const iat = p.iat as number;
  const exp = p.exp as number;
  if (iat > now + 30 || iat < now - 90 || exp <= now || exp > iat + 60 || exp <= iat) return null;
  if (typeof p.jti !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(p.jti)) return null;
  if (redeemed.get(p.jti, now)) return null;
  // Atomic (synchronous) read-and-set in the documented single-process deployment.
  redeemed.set(p.jti, true, exp, now);
  return p as unknown as BridgeProof;
}
