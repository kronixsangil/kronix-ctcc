//app\(cc)\drivers\components\DriversTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCOP, toISODate } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";
import DriverLegalAuditModal from "./DriverLegalAuditModal";

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

type AdminDriverProfileResponse = {
  ok: true;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    nickname: string | null;
    role: string;
  };
  driverProfile: any;
  vehicle: any | null;
  payment: any | null;
  docs: any;
  inactiveInfo: { reason: string | null; lastChangeAt: string | null; lastIsActive: boolean | null };
  history: {
    ok: true;
    orders: any[];
    payouts: any[];
    bonuses: any[];
    sanctions: any[];
  };
};

type DriverDocumentCheck = {
  id?: string;
  driverId?: string;
  type: string;
  status: string;
  documentNumber?: string | null;
  expiresAt?: string | null;
  receivedAt?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  internalNotes?: string | null;
  waiverReason?: string | null;
  waiverExpiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const DRIVER_DOCUMENT_TYPES = [
  "ID_CARD",
  "DRIVER_LICENSE",
  "SELFIE_OR_PROFILE_PHOTO",
  "SOAT",
  "TECHNOMECHANICAL",
  "VEHICLE_OWNERSHIP_CARD",
  "VEHICLE_PHOTO_OR_INSPECTION",
  "BACKGROUND_CHECK",
] as const;

const DRIVER_DOCUMENT_LABELS: Record<string, string> = {
  ID_CARD: "Cédula",
  DRIVER_LICENSE: "Licencia de conducción",
  SELFIE_OR_PROFILE_PHOTO: "Selfie / Foto presencial",
  SOAT: "SOAT",
  TECHNOMECHANICAL: "Tecnomecánica",
  VEHICLE_OWNERSHIP_CARD: "Tarjeta de propiedad",
  VEHICLE_PHOTO_OR_INSPECTION: "Foto / Inspección vehículo",
  BACKGROUND_CHECK: "Antecedentes",
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

function isoToDateInput(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return toISODate(d);
}

function dateInputToIsoOrNull(v: string) {
  const x = String(v || "").trim();
  if (!x) return null;
  const d = new Date(`${x}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function labelPeriod(periodStartISO: string, periodEndISO: string) {
  const start = new Date(periodStartISO);
  const end = new Date(periodEndISO);

  const s = start.toLocaleDateString("es-CO", { month: "short", day: "2-digit" });
  const e = end.toLocaleDateString("es-CO", { month: "short", day: "2-digit" });
  return `Semana (${s} - ${e})`;
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
      <div className={`absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${glow} pointer-events-none`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function DriversTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [driversQ, setDriversQ] = useState("");
  const [driversStatus, setDriversStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [driversPage, setDriversPage] = useState(1);
  const [driversLimit, setDriversLimit] = useState(10);

  const debouncedQ = useDebouncedValue(driversQ, 350);

  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [driversData, setDriversData] = useState<DriverListResponse | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminDriverProfileResponse | null>(null);
const [legalDriver, setLegalDriver] = useState<DriverListItem | null>(null);

  const [eligibility, setEligibility] = useState<any | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [documentChecks, setDocumentChecks] = useState<DriverDocumentCheck[]>([]);
  const [documentChecksLoading, setDocumentChecksLoading] = useState(false);
  const [documentChecksMsg, setDocumentChecksMsg] = useState<string | null>(null);

  const [overrideSaving, setOverrideSaving] = useState(false);

  const [vehicleEditing, setVehicleEditing] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleSaveMsg, setVehicleSaveMsg] = useState<string | null>(null);

  const [vehicleForm, setVehicleForm] = useState<{
    plate: string;
    brand: string;
    color: string;
    model: string;
    isActive: boolean;
    soatNumber: string;
    soatExpiresAt: string;
    tecnicomecanicaNumber: string;
    tecnicomecanicaExpiresAt: string;
  }>({
    plate: "",
    brand: "",
    color: "",
    model: "",
    isActive: true,
    soatNumber: "",
    soatExpiresAt: "",
    tecnicomecanicaNumber: "",
    tecnicomecanicaExpiresAt: "",
  });

  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleIsActive, setToggleIsActive] = useState(true);
  const [toggleReason, setToggleReason] = useState("");
  const [toggleConfirm, setToggleConfirm] = useState(false);

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
      } catch (e: any) {
        setDriversError(e?.message || "Error cargando drivers");
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

  async function openProfile(driverId: string) {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setVehicleSaveMsg(null);
    setProfile(null);
    setEligibility(null);
    setEligibilityLoading(true);
    setVehicleEditing(false);

    try {
      const data = await apiFetch<AdminDriverProfileResponse>(`/drivers/admin/${driverId}`);
      setProfile(data);

      const v = data.vehicle || null;
      setVehicleForm({
        plate: String(v?.plate ?? ""),
        brand: String(v?.brand ?? ""),
        color: String(v?.color ?? ""),
        model: String(v?.model ?? ""),
        isActive: Boolean(v?.isActive ?? true),
        soatNumber: String(v?.soatNumber ?? ""),
        soatExpiresAt: isoToDateInput(v?.soatExpiresAt ?? null),
        tecnicomecanicaNumber: String(v?.tecnicomecanicaNumber ?? ""),
        tecnicomecanicaExpiresAt: isoToDateInput(v?.tecnicomecanicaExpiresAt ?? null),
      });

      const el = await apiFetch<any>(`/drivers/admin/${driverId}/eligibility`);
      setEligibility(el);

      const docsRes = await apiFetch<any>(`/drivers/admin/${driverId}/documents`);
      setDocumentChecks(Array.isArray(docsRes?.documents) ? docsRes.documents : []);

    } catch (e: any) {
      setProfileError(e?.message || "No se pudo cargar el perfil del driver");
      setProfile(null);
    } finally {
      setProfileLoading(false);
      setEligibilityLoading(false);
    }
  }

  function closeProfile() {
    if (profileLoading) return;
    setProfileOpen(false);
    setProfile(null);
    setProfileError(null);
    setToggleOpen(false);
    setToggleConfirm(false);
    setToggleReason("");
    setVehicleEditing(false);
    setVehicleSaving(false);
    setVehicleSaveMsg(null);
    setDocumentChecks([]);
    setDocumentChecksLoading(false);
    setDocumentChecksMsg(null);
  }

  function openToggle(activeNow: boolean) {
    setToggleIsActive(!activeNow);
    setToggleReason("");
    setToggleConfirm(false);
    setToggleOpen(true);
  }

  async function saveToggle() {
    if (!profile?.user?.id) return;

    setToggleSaving(true);
    setDriversError(null);
    setProfileError(null);

    try {
      await apiFetch(`/drivers/admin/${profile.user.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: toggleIsActive,
          reason: toggleReason.trim() || undefined,
        }),
      });

      await openProfile(profile.user.id);
      await loadDrivers({ force: true });
      setToggleOpen(false);
      setToggleConfirm(false);
      setToggleReason("");
    } catch (e: any) {
      setProfileError(e?.message || "No se pudo actualizar el estado del driver");
    } finally {
      setToggleSaving(false);
    }
  }

  async function setOverride(status: "VERIFIED" | "PENDING" | "BLOCKED" | null) {
    if (!profile?.user?.id) return;

    setOverrideSaving(true);
    setProfileError(null);
    setVehicleSaveMsg(null);

    try {
      await apiFetch(`/drivers/admin/${profile.user.id}/vehicle/override`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reason: status ? `Manual override: ${status}` : null,
        }),
      });

      const el = await apiFetch<any>(`/drivers/admin/${profile.user.id}/eligibility`);
      setEligibility(el);

      await loadDrivers({ force: true });
    } catch (e: any) {
      setProfileError(e?.message || "No se pudo actualizar override");
    } finally {
      setOverrideSaving(false);
    }
  }

  async function saveVehicleDocs() {
    if (!profile?.user?.id) return;

    setVehicleSaving(true);
    setProfileError(null);
    setVehicleSaveMsg(null);

    try {
      await apiFetch(`/drivers/admin/${profile.user.id}/vehicle`, {
        method: "PATCH",
        body: JSON.stringify({
          plate: vehicleForm.plate.trim() || null,
          brand: vehicleForm.brand.trim() || null,
          color: vehicleForm.color.trim() || null,
          model: vehicleForm.model.trim() || null,
          isActive: Boolean(vehicleForm.isActive),
          soatNumber: vehicleForm.soatNumber.trim() || null,
          soatExpiresAt: dateInputToIsoOrNull(vehicleForm.soatExpiresAt),
          tecnicomecanicaNumber: vehicleForm.tecnicomecanicaNumber.trim() || null,
          tecnicomecanicaExpiresAt: dateInputToIsoOrNull(vehicleForm.tecnicomecanicaExpiresAt),
        }),
      });

      setVehicleSaveMsg("Guardado ✅");
      setVehicleEditing(false);

      await openProfile(profile.user.id);
      await loadDrivers({ force: true });
    } catch (e: any) {
      setProfileError(e?.message || "No se pudo guardar vehículo/documentos");
      setVehicleSaveMsg(null);
    } finally {
      setVehicleSaving(false);
    }
  }

    async function saveDocumentCheck(
    type: string,
    payload: {
      status: string;
      documentNumber?: string | null;
      expiresAt?: string | null;
      receivedAt?: string | null;
      internalNotes?: string | null;
      waiverReason?: string | null;
      waiverExpiresAt?: string | null;
    }
  ) {
    if (!profile?.user?.id) return;

    setDocumentChecksLoading(true);
    setProfileError(null);
    setDocumentChecksMsg(null);

    try {
      await apiFetch(`/drivers/admin/${profile.user.id}/documents`, {
        method: "PATCH",
        body: JSON.stringify({
          type,
          ...payload,
        }),
      });

      const docsRes = await apiFetch<any>(`/drivers/admin/${profile.user.id}/documents`);
      setDocumentChecks(Array.isArray(docsRes?.documents) ? docsRes.documents : []);

      const el = await apiFetch<any>(`/drivers/admin/${profile.user.id}/eligibility`);
      setEligibility(el);

      setDocumentChecksMsg("Aval documental guardado ✅");
      await loadDrivers({ force: true });
    } catch (e: any) {
      setProfileError(e?.message || "No se pudo guardar el aval documental");
      setDocumentChecksMsg(null);
    } finally {
      setDocumentChecksLoading(false);
    }
  }

  const totalLabel = useMemo(() => {
    if (driversLoading) return "Cargando...";
    if (isGlobalCityLocked) {
      return `${driversData?.total ?? 0} total · ${cityLabel}`;
    }
    return `${driversData?.total ?? 0} total · Todas las ciudades`;
  }, [driversLoading, driversData?.total, isGlobalCityLocked, cityLabel]);

  const summary = useMemo(() => {
    const items = driversData?.items ?? [];
    const active = items.filter((d) => d.profile?.isActive).length;
    const inactive = items.filter((d) => !d.profile?.isActive).length;
    const docsOkCount = items.filter((d) => d.docs?.docsOk === true).length;
    const issuesCount = items.filter((d) => d.docs?.docsOk !== true).length;

    return {
      total: driversData?.total ?? 0,
      active,
      inactive,
      docsOkCount,
      issuesCount,
    };
  }, [driversData]);

  function resetFilters() {
    setDriversQ("");
    setDriversStatus("ALL");
    setDriversPage(1);
    setDriversLimit(10);
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
          <div className="xl:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <SectionHeader
              title="Conductores"
              subtitle="Consulta rápida del estado operativo, documentos, vehículos y actividad del equipo de reparto."
            />
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
                </div>
                <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                  {driversLoading ? "Actualizando datos..." : `${driversData?.items?.length ?? 0} conductores en vista`}
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

          <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <SectionHeader title="Resumen de filtros" subtitle="Estado actual de la búsqueda" />
            <div className="p-4 space-y-3">
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
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="text-slate-600">Búsqueda</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[220px] text-right">
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                  onChange={(e) => {
                    setDriversPage(1);
                    setDriversQ(e.target.value);
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
                  onChange={(e) => {
                    setDriversPage(1);
                    setDriversStatus(e.target.value as any);
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
                  onChange={(e) => {
                    setDriversPage(1);
                    setDriversLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              <div className="lg:col-span-12 flex items-end justify-end gap-2">
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <SectionHeader
            title="Listado de conductores"
            subtitle="Vista consolidada del estado del equipo"
            right={<span className="text-xs text-slate-500">{totalLabel}</span>}
          />

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(driversData?.items ?? []).map((d) => {
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

                      <td className="px-4 py-4 text-slate-700">{levelLabel(d.profile?.level)}</td>

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
  <div className="flex justify-end gap-2">
    <button
      onClick={() => setLegalDriver(d)}
      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
    >
      Legal
    </button>

    <button
      onClick={() => openProfile(d.id)}
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
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                      No hay drivers para los filtros actuales.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Página {driversData?.page ?? driversPage} · {driversData?.limit ?? driversLimit} por página
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDriversPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={driversPage <= 1}
              >
                Anterior
              </button>
              <button
                onClick={() => setDriversPage((p) => p + 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={(driversData?.items?.length ?? 0) < (driversData?.limit ?? driversLimit)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {profileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeProfile} />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <div className="text-sm text-slate-500">KroniX Control Center</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Perfil del conductor</div>
                {profile?.user ? (
                  <div className="mt-1 text-sm text-slate-600">
                    {profile.user.name} · {profile.user.phone} · {profile.user.id}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-slate-600">Detalle completo + historial</div>
                )}
              </div>

              <button
                onClick={closeProfile}
                disabled={profileLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-slate-50 px-6 py-6">
              {profileLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                  Cargando perfil...
                </div>
              ) : null}

              {profileError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {profileError}
                </div>
              ) : null}

              {!profileLoading && profile ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <MetricCard label="Nivel" value={levelLabel(profile.driverProfile?.level)} tone="slate" />
                    <MetricCard
                      label="Rating"
                      value={Number(profile.driverProfile?.rating ?? 0).toFixed(1)}
                      tone="blue"
                    />
                    <MetricCard
                      label="Estado"
                      value={profile.driverProfile?.isActive ? "Activo" : "Inactivo"}
                      tone={profile.driverProfile?.isActive ? "emerald" : "amber"}
                    />
                    <MetricCard label="Documentos" value={docsBadge(profile.docs).label} tone="slate" />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <SectionHeader
                      title="Vehículo y documentación"
                      subtitle="Aquí puedes actualizar SOAT, Tecnomecánica y datos operativos del vehículo."
                      right={
                        <div className="flex items-center gap-2">
                          {vehicleSaveMsg ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                              {vehicleSaveMsg}
                            </span>
                          ) : null}

                          {!vehicleEditing ? (
                            <button
                              onClick={() => {
                                setVehicleSaveMsg(null);
                                setVehicleEditing(true);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
                            >
                              Editar
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  const v = profile.vehicle || null;
                                  setVehicleForm({
                                    plate: String(v?.plate ?? ""),
                                    brand: String(v?.brand ?? ""),
                                    color: String(v?.color ?? ""),
                                    model: String(v?.model ?? ""),
                                    isActive: Boolean(v?.isActive ?? true),
                                    soatNumber: String(v?.soatNumber ?? ""),
                                    soatExpiresAt: isoToDateInput(v?.soatExpiresAt ?? null),
                                    tecnicomecanicaNumber: String(v?.tecnicomecanicaNumber ?? ""),
                                    tecnicomecanicaExpiresAt: isoToDateInput(v?.tecnicomecanicaExpiresAt ?? null),
                                  });
                                  setVehicleEditing(false);
                                  setVehicleSaveMsg(null);
                                }}
                                disabled={vehicleSaving}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={saveVehicleDocs}
                                disabled={vehicleSaving}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                              >
                                {vehicleSaving ? "Guardando..." : "Guardar cambios"}
                              </button>
                            </>
                          )}
                        </div>
                      }
                    />

                    <div className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Vehículo
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-500">Placa</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.plate}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, plate: e.target.value }))}
                                placeholder="Ej: GUN32A"
                              />
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={vehicleForm.isActive}
                                  disabled={!vehicleEditing || vehicleSaving}
                                  onChange={(e) => setVehicleForm((p) => ({ ...p, isActive: e.target.checked }))}
                                />
                                <span className="text-[11px] text-slate-600">Vehículo activo</span>
                              </label>
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Marca</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.brand}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))}
                                placeholder="Ej: Auteco Pulsar"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Color</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.color}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, color: e.target.value }))}
                                placeholder="Ej: Azul"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-[11px] text-slate-500">Modelo / Año</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.model}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, model: e.target.value }))}
                                placeholder="Ej: 2008"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Documentos
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[11px] text-slate-500">SOAT Número</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.soatNumber}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, soatNumber: e.target.value }))}
                                placeholder="Ej: ASDFG123456"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-[11px] text-slate-500">SOAT Vence</label>
                              <input
                                type="date"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.soatExpiresAt}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) => setVehicleForm((p) => ({ ...p, soatExpiresAt: e.target.value }))}
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-[11px] text-slate-500">Tecnomecánica Número</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.tecnicomecanicaNumber}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) =>
                                  setVehicleForm((p) => ({ ...p, tecnicomecanicaNumber: e.target.value }))
                                }
                                placeholder="Ej: QWERTY987654"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-[11px] text-slate-500">Tecnomecánica Vence</label>
                              <input
                                type="date"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={vehicleForm.tecnicomecanicaExpiresAt}
                                disabled={!vehicleEditing || vehicleSaving}
                                onChange={(e) =>
                                  setVehicleForm((p) => ({ ...p, tecnicomecanicaExpiresAt: e.target.value }))
                                }
                              />
                            </div>
                          </div>

                          {!vehicleEditing ? (
                            <div className="mt-3 text-xs text-slate-500">
                              Tip: al guardar aquí, actualizas la base operativa real del conductor y su elegibilidad.
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        Nota técnica: este panel guarda en <span className="font-mono">PATCH /drivers/admin/:id/vehicle</span>.
                      </div>
                    </div>
                  </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <SectionHeader
                      title="Avales documentales"
                      subtitle="Registro administrativo de documentos físicos revisados por KroniX. No se almacenan archivos pesados."
                      right={
                        documentChecksMsg ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                            {documentChecksMsg}
                          </span>
                        ) : null
                      }
                    />

                    <div className="divide-y divide-slate-100">
                      {DRIVER_DOCUMENT_TYPES.map((type) => {
                        const doc = documentChecks.find((d) => d.type === type) ?? null;

                        return (
                          <DriverDocumentCheckRow
                            key={type}
                            type={type}
                            label={DRIVER_DOCUMENT_LABELS[type] ?? type}
                            doc={doc}
                            loading={documentChecksLoading}
                            onSave={saveDocumentCheck}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <SectionHeader
                      title="Estado operativo (backend)"
                      subtitle="Fuente de verdad centralizada para determinar si el conductor puede operar."
                    />

                    <div className="p-4">
                      {eligibilityLoading ? (
                        <div className="text-sm text-slate-600">Calculando eligibility...</div>
                      ) : eligibility ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-slate-800">Puede operar:</span>{" "}
                            {eligibility.canOperate ? (
                              <span className="text-emerald-600 font-semibold">SÍ</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">NO</span>
                            )}
                          </div>

                          {eligibility.reasons?.length ? (
                            <div>
                              <div className="font-medium text-slate-800">Razones:</div>
                              <ul className="ml-5 mt-1 list-disc text-xs text-slate-600">
                                {eligibility.reasons.map((r: string) => (
                                  <li key={r}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          <div className="pt-3 border-t border-slate-100">
                            <div className="mb-2 text-xs font-medium text-slate-500">Override manual</div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setOverride("VERIFIED")}
                                disabled={overrideSaving}
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                VERIFIED
                              </button>

                              <button
                                onClick={() => setOverride("PENDING")}
                                disabled={overrideSaving}
                                className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                              >
                                PENDING
                              </button>

                              <button
                                onClick={() => setOverride("BLOCKED")}
                                disabled={overrideSaving}
                                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                              >
                                BLOCKED
                              </button>

                              <button
                                onClick={() => setOverride(null)}
                                disabled={overrideSaving}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
                              >
                                Limpiar override
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <SectionHeader
                      title="Acciones operativas"
                      subtitle={
                        profile.inactiveInfo?.reason
                          ? `Solo ADMIN/FINANCE. Última razón: ${profile.inactiveInfo.reason}`
                          : "Solo ADMIN/FINANCE. Se registra auditoría."
                      }
                      right={
                        <button
                          onClick={() => openToggle(Boolean(profile.driverProfile?.isActive))}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          {profile.driverProfile?.isActive ? "Desactivar" : "Activar"}
                        </button>
                      }
                    />

                    <div className="p-4">
                      {toggleOpen ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-sm font-semibold text-slate-900 mb-2">
                            Confirmar: {toggleIsActive ? "Activar" : "Desactivar"} conductor
                          </div>

                          {!toggleIsActive ? (
                            <div className="mb-3">
                              <label className="text-xs text-slate-500">Razón (obligatoria al desactivar)</label>
                              <input
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                placeholder="Ej: documentos vencidos, fraude, soporte, etc."
                                value={toggleReason}
                                onChange={(e) => setToggleReason(e.target.value)}
                                disabled={toggleSaving}
                              />
                            </div>
                          ) : null}

                          <label className="flex items-start gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={toggleConfirm}
                              onChange={(e) => setToggleConfirm(e.target.checked)}
                              disabled={toggleSaving}
                            />
                            <span>
                              Confirmo esta acción y entiendo que quedará registrada con auditoría.
                            </span>
                          </label>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              onClick={() => setToggleOpen(false)}
                              disabled={toggleSaving}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={saveToggle}
                              disabled={
                                toggleSaving ||
                                !toggleConfirm ||
                                (!toggleIsActive && toggleReason.trim().length < 3)
                              }
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                              {toggleSaving ? "Guardando..." : "Confirmar"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <SectionHeader
                        title="Últimos pedidos"
                        right={<div className="text-xs text-slate-500">{profile.history?.orders?.length ?? 0}</div>}
                      />
                      <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                              <th className="px-4 py-3">Pedido</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Payout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(profile.history?.orders ?? []).slice(0, 12).map((o: any) => (
                              <tr key={o.id}>
                                <td className="px-4 py-3 font-mono text-xs text-slate-700">{o.id}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{String(o.status ?? "")}</td>
                                <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                                  {o.driverPayoutCOP != null ? formatCOP(Number(o.driverPayoutCOP)) : "—"}
                                </td>
                              </tr>
                            ))}
                            {(profile.history?.orders?.length ?? 0) === 0 ? (
                              <tr>
                                <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                                  Sin historial todavía.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <SectionHeader
                        title="Últimos payouts"
                        right={<div className="text-xs text-slate-500">{profile.history?.payouts?.length ?? 0}</div>}
                      />
                      <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                              <th className="px-4 py-3">Periodo</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(profile.history?.payouts ?? []).slice(0, 12).map((p: any) => (
                              <tr key={p.id}>
                                <td className="px-4 py-3 text-xs text-slate-700">{labelPeriod(p.periodStart, p.periodEnd)}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{String(p.status ?? "")}</td>
                                <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                                  {formatCOP(Number(p.amountCOP ?? 0))}
                                </td>
                              </tr>
                            ))}
                            {(profile.history?.payouts?.length ?? 0) === 0 ? (
                              <tr>
                                <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                                  Sin payouts todavía.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Nota: sanciones/bonos quedan listos como placeholder. Si quieres, el siguiente paso es modelarlos.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

function DriverDocumentCheckRow({
  type,
  label,
  doc,
  loading,
  onSave,
}: {
  type: string;
  label: string;
  doc: DriverDocumentCheck | null;
  loading: boolean;
  onSave: (
    type: string,
    payload: {
      status: string;
      documentNumber?: string | null;
      expiresAt?: string | null;
      receivedAt?: string | null;
      internalNotes?: string | null;
      waiverReason?: string | null;
      waiverExpiresAt?: string | null;
    }
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(doc?.status ?? "PENDING");
  const [documentNumber, setDocumentNumber] = useState(doc?.documentNumber ?? "");
  const [expiresAt, setExpiresAt] = useState(isoToDateInput(doc?.expiresAt ?? null));
  const [internalNotes, setInternalNotes] = useState(doc?.internalNotes ?? "");
  const [waiverReason, setWaiverReason] = useState(doc?.waiverReason ?? "");
  const [waiverExpiresAt, setWaiverExpiresAt] = useState(
    isoToDateInput(doc?.waiverExpiresAt ?? null)
  );

  useEffect(() => {
    setStatus(doc?.status ?? "PENDING");
    setDocumentNumber(doc?.documentNumber ?? "");
    setExpiresAt(isoToDateInput(doc?.expiresAt ?? null));
    setInternalNotes(doc?.internalNotes ?? "");
    setWaiverReason(doc?.waiverReason ?? "");
    setWaiverExpiresAt(isoToDateInput(doc?.waiverExpiresAt ?? null));
  }, [doc]);

  const badgeClass =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "TEMPORARY_APPROVED"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "REJECTED" || status === "EXPIRED"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

        {legalDriver ? (
        <DriverLegalAuditModal
          driverId={legalDriver.id}
          driverName={legalDriver.name}
          onClose={() => setLegalDriver(null)}
        />
      ) : null}

  return (
    <div className="p-4">
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">{type}</div>

          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
            {status}
          </span>
        </div>

        <div className="xl:col-span-9">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="text-[11px] text-slate-500">Estado</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={status}
                disabled={loading}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PENDING">Pendiente</option>
                <option value="RECEIVED">Recibido</option>
                <option value="APPROVED">Aprobado</option>
                <option value="REJECTED">Rechazado</option>
                <option value="EXPIRED">Vencido</option>
                <option value="TEMPORARY_APPROVED">Aval temporal</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-500">Número</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={documentNumber}
                disabled={loading}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500">Vence</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={expiresAt}
                disabled={loading}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onSave(type, {
                    status,
                    documentNumber: documentNumber.trim() || null,
                    expiresAt: dateInputToIsoOrNull(expiresAt),
                    receivedAt: new Date().toISOString(),
                    internalNotes: internalNotes.trim() || null,
                    waiverReason:
                      status === "TEMPORARY_APPROVED"
                        ? waiverReason.trim() || null
                        : null,
                    waiverExpiresAt:
                      status === "TEMPORARY_APPROVED"
                        ? dateInputToIsoOrNull(waiverExpiresAt)
                        : null,
                  })
                }
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>

            <div className="md:col-span-4">
              <label className="text-[11px] text-slate-500">Nota interna</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={internalNotes}
                disabled={loading}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ej: documento recibido físicamente en capacitación presencial"
              />
            </div>

            {status === "TEMPORARY_APPROVED" ? (
              <>
                <div className="md:col-span-3">
                  <label className="text-[11px] text-slate-500">Razón del aval temporal</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm"
                    value={waiverReason}
                    disabled={loading}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="Ej: documento físico pendiente de actualización"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500">Aval hasta</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm"
                    value={waiverExpiresAt}
                    disabled={loading}
                    onChange={(e) => setWaiverExpiresAt(e.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

}