import { NextRequest, NextResponse } from "next/server";

import {
  bridgeSecret,
  oauth2Provider,
  SSO_PENDING_COOKIE,
  SSO_PENDING_SECONDS,
  startSsoTransaction,
  type SsoRealm,
} from "@/server/auth/oauth2-bridge";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const realm = request.nextUrl.searchParams.get("realm");
  if (realm !== "staff" && realm !== "client") return new Response(null, { status: 400 });
  const phpBase = process.env.OST_PHP_URL;
  if (!bridgeSecret() || !phpBase || !(await oauth2Provider(realm as SsoRealm))) {
    return new Response("External sign-in is not available", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  // Base URL is trusted deployment configuration; do not accept a URL from the browser.
  const php = new URL(phpBase.replace(/\/$/, "") + "/api/tailticket-sso.php", request.url);
  if (!["http:", "https:"].includes(php.protocol) || php.username || php.password) {
    return new Response(null, { status: 503 });
  }
  const { nonce, cookie } = startSsoTransaction(realm, request.nextUrl.searchParams.get("next"));
  php.searchParams.set("action", "start");
  php.searchParams.set("realm", realm);
  php.searchParams.set("nonce", nonce);

  const response = NextResponse.redirect(php);
  response.cookies.set(SSO_PENDING_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SSO_PENDING_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
