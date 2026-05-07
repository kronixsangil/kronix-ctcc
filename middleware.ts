// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FALLBACK_COOKIE = "ctcc_session";
const ADMIN_AT_COOKIE = "ct_at_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");

  if (isPublic) return NextResponse.next();

  const at = req.cookies.get(ADMIN_AT_COOKIE)?.value;
  const fallback = req.cookies.get(FALLBACK_COOKIE)?.value;

  if (!at && !fallback) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "session-expired");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};