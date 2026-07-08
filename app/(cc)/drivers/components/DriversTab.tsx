//app\(cc)\drivers\components\DriversTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../../components/CtccCityContext";
import DriverLegalAuditModal from "./DriverLegalAuditModal";
import DriverAcademyAuditModal from "./DriverAcademyAuditModal";

type DriverListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  workerTypes?: string[];
  serviceTypes?: string[];
  authorizations?: Array<{ workerType?: string | null }>;
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
    soatNumber?: string | null;
    soatExpiresAt: string | null;
    tecnicomecanicaNumber?: string | null;
    tecnicomecanicaExpiresAt: string | null;
    updatedAt: string;
  } | null;
  docs: {
    hasVehicle: boolean;
    soatMissing: boolean;
    soatExpired: boolean;
    tecnomecMissing: boolean;
    tecnomecExpired: boolean;
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
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function levelLabel(level?: string | null) {
  const value = String(level ?? "").toUpperCase();

  if (value === "PLATINO") return "Platino";
  if (value === "ORO") return "Oro";
  if (value === "PLATA") return "Plata";

  return "Bronce";
}

function docsBadge(docs: DriverListItem["docs"] | null | undefined) {
  if (!docs) return { label: "—", tone: "muted" as const };
  if (docs.hasVehicle === false) return { label: "Sin vehículo", tone: "warn" as const };
  if (docs.vehicleActive === false) return { label: "Vehículo inactivo", tone: "warn" as const };
  if (docs.docsOk === true) return { label: "Docs OK", tone: "ok" as const };

  return { label: "Docs pendientes/vencidos", tone: "warn" as const };
}

function workerTypeBadges(input: any) {
  const raw = [
    ...(Array.isArray(input?.workerTypes) ? input.workerTypes : []),
    ...(Array.isArray(input?.serviceTypes) ? input.serviceTypes : []),
    ...(Array.isArray(input?.authorizations)
      ? input.authorizations.map((item: any) => item?.workerType)
      : []),
  ]
    .map((value) => String(value ?? "").trim().toUpperCase())
    .filter(Boolean);

  const unique = Array.from(new Set(raw));
  const values = unique.length ? unique : ["MOTORCYCLE"];

  const config: Record<string, { label: string; tone: string }> = {
    MOTORCYCLE: {
      label: "Domiciliario",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    TAXI: {
      label: "Taxista",
      tone: "bg-amber-50 text-amber-800 border-amber-200",
    },
    MOTORCARGO: {
      label: "Motocarguero",
      tone: "bg-violet-50 text-violet-700 border-violet-200",
    },
  };

  return values.map((value) => ({
    key: value,
    ...(config[value] ?? {
      label: value,
      tone: "bg-slate-50 text-slate-700 border-slate-200",
    }),
  }));
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
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
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
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function DriversTab() {
  const router = useRouter();
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [driversQ, setDriversQ] = useState("");
  const [driversStatus, setDriversStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [driversPage, setDriversPage] = useState(1);
  const [driversLimit, setDriversLimit] = useState(10);

  const debouncedQ = useDebouncedValue(driversQ, 350);

  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [driversData, setDriversData] = useState<DriverListResponse | null>(null);
  const [legalDriver, setLegalDriver] = useState<DriverListItem | null>(null);
  const [academyDriver, setAcademyDriver] = useState<DriverListItem | null>(null);

  const lastReqKeyRef = useRef<string>("");

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  const loadDrivers = useCallback(
    async (opts?: { force?: boolean }) => {
      const reqKey = JSON.stringify({
        q: debouncedQ.trim(),
        status: driversStatus,
        page: driversPage,
        limit: driversLimit,
        citySlug: effectiveCitySlug,
      });

      if (!opts?.force && lastReqKeyRef.current === reqKey) return;
      lastReqKeyRef.current = reqKey;

      setDriversLoading(true);
      setDriversError(null);

      try {
        const qs = new URLSearchParams();

        if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);
        if (debouncedQ.trim()) qs.set("q", debouncedQ.trim());

        qs.set("status", driversStatus);
        qs.set("page", String(driversPage));
        qs.set("limit", String(driversLimit));

        const data = await apiFetch<DriverListResponse>(`/drivers/admin/list?${qs.toString()}`);
        setDriversData(data);
      } catch (error: any) {
        setDriversError(error?.message || "Error cargando workers");
        setDriversData(null);
      } finally {
        setDriversLoading(false);
      }
    },
    [debouncedQ, driversStatus, driversPage, driversLimit, effectiveCitySlug]
  );

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const summary = useMemo(() => {
    const items = driversData?.items ?? [];
    const active = items.filter((item) => item.profile?.isActive).length;
    const inactive = items.filter((item) => !item.profile?.isActive).length;
    const docsOkCount = items.filter((item) => item.docs?.docsOk === true).length;
    const issuesCount = items.filter((item) => item.docs?.docsOk !== true).length;

    return {
      total: driversData?.total ?? 0,
      active,
      inactive,
      docsOkCount,
      issuesCount,
    };
  }, [driversData]);

  const totalLabel = useMemo(() => {
    if (driversLoading) return "Cargando...";
    if (isGlobalCityLocked) return `${driversData?.total ?? 0} total · ${cityLabel}`;
    return `${driversData?.total ?? 0} total · Todas las ciudades`;
  }, [driversLoading, driversData?.total, isGlobalCityLocked, cityLabel]);

  function resetFilters() {
    setDriversQ("");
    setDriversStatus("ALL");
    setDriversPage(1);
    setDriversLimit(10);
    lastReqKeyRef.current = "";
  }

  function openWorkerProfile(workerId: string) {
    router.push(`/drivers/${encodeURIComponent(workerId)}`);
  }

  return (
    <>
      <div className="space-y-4">
        {driversError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {driversError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
            <SectionHeader
              title="Trabajadores"
              subtitle="Consulta rápida del estado operativo, documentos, tipos autorizados y actividad del equipo worker."
            />
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
                </div>
                <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {driversLoading ? "Actualizando datos..." : `${driversData?.items?.length ?? 0} workers en vista`}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                  label="Total"
                  value={String(summary.total)}
                  tone="slate"
                  hint={isGlobalCityLocked ? `Total filtrado por ${cityLabel}` : "Registros en la vista"}
                />
                <MetricCard label="Activos" value={String(summary.active)} tone="emerald" hint="Disponibles para operar" />
                <MetricCard label="Inactivos" value={String(summary.inactive)} tone="amber" hint="Bloqueados o fuera de operación" />
                <MetricCard label="Docs OK" value={String(summary.docsOkCount)} tone="blue" hint={`${summary.issuesCount} con novedad`} />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-4">
            <SectionHeader title="Resumen de filtros" subtitle="Estado actual de la búsqueda" />
            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Ciudad</span>
                  <span className="font-semibold text-slate-900">
                    {isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estado</span>
                  <span className="font-semibold text-slate-900">
                    {driversStatus === "ALL" ? "Todos" : driversStatus === "ACTIVE" ? "Activos" : "Inactivos"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Búsqueda</span>
                  <span className="max-w-[220px] truncate text-right font-semibold text-slate-900">
                    {driversQ.trim() || "Sin filtro"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Paginación</span>
                  <span className="font-semibold text-slate-900">
                    Página {driversData?.page ?? driversPage} · {driversData?.limit ?? driversLimit}/pág
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Filtros"
            subtitle="Los filtros se aplican automáticamente. El buscador usa un pequeño delay para evitar recargas agresivas."
          />
          <div className="p-4">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <label className="text-xs font-medium text-slate-600">Buscar</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Nombre, teléfono, email, id..."
                  value={driversQ}
                  onChange={(event) => {
                    setDriversPage(1);
                    setDriversQ(event.target.value);
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
                <div className="mt-1 text-[11px] text-slate-500">
                  {isGlobalCityLocked
                    ? "La ciudad está siendo controlada desde el selector global del CTCC."
                    : "Vista global gobernada por el selector superior del CTCC."}
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Estado</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={driversStatus}
                  onChange={(event) => {
                    setDriversPage(1);
                    setDriversStatus(event.target.value as "ALL" | "ACTIVE" | "INACTIVE");
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
                  value={driversLimit}
                  onChange={(event) => {
                    setDriversPage(1);
                    setDriversLimit(Number(event.target.value));
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
                  {driversLoading ? "Cargando..." : "Refrescar"}
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
            title="Listado de workers"
            subtitle="Vista consolidada del estado operativo del equipo worker"
            right={<span className="text-xs text-slate-500">{totalLabel}</span>}
          />

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Tipos</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(driversData?.items ?? []).map((driver) => {
                  const badge = docsBadge(driver.docs);

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{driver.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {driver.phone}
                          {driver.email ? ` · ${driver.email}` : ""}
                          {" · "}
                          {driver.id}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {workerTypeBadges(driver).map((item) => (
                            <span
                              key={item.key}
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                item.tone,
                              ].join(" ")}
                            >
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{levelLabel(driver.profile?.level)}</td>

                      <td className="px-4 py-4 font-medium text-slate-900">
                        {driver.profile?.rating?.toFixed?.(1) ?? "—"}
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
                        {driver.profile?.isActive ? (
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setLegalDriver(driver)}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Legal
                          </button>

                          <button
                            onClick={() => setAcademyDriver(driver)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            Capacitaciones
                          </button>

                          <button
                            onClick={() => openWorkerProfile(driver.id)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Ver perfil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!driversLoading && (driversData?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                      No hay workers para los filtros actuales.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">
              Página {driversData?.page ?? driversPage} · {driversData?.limit ?? driversLimit} por página
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDriversPage((page) => Math.max(1, page - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={driversPage <= 1}
              >
                Anterior
              </button>
              <button
                onClick={() => setDriversPage((page) => page + 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={(driversData?.items?.length ?? 0) < (driversData?.limit ?? driversLimit)}
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

      {academyDriver ? (
        <DriverAcademyAuditModal
          driverId={academyDriver.id}
          driverName={academyDriver.name}
          onClose={() => setAcademyDriver(null)}
        />
      ) : null}
    </>
  );
}
