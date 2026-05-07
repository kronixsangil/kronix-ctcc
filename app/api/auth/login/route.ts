// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_COOKIE = "ctcc_session";
const ADMIN_AT_COOKIE = "ct_at_admin";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API;
  if (!base) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");
  return base;
}

function getWrongRoleMessage(role: string) {
  const r = String(role || "").toUpperCase();

  if (r === "BUYER") {
    return "Tu cuenta es de cliente. Debes ingresar desde la app Buyer.";
  }
  if (r === "DRIVER") {
    return "Tu cuenta es de conductor. Debes ingresar desde la app Driver.";
  }
  if (r === "STORE") {
    return "Tu cuenta es de tienda. Debes ingresar desde la app Store.";
  }
  return "Tu cuenta no tiene permisos para ingresar al CTCC. Usa la aplicación correspondiente a tu perfil.";
}

function appendUpstreamCookies(res: NextResponse, upstream: Response) {
  const anyHeaders = upstream.headers as any;

  const setCookies =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : [];

  if (Array.isArray(setCookies) && setCookies.length) {
    for (const cookie of setCookies) {
      res.headers.append("Set-Cookie", cookie);
    }
    return;
  }

  const single = upstream.headers.get("set-cookie");
  if (single) {
    res.headers.append("Set-Cookie", single);
  }
}

export async function POST(req: Request) {
  const apiBase = getApiBase();
  const body = await req.json().catch(() => ({}));

  const emailOrPhone = String(body?.emailOrPhone ?? body?.email ?? "").trim();
  const password = String(body?.password ?? "").trim();

  if (!emailOrPhone || !password) {
    return NextResponse.json(
      { message: "Falta emailOrPhone y/o password" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ct-app": "admin",
    },
    body: JSON.stringify({ emailOrPhone, password }),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message || "Credenciales inválidas" },
      { status: upstream.status }
    );
  }

  const role = String(data?.user?.role ?? "").toUpperCase();
  const accessToken = String(data?.accessToken ?? "").trim();

  if (!["ADMIN", "FINANCE"].includes(role)) {
    return NextResponse.json(
      { message: getWrongRoleMessage(role) },
      { status: 403 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { message: "Login OK pero el backend no devolvió accessToken." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  appendUpstreamCookies(res, upstream);

  res.cookies.set(SESSION_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  res.cookies.set(ADMIN_AT_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  res.headers.set("Cache-Control", "no-store");
  return res;
}