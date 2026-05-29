//app\(cc)\legal\components\LegalDriversTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../../components/CtccCityContext";
import DriverLegalAuditModal from "../../drivers/components/DriverLegalAuditModal";

type DriverListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  profile: {
    level: "BRONCE" | "PLATA" | "ORO" | "PLATINO";
    rating: number;
    isActive: boolean;
    documentId: string | null;
    updatedAt: string;
  } | null;
  vehicle: {
    plate: string | null;
    brand?: string | null;
    color?: string | null;
    model?: string | null;
    isActive: boolean;
    soatExpiresAt: string | null;
    tecnicomecanicaExpiresAt: string | null;
    updatedAt: string;
  } | null;
  docs: {
    hasVehicle: boolean;
    docsOk: boolean | null;
    vehicleActive: boolean | null;
    reason: string;
  };
};

type DriverListResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  items: DriverListItem[];
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function levelLabel(lvl?: string | null) {
  const v = String(lvl ?? "").toUpperCase();

  if (v === "PLATINO") return "Platino";
  if (v === "ORO") return "Oro";
  if (v === "PLATA") return "Plata";

  return "Bronce";
}

function docsBadge(docs: any) {
  if (!docs) return { label: "—", tone: "muted" as const };
  if (docs.hasVehicle === false) return { label: "Sin vehículo", tone: "warn" as const };
  if (docs.vehicleActive === false) return { label: "Vehículo inactivo", tone: "warn" as const };
  if (docs.docsOk === true) return { label: "Docs OK", tone: "ok" as const };

  return { label: "Docs pendientes/vencidos", tone: "warn" as const };
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "blue";
  hint?: string;
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "amber"
        ? "from-amber-100 to-white"
        : tone === "blue"
          ? "from-blue-100 to-white"
          : "from-slate-100 to-white";

  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-blue-700"
          : "text-slate-900";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${glow}`} />

      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>

        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>
          {value}
        </div>

        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function LegalDriversTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedQ = useDebouncedValue(q, 350);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DriverListResponse | null>(null);

  const [legalDriver, setLegalDriver] = useState<DriverListItem | null>(null);

  const lastReqKeyRef = useRef<string>("");

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  const loadDrivers = useCallback(
    async (opts?: { force?: boolean }) => {
      const reqKey = JSON.stringify({
        q: debouncedQ.trim(),
        status,
        page,
        limit,
        citySlug: effectiveCitySlug,
      });

      if (!opts?.force && lastReqKeyRef.current === reqKey) return;
      lastReqKeyRef.current = reqKey;

      setLoading(true);
      setError(null);

      try {
        const qs = new URLSearchParams();

        if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);
        if (debouncedQ.trim()) qs.set("q", debouncedQ.trim());

        qs.set("status", status);
        qs.set("page", String(page));
        qs.set("limit", String(limit));

        const res = await apiFetch<DriverListResponse>(
          `/drivers/admin/list?${qs.toString()}`
        );

        setData(res);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar la auditoría legal de conductores.");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, status, page, limit, effectiveCitySlug]
  );

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const summary = useMemo(() => {
    const items = data?.items ?? [];

    const active = items.filter((d) => d.profile?.isActive).length;
    const inactive = items.filter((d) => !d.profile?.isActive).length;
    const docsOkCount = items.filter((d) => d.docs?.docsOk === true).length;
    const issuesCount = items.filter((d) => d.docs?.docsOk !== true).length;

    return {
      total: data?.total ?? 0,
      active,
      inactive,
      docsOkCount,
      issuesCount,
    };
  }, [data]);

  const totalLabel = useMemo(() => {
    if (loading) return "Cargando...";

    if (isGlobalCityLocked) {
      return `${data?.total ?? 0} total · ${cityLabel}`;
    }

    return `${data?.total ?? 0} total · Todas las ciudades`;
  }, [loading, data?.total, isGlobalCityLocked, cityLabel]);

  function resetFilters() {
    setQ("");
    setStatus("ALL");
    setPage(1);
    setLimit(10);
  }

  return (
    <>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
            <SectionHeader
              title="Auditoría legal de conductores"
              subtitle="Consulta el estado legal, versiones aceptadas, fuentes, métodos e historial de aceptación."
            />

            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {isGlobalCityLocked
                    ? `Ciudad activa: ${cityLabel}`
                    : "Vista global: todas las ciudades"}
                </div>

                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                  Centro legal unificado
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                  label="Total"
                  value={String(summary.total)}
                  tone="slate"
                  hint={isGlobalCityLocked ? `Filtrado por ${cityLabel}` : "Conductores encontrados"}
                />

                <MetricCard
                  label="Activos"
                  value={String(summary.active)}
                  tone="emerald"
                  hint="Conductores operativos"
                />

                <MetricCard
                  label="Inactivos"
                  value={String(summary.inactive)}
                  tone="amber"
                  hint="Fuera de operación"
                />

                <MetricCard
                  label="Docs OK"
                  value={String(summary.docsOkCount)}
                  tone="blue"
                  hint={`${summary.issuesCount} con novedad`}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-4">
            <SectionHeader
              title="Estado del módulo"
              subtitle="Esta vista usa el flujo legal ya existente de conductores."
            />

            <div className="space-y-3 p-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Ciudad</span>
                  <span className="font-semibold text-slate-900">
                    {isGlobalCityLocked ? cityLabel : "Todas"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Estado</span>
                  <span className="font-semibold text-slate-900">
                    {status === "ALL" ? "Todos" : status === "ACTIVE" ? "Activos" : "Inactivos"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Búsqueda</span>
                  <span className="max-w-[220px] truncate text-right font-semibold text-slate-900">
                    {q.trim() || "Sin filtro"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Filtros legales"
            subtitle="Busca el conductor y abre su auditoría legal completa."
          />

          <div className="p-4">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <label className="text-xs font-medium text-slate-600">Buscar</label>

                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Nombre, teléfono, email, id..."
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                />
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-slate-600">Ciudad</label>

                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  value={isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                  disabled
                />
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Estado</label>

                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value as any);
                  }}
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Por página</label>

                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              <div className="flex items-end justify-end gap-2 lg:col-span-12">
                <button
                  onClick={() => loadDrivers({ force: true })}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Conductores para auditoría legal"
            subtitle="Abre la auditoría legal individual para revisar versiones, IP, User Agent y registros manuales."
            right={<span className="text-xs text-slate-500">{totalLabel}</span>}
          />

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Auditoría</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {(data?.items ?? []).map((d) => {
                  const badge = docsBadge(d.docs);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{d.name}</div>

                        <div className="mt-1 text-xs text-slate-500">
                          {d.phone}
                          {d.email ? ` · ${d.email}` : ""}
                          {" · "}
                          {d.id}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {levelLabel(d.profile?.level)}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-900">
                        {d.profile?.rating?.toFixed?.(1) ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        {badge.tone === "ok" ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                            {badge.label}
                          </span>
                        ) : badge.tone === "warn" ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{badge.label}</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {d.profile?.isActive ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setLegalDriver(d)}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Ver auditoría legal
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && (data?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                      No hay conductores para los filtros actuales.
                    </td>
                  </tr>
                ) : null}

                {loading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                      Cargando conductores...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">
              Página {data?.page ?? page} · {data?.limit ?? limit} por página
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={page <= 1}
              >
                Anterior
              </button>

              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={(data?.items?.length ?? 0) < (data?.limit ?? limit)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {legalDriver ? (
        <DriverLegalAuditModal
          driverId={legalDriver.id}
          driverName={legalDriver.name}
          onClose={() => setLegalDriver(null)}
        />
      ) : null}
    </>
  );
}