// src/proxy.ts — global password gate via cookie + Basic Auth challenge.
// Next 16 renamed middleware → proxy. Same per-request hook, new name.
// Reads DASHBOARD_PASSWORD from env. Anything else returns 401.
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dashboard_auth";
const COOKIE_VALUE_PREFIX = "ok-";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function proxy(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    // Dev fallback when env not set — let everything through.
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && cookie.startsWith(COOKIE_VALUE_PREFIX)) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const [, pw] = decoded.split(":", 2);
    if (pw === password) {
      const resp = NextResponse.next();
      resp.cookies.set(COOKIE_NAME, `${COOKIE_VALUE_PREFIX}${Date.now()}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return resp;
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="trading.alphalinequant.com"' },
  });
}
