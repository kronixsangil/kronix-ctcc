import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Only the CTCC page can explicitly request an activity renewal.
  if (req.headers.get("x-ctcc-activity") !== "1") {
    return new NextResponse(null, { status: 403 });
  }
  const base = process.env.NEXT_PUBLIC_API?.replace(/\/$/, "");
  if (!base) return new NextResponse(null, { status: 503 });
  const upstream = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "x-ct-app": "admin", cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return new NextResponse(null, { status: [400, 401, 403].includes(upstream.status) ? 401 : 503 });
  }

  const { accessToken } = await upstream.json();
  const exp = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()).exp;
  const response = NextResponse.json({ expiresAt: exp * 1000 }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set("ct_at_admin", accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 7200,
  });
  response.cookies.set("ctcc_session", "ok", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 7200,
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    if (/^ct_(sid|rt)_admin=/.test(cookie)) response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
