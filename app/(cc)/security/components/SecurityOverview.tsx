//app\(cc)\security\components\SecurityOverview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SecurityHeader from "./SecurityHeader";
import SecurityKpiCard from "./SecurityKpiCard";
import SecurityUsersTab from "./SecurityUsersTab";
import SecuritySessionsTab from "./SecuritySessionsTab";
import SecurityAuditTab from "./SecurityAuditTab";
import { getSecurityOverview, type SecurityOverviewResponse } from "../lib/securityApi";
import { formatDateTime } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

export default function SecurityOverview() {
  const { isGlobal, citySlug, cityLabel } = useCtccCity();

  const [tab, setTab] = useState<"OVERVIEW" | "USERS" | "SESSIONS" | "AUDIT">("OVERVIEW");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<SecurityOverviewResponse | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    if (!isGlobal && (tab === "SESSIONS" || tab === "AUDIT")) {
      setTab("OVERVIEW");
    }
  }, [isGlobal, tab]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSecurityOverview({
        citySlug: isGlobal ? "" : citySlug,
      });
      setOverview(data);
      setUpdatedAt(new Date().toISOString());
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar seguridad");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobal, citySlug]);

  const roleCards = useMemo(() => {
    return overview?.roleBreakdown ?? [];
  }, [overview]);

  return (
    <div className="space-y-4">
      <SecurityHeader activeTab={tab} onTabChange={setTab} />

      {tab === "OVERVIEW" ? (
        <>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Panel de seguridad</div>
                <div className="mt-1 text-sm text-slate-500">
                  Estado actual del acceso, sesiones y eventos sensibles.
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                    {isGlobal ? "Vista global" : `Filtrado por ${cityLabel}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                  {updatedAt ? `Actualizado: ${formatDateTime(updatedAt)}` : "—"}
                </div>
                <button
                  onClick={load}
                  className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {loading ? "Actualizando..." : "Refrescar panel"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SecurityKpiCard
              label="Usuarios en vista"
              value={overview?.kpis.totalUsers ?? 0}
              hint={`${overview?.kpis.activeUsers ?? 0} activos`}
              tone="blue"
            />
            <SecurityKpiCard
              label="Usuarios CTCC"
              value={overview?.kpis.ctccUsers ?? 0}
              hint={isGlobal ? "ADMIN + FINANCE" : "Locales/globales visibles en esta vista"}
              tone="green"
            />
            <SecurityKpiCard
              label="Sesiones activas"
              value={overview?.kpis.activeSessions ?? 0}
              hint={`${overview?.kpis.revokedSessions ?? 0} revocadas`}
              tone="amber"
            />
            <SecurityKpiCard
              label="Eventos 24h"
              value={overview?.kpis.audits24h ?? 0}
              hint={`${overview?.kpis.passwordResetOpen ?? 0} resets abiertos`}
              tone="rose"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">Auditoría reciente</div>
                <div className="mt-1 text-xs text-slate-500">
                  Últimos eventos sensibles registrados.
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {(overview?.recentAudits ?? []).length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-500">
                    No hay eventos recientes para mostrar.
                  </div>
                ) : (
                  (overview?.recentAudits ?? []).map((item) => (
                    <div key={item.id} className="px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                              {item.action}
                            </span>
                            <span className="text-xs text-slate-500">{item.entityType}</span>
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            Actor: <span className="font-medium text-slate-900">{item.actorName || "—"}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            entityId: {item.entityId}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-900">Distribución por rol</div>
                <div className="mt-1 text-xs text-slate-500">
                  Usuarios registrados por tipo.
                </div>
              </div>

              <div className="space-y-3 px-4 py-4">
                {roleCards.length === 0 ? (
                  <div className="text-sm text-slate-500">Sin datos.</div>
                ) : (
                  roleCards.map((r) => (
                    <div key={r.role} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-900">{r.role}</div>
                        <div className="text-lg font-semibold text-slate-900">{r.count}</div>
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Nota: en vista por ciudad, este bloque refleja usuarios vinculados operativamente a la ciudad seleccionada.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {tab === "USERS" ? <SecurityUsersTab /> : null}
      {tab === "SESSIONS" && isGlobal ? <SecuritySessionsTab /> : null}
      {tab === "AUDIT" && isGlobal ? <SecurityAuditTab /> : null}
    </div>
  );
}