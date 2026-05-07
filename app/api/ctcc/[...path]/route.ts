//app\api\ctcc\[...path]\route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_AT_COOKIE = "ct_at_admin";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API;
  if (!base) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");
  return base.replace(/\/$/, "");
}

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const apiBase = getApiBase();

  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${ADMIN_AT_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!token) {
    return NextResponse.json({ message: "Sesión CTCC no encontrada." }, { status: 401 });
  }

  const url = new URL(req.url);
  const targetPath = path.join("/");
  const targetUrl = `${apiBase}/${targetPath}${url.search}`;

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const upstream = await fetch(targetUrl, {
    method,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
      "x-ct-app": "admin",
      Authorization: `Bearer ${decodeURIComponent(token)}`,
    },
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  const text = await upstream.text().catch(() => "");
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType || "text/plain",
    },
  });
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function PUT(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}