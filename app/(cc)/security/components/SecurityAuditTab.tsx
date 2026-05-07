//app\(cc)\security\components\SecurityAuditTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { listSecurityAudit, type SecurityAuditRow } from "../lib/securityApi";
import { formatDateTime, toISODate } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

export default function SecurityAuditTab() {
  const { isGlobal } = useCtccCity();

  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState<string>(() => toISODate(new Date(Date.now() - 86400000 * 7)));
  const [to, setTo] = useState<string>(() => toISODate(new Date()));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; items: SecurityAuditRow[] } | null>(null);

  async function load() {
    if (!isGlobal) return;

    setLoading(true);
    setError(null);
    try {
      const res = await listSecurityAudit({
        q,
        action,
        entityType,
        from,
        to,
        page,
        limit,
      });
      setData({ total: res.total, items: res.items });
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar auditoría");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, action, entityType, from, to, page, limit, isGlobal]);

  const canNext = useMemo(() => {
    const items = data?.items?.length ?? 0;
    return items >= limit;
  }, [data, limit]);

  if (!isGlobal) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        La pestaña <b>Auditoría</b> solo está disponible en <b>Vista Global</b>.
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
          <div className="text-lg font-semibold text-slate-900">Auditoría</div>
          <div className="mt-1 text-xs text-slate-500">
            Registro de cambios sensibles, acciones administrativas y trazabilidad.
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <label className="text-xs text-slate-500">Buscar</label>
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="actor, action, entityId..."
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Acción</label>
              <input
                value={action}
                onChange={(e) => {
                  setPage(1);
                  setAction(e.target.value);
                }}
                placeholder="Ej: ORDER_..."
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Entidad</label>
              <input
                value={entityType}
                onChange={(e) => {
                  setPage(1);
                  setEntityType(e.target.value);
                }}
                placeholder="Order, User..."
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setPage(1);
                  setFrom(e.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setPage(1);
                  setTo(e.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-sm font-medium text-slate-900">Eventos de auditoría</div>
          <div className="text-xs text-slate-500">
            {loading ? "Cargando..." : `${data?.total ?? 0} total`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad</th>
                <th className="px-4 py-3">ID entidad</th>
                <th className="px-4 py-3">Meta</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id} className="border-b border-slate-100 align-top last:border-b-0">
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.actorName || "—"}</div>
                    <div className="text-xs text-slate-500">
                      {row.actorPhone || "—"} · {row.actorId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.entityId}</td>
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer text-xs text-slate-600">
                        Ver meta
                      </summary>
                      <pre className="mt-2 max-w-[380px] overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] text-slate-100">
{JSON.stringify(row.meta ?? {}, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}

              {!loading && (data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay eventos para los filtros actuales.
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