import { NextRequest, NextResponse } from "next/server";

import { UserAccountStatus } from "@/lib/osticket/flags";

import { clientIp, writeSession } from "@/server/auth/session";
import { startClientSession } from "@/server/auth/client-auth";
import { bridgeSecret, oauth2Provider, redeemSsoProof, SSO_PENDING_COOKIE, takeSsoTransaction, type SsoRealm } from "@/server/auth/oauth2-bridge";
import { db } from "@/server/db";
import { loadAgent } from "@/server/domain/staff/staff";
import { accountIsActive, loadClientIdentity, passwordVersion } from "@/server/domain/client/identity";
import { canWrite } from "@/server/system/write-mode";

export const dynamic = "force-dynamic";

function redirectClean(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(SSO_PENDING_COOKIE);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/**
 * PHP has already verified OAuth2, its state, the backend and the full osTicket
 * session (including 2FA). Next independently verifies the signed proof and
 * browser transaction and re-checks the local account before issuing a JWT.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SSO_PENDING_COOKIE)?.value ?? "";
  const tx = cookie ? takeSsoTransaction(cookie) : null;
  const nonce = tx?.nonce ?? "";
  const realm: SsoRealm = tx?.realm ?? "client";
  const failure = () => redirectClean(request, (realm === "staff" ? "/agent/login" : "/login") + "?sso_error=1");
  const secret = bridgeSecret();
  const proof = request.nextUrl.searchParams.get("proof");
  if (!tx || !secret || !proof) return failure();
  const identity = redeemSsoProof(proof, secret, nonce, tx.realm);
  if (!identity) return failure();

  // Disabling a PHP plugin instance immediately prevents further handoffs.
  if (!(await oauth2Provider(tx.realm))) return failure();
  try {
    if (tx.realm === "staff") {
      const row = await db()
        .selectFrom("staff")
        .select(["staff_id", "backend", "passwdreset", "isactive"])
        .where("staff_id", "=", identity.uid)
        .executeTakeFirst();
      if (!row || !row.isactive || (row.backend && row.backend.toLowerCase() !== "oauth2.agent")) return failure();
      const agent = await loadAgent(identity.uid);
      if (!agent || !agent.isActive) return failure();
      await writeSession({
        realm: "staff",
        uid: agent.id,
        pwv: agent.row.passwdreset ?? "",
        ip: await clientIp(),
        last: Math.floor(Date.now() / 1000),
      });
      const changePassword = agent.mustChangePassword && (await canWrite("operational"));
      return redirectClean(request, changePassword ? "/agent/profile?pwchange=1" : tx.next);
    }

    const client = await loadClientIdentity(identity.uid);
    if (!client?.account || !accountIsActive(client.account)) return failure();
    await startClientSession({
      userId: identity.uid,
      pwv: passwordVersion(client.account.passwd),
      guest: null,
    });
    const changePassword = (client.account.status & UserAccountStatus.REQUIRE_PASSWD_RESET) !== 0 && (await canWrite("operational"));
    return redirectClean(request, changePassword ? "/profile?pwchange=1" : tx.next);
  } catch {
    // Do not leak DB state, PHP identity or provider response to the browser.
    return failure();
  }
}
