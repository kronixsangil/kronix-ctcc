// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API;
  if (!base) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");
  return base;
}

// cookies reales del admin
const ADMIN_COOKIES = ["ct_at_admin", "ct_sid_admin", "ct_rt_admin", "ctcc_session"];

export async function POST(req: Request) {
  const apiBase = getApiBase();

  // ✅ reenviar cookies del navegador al API (clave)
  const cookieHeader = req.headers.get("cookie") ?? "";

  try {
    await fetch(`${apiBase}/auth/logout`, {
      method: "POST",
      headers: {
        "x-ct-app": "admin",
        cookie: cookieHeader, // 👈 CLAVE
      },
      cache: "no-store",
    });
  } catch {
    // aunque falle, igual limpiamos local
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  // ✅ borrar cookies en el dominio actual
  for (const name of ADMIN_COOKIES) {
    res.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  res.headers.set("Cache-Control", "no-store");
  return res;
}