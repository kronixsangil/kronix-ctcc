// app/(auth)/login/page.tsx
// app/(auth)/login/page.tsx
"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API;

type AuthView = "LOGIN" | "FORGOT_REQUEST" | "FORGOT_CONFIRM";

function LoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/dashboard", [sp]);

  const [view, setView] = useState<AuthView>("LOGIN");

  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("123456");

  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailOrPhone = String(email ?? "").trim();
    const pass = String(password ?? "").trim();

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrPhone, password: pass }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Credenciales inválidas");
      }

      router.replace(next);
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function requestPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);

    try {
      const identifier = String(forgotIdentifier ?? "").trim();
      if (!identifier) throw new Error("Ingresa tu email o teléfono.");

      if (!API_BASE) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");

      const res = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ct-app": "admin",
        },
        credentials: "include",
        body: JSON.stringify({ emailOrPhone: identifier }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo solicitar el código.");
      }

      let msg = "Te enviamos un código de recuperación. Revisa tu email o teléfono asociado.";
      if (data?.devCode) {
        msg = `Código enviado correctamente. Código DEV: ${data.devCode}`;
      }

      setForgotMsg(msg);
      setView("FORGOT_CONFIRM");
    } catch (err: any) {
      setForgotError(err?.message || "No se pudo solicitar el código.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function confirmPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);

    try {
      const identifier = String(forgotIdentifier ?? "").trim();
      const code = String(resetCode ?? "").trim();
      const p1 = String(newPassword ?? "").trim();
      const p2 = String(confirmPassword ?? "").trim();

      if (!identifier) throw new Error("Ingresa tu email o teléfono.");
      if (!code) throw new Error("Ingresa el código de recuperación.");
      if (!p1 || p1.length < 6) throw new Error("La nueva contraseña debe tener mínimo 6 caracteres.");
      if (p1 !== p2) throw new Error("Las contraseñas no coinciden.");

      if (!API_BASE) throw new Error("NEXT_PUBLIC_API no está definido en .env.local");

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ct-app": "admin",
        },
        credentials: "include",
        body: JSON.stringify({
          emailOrPhone: identifier,
          code,
          newPassword: p1,
        }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo actualizar la contraseña.");
      }

      setForgotMsg("Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
      setView("LOGIN");
      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    } catch (err: any) {
      setForgotError(err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgot() {
    setError(null);
    setForgotError(null);
    setForgotMsg(null);
    setForgotIdentifier(String(email ?? "").trim());
    setView("FORGOT_REQUEST");
  }

  function backToLogin() {
    setForgotError(null);
    setForgotMsg(null);
    setView("LOGIN");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        {view === "LOGIN" ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">KroniX Control Center</h1>
              <p className="text-sm text-slate-300 mt-1">Acceso administrativo.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-200">Email o Teléfono</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-200">Contraseña</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {forgotMsg ? (
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  {forgotMsg}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-slate-200 text-slate-900 py-2 font-medium hover:bg-white disabled:opacity-60"
              >
                {loading ? "Ingresando..." : "Entrar"}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-sm text-slate-300 hover:text-white underline underline-offset-4"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </>
        ) : null}

        {view === "FORGOT_REQUEST" ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
              <p className="text-sm text-slate-300 mt-1">
                Ingresa tu email o teléfono y te enviaremos un código.
              </p>
            </div>

            <form onSubmit={requestPasswordReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-200">Email o Teléfono</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="admin"
                />
              </div>

              {forgotError ? (
                <div className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {forgotError}
                </div>
              ) : null}

              {forgotMsg ? (
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  {forgotMsg}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/40 py-2 font-medium text-slate-100 hover:bg-slate-900"
                >
                  Volver
                </button>

                <button
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-slate-200 text-slate-900 py-2 font-medium hover:bg-white disabled:opacity-60"
                >
                  {forgotLoading ? "Enviando..." : "Enviar código"}
                </button>
              </div>
            </form>
          </>
        ) : null}

        {view === "FORGOT_CONFIRM" ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
              <p className="text-sm text-slate-300 mt-1">
                Ingresa el código recibido y define una nueva contraseña.
              </p>
            </div>

            <form onSubmit={confirmPasswordReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-200">Email o Teléfono</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-200">Código</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-200">Nueva contraseña</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-200">Confirmar contraseña</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {forgotError ? (
                <div className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {forgotError}
                </div>
              ) : null}

              {forgotMsg ? (
                <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  {forgotMsg}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setForgotMsg(null);
                    setView("FORGOT_REQUEST");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/40 py-2 font-medium text-slate-100 hover:bg-slate-900"
                >
                  Volver
                </button>

                <button
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-slate-200 text-slate-900 py-2 font-medium hover:bg-white disabled:opacity-60"
                >
                  {forgotLoading ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="text-sm text-slate-300">Cargando acceso...</div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}