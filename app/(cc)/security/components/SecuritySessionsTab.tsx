//app\(cc)\security\components\SecuritySessionsTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listSecuritySessions,
  revokeAllUserSessions,
  revokeSecuritySession,
  type SecuritySessionRow,
} from "../lib/securityApi";
import { formatDateTime } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

type SessionStatus = "ALL" | "ACTIVE" | "REVOKED" | "EXPIRED";

function statusPill(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "REVOKED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function SecuritySessionsTab() {
  const { isGlobal } = useCtccCity();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SessionStatus>("ACTIVE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; items: SecuritySessionRow[] } | null>(null);

  async function load() {
    if (!isGlobal) return;

    setLoading(true);
    setError(null);
    try {
      const res = await listSecuritySessions({
        q,
        status,
        page,
        limit,
      });
      setData({ total: res.total, items: res.items });
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar sesiones");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page, limit, isGlobal]);

  async function revokeOne(sessionId: string) {
    if (!confirm("¿Revocar esta sesión?")) return;
    try {
      await revokeSecuritySession(sessionId);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo revocar la sesión");
    }
  }

  async function revokeUser(userId: string, userName: string) {
    if (!confirm(`¿Revocar TODAS las sesiones activas de ${userName}?`)) return;
    try {
      await revokeAllUserSessions(userId);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo revocar sesiones del usuario");
    }
  }

  const canNext = useMemo(() => {
    const items = data?.items?.length ?? 0;
    return items >= limit;
  }, [data, limit]);

  if (!isGlobal) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        La pestaña <b>Sesiones</b> solo está disponible en <b>Vista Global</b>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-lg font-semibold text-slate-900">Sesiones</div>
          <div className="mt-1 text-xs text-slate-500">
            Ver, monitorear y revocar sesiones activas o históricas.
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <label className="text-xs text-slate-500">Buscar</label>
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Usuario, phone, email, role, session id..."
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Estado</label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as SessionStatus);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ACTIVE">Activas</option>
                <option value="REVOKED">Revocadas</option>
                <option value="EXPIRED">Expiradas</option>
                <option value="ALL">Todas</option>
              </select>
            </div>

            <div className="xl:col-span-1">
              <label className="text-xs text-slate-500">Por página</label>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>

            <div className="xl:col-span-2 flex items-end justify-end">
              <button
                onClick={load}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                {loading ? "Cargando..." : "Refrescar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-sm font-medium text-slate-900">Listado de sesiones</div>
          <div className="text-xs text-slate-500">
            {loading ? "Cargando..." : `${data?.total ?? 0} total`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Creada</th>
                <th className="px-4 py-3">Último uso</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{s.userName}</div>
                    <div className="text-xs text-slate-500">
                      {s.userPhone}
                      {s.userEmail ? ` · ${s.userEmail}` : ""}
                      {` · ${s.id}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">{s.userRole}</td>
                  <td className="px-4 py-3">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3">{s.lastUsedAt ? formatDateTime(s.lastUsedAt) : "—"}</td>
                  <td className="px-4 py-3">{formatDateTime(s.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                        statusPill(s.status),
                      ].join(" ")}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {s.status === "ACTIVE" ? (
                        <>
                          <button
                            onClick={() => revokeOne(s.id)}
                            className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            Revocar sesión
                          </button>
                          <button
                            onClick={() => revokeUser(s.userId, s.userName)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Revocar todas
                          </button>
                        </>
                      ) : (
                        <span className="px-3 py-2 text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && (data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay sesiones para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">
            Página {page} · {limit} por página
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}