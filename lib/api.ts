// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API;

let lastCtccActivityRefreshAt = 0;
let ctccActivityRefreshPromise: Promise<void> | null = null;

function getBase() {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");

  // ✅ CTCC ahora NO llama directo a Railway desde el navegador.
  // ✅ Llama a un proxy local que lee la cookie ct_at_admin y envía Bearer al backend.
  return "/api/ctcc";
}

function emitSessionExpired(message?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("ctcc:session-expired", {
      detail: {
        message:
          String(message ?? "").trim() ||
          "Tu sesión ha vencido por tiempo de inactividad. Debes iniciar sesión nuevamente.",
      },
    })
  );
}

async function readErrorPayload(res: Response) {
  const data = await res.json().catch(() => ({}));
  return {
    message:
      data?.message ||
      data?.error ||
      "Error inesperado del servidor",
    data,
  };
}

function isAuthError(res: Response, payloadMessage?: string) {
  if (res.status === 401 || res.status === 403) return true;

  const msg = String(payloadMessage ?? "").toLowerCase();

  return (
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("token") ||
    msg.includes("jwt") ||
    msg.includes("sesión") ||
    msg.includes("sesion") ||
    msg.includes("session") ||
    msg.includes("credenciales")
  );
}

function shouldRefreshCtccActivity(path: string) {
  if (typeof window === "undefined") return false;

  const p = String(path || "");
  if (p.includes("/auth/login")) return false;
  if (p.includes("/auth/logout")) return false;
  if (p.includes("/auth/refresh")) return false;

  return true;
}

async function refreshCtccActivityIfNeeded(path: string) {
  if (!shouldRefreshCtccActivity(path)) return;

  const now = Date.now();

  // ✅ Conservamos la lógica de control de actividad.
  // Por ahora NO llamamos /auth/refresh directo a Railway porque CTCC está usando proxy local.
  // Esto evita que una llamada de refresh cruzada dispare Unauthorized falso.
  if (now - lastCtccActivityRefreshAt < 120_000) return;

  if (ctccActivityRefreshPromise) {
    await ctccActivityRefreshPromise.catch(() => {});
    return;
  }

  ctccActivityRefreshPromise = Promise.resolve()
    .then(() => {
      lastCtccActivityRefreshAt = Date.now();
    })
    .finally(() => {
      ctccActivityRefreshPromise = null;
    });

  await ctccActivityRefreshPromise;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBase();

  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${base}${cleanPath}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const payload = await readErrorPayload(res);

    if (isAuthError(res, payload.message)) {
      emitSessionExpired(payload.message);
    }

    throw new Error(payload.message);
  }

  await refreshCtccActivityIfNeeded(cleanPath);

  return res.json();
}

export async function apiFetchRaw(path: string, options?: RequestInit): Promise<Response> {
  const base = getBase();

  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${base}${cleanPath}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = "Error inesperado del servidor";

    try {
      const clone = res.clone();
      const data = await clone.json().catch(() => ({}));
      message = data?.message || data?.error || message;

      if (isAuthError(res, message)) {
        emitSessionExpired(message);
      }
    } catch {
      if (res.status === 401 || res.status === 403) {
        emitSessionExpired(
          "Tu sesión ha vencido por tiempo de inactividad. Debes iniciar sesión nuevamente."
        );
      }
    }
  } else {
    await refreshCtccActivityIfNeeded(cleanPath);
  }

  return res;
}