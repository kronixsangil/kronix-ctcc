// app/(cc)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CtccCityProvider, useCtccCity } from "./components/CtccCityContext";

const NAV = [
  { href: "/dashboard", label: "Panel General" },
  { href: "/orders", label: "Órdenes" },
  { href: "/drivers", label: "Conductores" },
  { href: "/legal", label: "Legal" },
  { href: "/stores", label: "Tiendas" },
  { href: "/cities", label: "Ciudades" },
  { href: "/buyer", label: "Cliente (Buyer)" },
  { href: "/quality", label: "Calidad" },
  { href: "/finance", label: "Finanzas" },
  { href: "/security", label: "Seguridad" },
];

const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:3004";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function getCtccWrongRoleMessage(role?: string | null) {
  const r = String(role ?? "").toUpperCase();

  if (r === "BUYER") {
    return "Tu cuenta es de cliente. Debes ingresar desde la app Buyer.";
  }
  if (r === "DRIVER") {
    return "Tu cuenta es de conductor. Debes ingresar desde la app Driver.";
  }
  if (r === "STORE") {
    return "Tu cuenta pertenece a una tienda. Debes ingresar desde la app Store.";
  }
  return "Tu cuenta no tiene permisos para ingresar al CTCC. Usa la aplicación correspondiente a tu perfil.";
}

function PowerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v8" />
      <path d="M7.05 4.93A9 9 0 1 0 16.95 4.93" />
    </svg>
  );
}

function SessionExpiredModal(props: {
  open: boolean;
  message: string;
  accepting: boolean;
  onAccept: () => void;
}) {
  const { open, message, accepting, onAccept } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-900">Sesión vencida</div>
          <div className="mt-3 text-sm leading-6 text-slate-600">{message}</div>
        </div>

        <div className="mt-6">
          <button
            onClick={onAccept}
            disabled={accepting}
            className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            {accepting ? "Redirigiendo..." : "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CtccCitySelector() {
  const {
    mode,
    cities,
    citiesLoading,
    citySlug,
    cityLabel,
    citiesError,
    setGlobalMode,
    setCityBySlug,
    canUseGlobal,
    isLockedToCity,
  } = useCtccCity();

  const selectorDisabled = citiesLoading || isLockedToCity;
  const badgeText = mode === "GLOBAL" ? cityLabel : cityLabel;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="hidden sm:block text-xs text-slate-500">Operación / Admin</div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className={[
            "inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold",
            mode === "GLOBAL"
              ? "bg-slate-900 text-white"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          <span className="mr-2">📍</span>
          <span>{badgeText}</span>
        </div>

        <select
          value={mode === "GLOBAL" ? "__GLOBAL__" : citySlug}
          onChange={(e) => {
            const value = String(e.target.value || "");
            if (value === "__GLOBAL__") {
              setGlobalMode();
              return;
            }
            setCityBySlug(value);
          }}
          disabled={selectorDisabled}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {canUseGlobal ? <option value="__GLOBAL__">Vista Global</option> : null}
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}, {city.department}
            </option>
          ))}
        </select>
      </div>

      {isLockedToCity ? (
        <div className="text-[11px] text-slate-500">
          Tu cuenta está restringida a una ciudad específica.
        </div>
      ) : citiesError ? (
        <div className="text-[11px] text-rose-600">{citiesError}</div>
      ) : citiesLoading ? (
        <div className="text-[11px] text-slate-500">Cargando ciudades...</div>
      ) : null}
    </div>
  );
}

function ControlCenterContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(
    "Tu sesión ha vencido por tiempo de inactividad. Debes iniciar sesión nuevamente."
  );
  const [acceptingSessionExpired, setAcceptingSessionExpired] = useState(false);

  const [actorRole, setActorRole] = useState<string>("");
  const [actorCityId, setActorCityId] = useState<string>("");
  const [storesPaymentPendingCount, setStoresPaymentPendingCount] = useState(0);
  const [kronixPlusPendingCount, setKronixPlusPendingCount] = useState(0);

  const sessionExpiredHandledRef = useRef(false);

  const activeLabel = useMemo(() => {
    const found = NAV.find((n) => isActive(pathname, n.href));
    return found?.label ?? "Control Center";
  }, [pathname]);

  const canUseGlobal =
    actorRole === "SUPERADMIN" ||
    ((actorRole === "ADMIN" || actorRole === "FINANCE") && !actorCityId);

  async function logout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  async function acceptExpiredSession() {
    try {
      setAcceptingSessionExpired(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
    } finally {
      router.replace("/login");
      setAcceptingSessionExpired(false);
    }
  }

  async function forceLogoutWithMessage(message: string) {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    setAccessAllowed(false);
    setAccessDeniedMessage(message);
    setAuthChecked(true);
    router.replace("/login?denied=1");
  }

  useEffect(() => {
    function onSessionExpired(event: Event) {
      if (sessionExpiredHandledRef.current) return;
      sessionExpiredHandledRef.current = true;

      const custom = event as CustomEvent<{ message?: string }>;
      const nextMessage =
        String(custom?.detail?.message ?? "").trim() ||
        "Tu sesión ha vencido por tiempo de inactividad. Debes iniciar sesión nuevamente.";

      setSessionExpiredMessage(nextMessage);
      setSessionExpiredOpen(true);
      setAccessAllowed(false);
      setAuthChecked(true);
    }

    window.addEventListener("ctcc:session-expired", onSessionExpired as EventListener);

    return () => {
      window.removeEventListener("ctcc:session-expired", onSessionExpired as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifyCtccAccess() {
      try {
        const res = await fetch("/api/ctcc/auth/me", {
  method: "GET",
  credentials: "include",
  cache: "no-store",
});

        if (!res.ok) {
          if (!cancelled) {
            const data = await res.json().catch(() => ({}));
            const msg =
              data?.message ||
              "Tu sesión ha vencido por tiempo de inactividad. Debes iniciar sesión nuevamente.";

            setSessionExpiredMessage(msg);
            setSessionExpiredOpen(true);
            setAccessAllowed(false);
            setAuthChecked(true);
          }
          return;
        }

        const data = await res.json().catch(() => ({}));
        const role = String(data?.user?.role ?? "").toUpperCase();
        const cityId = String(data?.user?.cityId ?? "").trim();

        if (!["ADMIN", "FINANCE", "SUPERADMIN"].includes(role)) {
          const msg = getCtccWrongRoleMessage(role);
          if (!cancelled) {
            await forceLogoutWithMessage(msg);
          }
          return;
        }

        if (!cancelled) {
          setActorRole(role);
          setActorCityId(cityId);
          setAccessAllowed(true);
          setAccessDeniedMessage(null);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setSessionExpiredMessage(
            "No fue posible validar tu sesión. Debes iniciar sesión nuevamente."
          );
          setSessionExpiredOpen(true);
          setAccessAllowed(false);
          setAuthChecked(true);
        }
      }
    }

    verifyCtccAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
  function onStoresPendingCount(event: Event) {
    const custom = event as CustomEvent<{ count?: number }>;
    setStoresPaymentPendingCount(Number(custom?.detail?.count ?? 0));
  }

  window.addEventListener("kronix:stores-payment-pending-count", onStoresPendingCount as EventListener);
  
  return () => {
    window.removeEventListener("kronix:stores-payment-pending-count", onStoresPendingCount as EventListener);
  };
}, []);


  useEffect(() => {
  if (!accessAllowed) return;

  let cancelled = false;

  async function loadPendingCounters() {
    try {
      const storesRes = await fetch("/api/ctcc/admin/stores/payment-info/pending-count", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (storesRes.ok) {
        const storesData = await storesRes.json().catch(() => ({}));
        if (!cancelled) {
          setStoresPaymentPendingCount(Number(storesData?.count ?? 0));
        }
      } else if (!cancelled) {
        setStoresPaymentPendingCount(0);
      }
    } catch {
      if (!cancelled) setStoresPaymentPendingCount(0);
    }

    try {
      const plusRes = await fetch(
        "/api/ctcc/users/admin/kronix-plus/applications?status=PENDING",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (plusRes.ok) {
        const plusData = await plusRes.json().catch(() => ({}));
        const count = Number(
          plusData?.summary?.pending ?? plusData?.items?.length ?? 0
        );

        if (!cancelled) {
          setKronixPlusPendingCount(count);
        }
      } else if (!cancelled) {
        setKronixPlusPendingCount(0);
      }
    } catch {
      if (!cancelled) setKronixPlusPendingCount(0);
    }
  }

  loadPendingCounters();
  const id = window.setInterval(loadPendingCounters, 60000);

  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}, [accessAllowed]);

useEffect(() => {
  function onKronixPlusPendingCount(event: Event) {
    const custom = event as CustomEvent<{ count?: number }>;
    setKronixPlusPendingCount(Number(custom?.detail?.count ?? 0));
  }

  window.addEventListener(
    "kronix:plus-pending-count",
    onKronixPlusPendingCount as EventListener
  );

  return () => {
    window.removeEventListener(
      "kronix:plus-pending-count",
      onKronixPlusPendingCount as EventListener
    );
  };
}, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Verificando acceso…</div>
          <div className="mt-2 text-sm text-slate-600">Estamos validando tu sesión y permisos.</div>
        </div>
      </div>
    );
  }

  if (!accessAllowed && !sessionExpiredOpen) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-2xl font-semibold text-slate-900">Acceso incorrecto</div>
          <div className="mt-3 text-sm leading-6 text-slate-600">
            {accessDeniedMessage ||
              "Tu cuenta no tiene permisos para ingresar al CTCC. Usa la aplicación correspondiente a tu perfil."}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Si eres cliente usa la app Buyer. Si eres conductor usa la app Driver. Si eres tienda usa la app Store.
          </div>

          <div className="mt-6">
            <button
              onClick={logout}
              disabled={loggingOut}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loggingOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionExpiredModal
        open={sessionExpiredOpen}
        message={sessionExpiredMessage}
        accepting={acceptingSessionExpired}
        onAccept={acceptExpiredSession}
      />

      <CtccCityProvider
        canUseGlobal={canUseGlobal}
        lockedCityId={canUseGlobal ? null : actorCityId}
      >
        <div className="min-h-screen bg-slate-100 text-slate-900">
          <div className="flex">
            <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:bg-slate-950 md:text-slate-100">
              <div className="border-b border-slate-800 px-5 py-5">
                <div className="text-lg font-semibold">KroniX</div>
                <div className="mt-0.5 text-xs text-slate-300">Control Center</div>
              </div>

              <nav className="flex flex-col p-3">
                <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-400">
                  Módulos
                </div>

                <ul className="space-y-1">
                  {NAV.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={[
                            "block rounded-xl px-3 py-2 text-sm transition",
                            active
                              ? "bg-slate-800 text-white"
                              : "text-slate-200 hover:bg-slate-900 hover:text-white",
                          ].join(" ")}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span>{item.label}</span>
                            {item.href === "/stores" && storesPaymentPendingCount > 0 ? (
                              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
                                {storesPaymentPendingCount}
                              </span>
                            ) : null}
                            {item.href === "/buyer" && kronixPlusPendingCount > 0 ? (
  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
    {kronixPlusPendingCount}
  </span>
) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 border-t border-slate-800 pt-4">
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full rounded-xl bg-slate-200 py-2 text-sm font-medium text-slate-900 transition hover:bg-white disabled:opacity-60"
                  >
                    {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                  </button>
                </div>
              </nav>
            </aside>

            <div className="flex-1">
              <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
                <div className="mx-auto flex w-full flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm text-slate-500">KroniX Control Center</div>
                    <div className="text-lg font-semibold">{activeLabel}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CtccCitySelector />

                    <button
                      onClick={logout}
                      disabled={loggingOut}
                      title="Cerrar sesión"
                      aria-label="Cerrar sesión"
                      className="hidden h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-slate-950 text-rose-500 shadow-sm transition hover:scale-[1.02] hover:bg-slate-900 disabled:opacity-60 md:inline-flex"
                    >
                      <PowerIcon />
                    </button>

                    <button
                      onClick={logout}
                      disabled={loggingOut}
                      className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60 md:hidden"
                    >
                      {loggingOut ? "..." : "Salir"}
                    </button>
                  </div>
                </div>
              </header>

              <div className="mx-auto w-full">
                {children}
                <div className="h-10" />
              </div>
            </div>
          </div>
        </div>
      </CtccCityProvider>
    </>
  );
}

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ControlCenterContent>{children}</ControlCenterContent>;
}