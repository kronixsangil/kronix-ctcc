// app/(cc)/stores/components/StoresTab.tsx
// app/(cc)/stores/components/StoresTab.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StoresFilters from "./StoresFilters";
import StoresTable from "./StoresTable";
import StoreDetailsModal from "./StoreDetailsModal";
import StoreSettlementsTab from "./StoreSettlementsTab";
import { useCtccCity } from "../../components/CtccCityContext";
import {
  AdminCityItem,
  AdminStoreListItem,
  AdminSystemPromo,
  AdminCourierZone,
  StoreStatusFilter,
  adminCreateSystemPromo,
  adminGetSystemConfig,
  adminListCities,
  adminListStores,
  adminListSystemPromos,
  adminUpdateSystemConfig,
  adminUpdateSystemPromo,
  adminListCourierZones,
  adminUpdateCourierZone,
} from "../lib/storesApi";

type ServiceType = "STORE" | "PICKUP_AND_DELIVERY" | "SEND_PACKAGE" | "ERRAND";

const SERVICE_OPTIONS: { value: ServiceType; label: string; hint: string }[] = [
  { value: "STORE", label: "Tienda en línea", hint: "Compras en tiendas afiliadas." },
  { value: "PICKUP_AND_DELIVERY", label: "Domicilio Express", hint: "Mensajería punto a punto." },
  { value: "SEND_PACKAGE", label: "KroniX Envíos", hint: "Envío de paquetes locales." },
  { value: "ERRAND", label: "Domicilios y Diligencias", hint: "Mandados, pagos y trámites." },
];

type QueryState = {
  q: string;
  status: StoreStatusFilter;
  citySlug: string;
  page: number;
  limit: number;
};

type StoresSectionTab = "STORES" | "SYSTEM_FEES" | "ZONES" | "PROMOS" | "SETTLEMENTS";

const DEFAULT_QUERY: QueryState = {
  q: "",
  status: "ALL",
  citySlug: "",
  page: 1,
  limit: 10,
};

const ZONE_MONEY_FIELDS: Array<keyof AdminCourierZone> = [
  "baseServiceCOP",
  "feeCOP",
  "serviceFeeCOP",
  "packageLargeFeeCOP",
  "extraPointFeeCOP",
  "returnFeeCOP",
  "complexityFeeCOP",
];

function getServiceLabel(serviceType: ServiceType) {
  return SERVICE_OPTIONS.find((x) => x.value === serviceType)?.label ?? "Servicio";
}

function getServiceHint(serviceType: ServiceType) {
  return SERVICE_OPTIONS.find((x) => x.value === serviceType)?.hint ?? "";
}

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function inputDateTimeValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function isoOrNull(value: string) {
  const v = String(value || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toSafeCOP(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function kpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function ZoneMoneyInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="relative w-32">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
        $
      </span>
      <input
        type="number"
        min={0}
        step={500}
        value={Number(value || 0)}
        disabled={disabled}
        onChange={(e) => onChange(toSafeCOP(e.target.value))}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-7 text-right text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

function PromoEditor({
  promo,
  citySlug,
  cityLabel,
  serviceType,
  onCancel,
  onSaved,
}: {
  promo: AdminSystemPromo | null;
  citySlug: string;
  cityLabel: string;
  serviceType: ServiceType;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: promo?.code ?? "",
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    discountType: (promo?.discountType ?? "PERCENT") as "PERCENT" | "FIXED",
    discountValue: String(promo?.discountValue ?? ""),
    minOrderCOP: promo?.minOrderCOP == null ? "" : String(promo.minOrderCOP),
    maxDiscountCOP: promo?.maxDiscountCOP == null ? "" : String(promo.maxDiscountCOP),
    startsAt: inputDateTimeValue(promo?.startsAt),
    endsAt: inputDateTimeValue(promo?.endsAt),
    isActive: promo?.isActive ?? true,
  });

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        code: String(form.code || "").trim(),
        title: String(form.title || "").trim(),
        description: String(form.description || "").trim() || null,
        discountType: form.discountType,
        discountValue: Math.max(0, Number(form.discountValue || 0)),
        minOrderCOP: form.minOrderCOP === "" ? null : Math.max(0, Number(form.minOrderCOP || 0)),
        maxDiscountCOP:
          form.maxDiscountCOP === "" ? null : Math.max(0, Number(form.maxDiscountCOP || 0)),
        startsAt: isoOrNull(form.startsAt),
        endsAt: isoOrNull(form.endsAt),
        isActive: Boolean(form.isActive),
        serviceType,
      };

      if (!citySlug) throw new Error("Selecciona una ciudad antes de guardar promociones.");
      if (!payload.code) throw new Error("Código requerido");
      if (!payload.title) throw new Error("Título requerido");
      if (!Number.isFinite(payload.discountValue)) throw new Error("discountValue inválido");

      if (promo?.id) {
        await adminUpdateSystemPromo(promo.id, payload);
      } else {
        await adminCreateSystemPromo({
          ...payload,
          citySlug,
        });
      }

      onSaved();
    } catch (e: any) {
      setError(e?.message || "Error guardando promoción");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">
          {promo ? "Editar promoción" : "Nueva promoción"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Alcance: {cityLabel} · Servicio: {getServiceLabel(serviceType)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        {error ? (
          <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div>
          <label className="text-xs font-medium text-slate-600">Código</label>
          <input
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="BIENVENIDA10"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Título</label>
          <input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="10% en tu primera compra"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Descripción</label>
          <input
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Aplica para el servicio seleccionado"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Tipo descuento</label>
          <select
            value={form.discountType}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                discountType: e.target.value as "PERCENT" | "FIXED",
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="PERCENT">Porcentaje</option>
            <option value="FIXED">Valor fijo</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">
            {form.discountType === "PERCENT" ? "Valor (%)" : "Valor fijo (COP)"}
          </label>
          <input
            value={form.discountValue}
            onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Pedido mínimo (COP)</label>
          <input
            value={form.minOrderCOP}
            onChange={(e) => setForm((s) => ({ ...s, minOrderCOP: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Tope descuento (COP)</label>
          <input
            value={form.maxDiscountCOP}
            onChange={(e) => setForm((s) => ({ ...s, maxDiscountCOP: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Empieza</label>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Termina</label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm((s) => ({ ...s, endsAt: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Activa</label>
          <select
            value={String(form.isActive)}
            onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.value === "true" }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="flex items-end justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Guardando..." : promo ? "Guardar cambios" : "Crear promoción"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoresTab() {
  const { isGlobal, citySlug: globalCitySlug } = useCtccCity();

  const [serviceType, setServiceType] = useState<ServiceType>("STORE");
  const [sectionTab, setSectionTab] = useState<StoresSectionTab>("STORES");
  const [localCitySlug, setLocalCitySlug] = useState<string>("");

  const [uiQuery, setUiQuery] = useState<QueryState>(DEFAULT_QUERY);
  const [appliedQuery, setAppliedQuery] = useState<QueryState>(DEFAULT_QUERY);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cities, setCities] = useState<AdminCityItem[]>([]);

  const [items, setItems] = useState<AdminStoreListItem[]>([]);

  useEffect(() => {
  const count = items.filter(
    (item) => String((item as any).storePayoutInfoStatus ?? "").toUpperCase() === "PENDING"
  ).length;

  window.dispatchEvent(
    new CustomEvent("kronix:stores-payment-pending-count", {
      detail: { count },
    })
  );
}, [items]);

  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState({
    baseDeliveryCOP: "",
    extraStoreDeliveryCOP: "",
    serviceFeeCOP: "",
    serviceFeePercent: "",
  });

  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState<string | null>(null);
  const [promos, setPromos] = useState<AdminSystemPromo[]>([]);
  const [promoEditorOpen, setPromoEditorOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<AdminSystemPromo | null>(null);

  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [zonesSuccess, setZonesSuccess] = useState<string | null>(null);
  const [zones, setZones] = useState<AdminCourierZone[]>([]);
  const [zonesDraft, setZonesDraft] = useState<AdminCourierZone[]>([]);
  const [zonesSaving, setZonesSaving] = useState(false);
  const [zonesDirty, setZonesDirty] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const effectiveCitySlug = isGlobal ? localCitySlug : globalCitySlug;
  const canManageCommercialConfig = Boolean(effectiveCitySlug);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setAppliedQuery(uiQuery), 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [uiQuery]);

  useEffect(() => {
    setUiQuery((prev) => {
      const nextCitySlug = isGlobal ? "" : globalCitySlug;
      if (prev.citySlug === nextCitySlug) return prev;
      return { ...prev, citySlug: nextCitySlug, page: 1 };
    });
  }, [globalCitySlug, isGlobal]);

  useEffect(() => {
    if (!isGlobal) setLocalCitySlug(globalCitySlug || "");
  }, [isGlobal, globalCitySlug]);

  // 🔥 permitir STORE en zonas (ya no forzamos cambio)
useEffect(() => {
  // no hacer nada
}, [sectionTab, serviceType]);

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const res = await adminListCities({ status: "ACTIVE", page: 1, limit: 100 });
      setCities(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListStores(appliedQuery);
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || "Error cargando tiendas");
    } finally {
      setLoading(false);
    }
  }

  async function loadSystemConfig() {
    if (!canManageCommercialConfig) return;

    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(null);

    try {
      const cfg = await adminGetSystemConfig(effectiveCitySlug || undefined, "STORE");
      setConfigForm({
        baseDeliveryCOP: String(cfg.baseDeliveryCOP ?? 0),
        extraStoreDeliveryCOP: String(cfg.extraStoreDeliveryCOP ?? 0),
        serviceFeeCOP: String(cfg.serviceFeeCOP ?? 0),
        serviceFeePercent: String(cfg.serviceFeePercent ?? 0),
      });
    } catch (e: any) {
      setConfigError(e?.message || "Error cargando configuración");
    } finally {
      setConfigLoading(false);
    }
  }

  async function saveSystemConfig() {
    if (!canManageCommercialConfig) {
      setConfigError("Selecciona una ciudad para guardar tarifas.");
      return;
    }

    setConfigSaving(true);
    setConfigError(null);
    setConfigSuccess(null);

    try {
      const updated = await adminUpdateSystemConfig(
        {
          baseDeliveryCOP: Math.max(0, Math.round(Number(configForm.baseDeliveryCOP || 0))),
          extraStoreDeliveryCOP: Math.max(0, Math.round(Number(configForm.extraStoreDeliveryCOP || 0))),
          serviceFeeCOP: Math.max(0, Math.round(Number(configForm.serviceFeeCOP || 0))),
          serviceFeePercent: Math.max(0, Number(configForm.serviceFeePercent || 0)),
        },
        effectiveCitySlug || undefined,
        "STORE"
      );

      setConfigForm({
        baseDeliveryCOP: String(updated.baseDeliveryCOP ?? 0),
        extraStoreDeliveryCOP: String(updated.extraStoreDeliveryCOP ?? 0),
        serviceFeeCOP: String(updated.serviceFeeCOP ?? 0),
        serviceFeePercent: String(updated.serviceFeePercent ?? 0),
      });

      setConfigSuccess("Tarifas actualizadas correctamente.");
    } catch (e: any) {
      setConfigError(e?.message || "Error guardando configuración");
    } finally {
      setConfigSaving(false);
    }
  }

  async function loadPromos() {
    if (!canManageCommercialConfig) return;

    setPromosLoading(true);
    setPromosError(null);

    try {
      const rows = await adminListSystemPromos(effectiveCitySlug || undefined, serviceType);
      setPromos(rows);
    } catch (e: any) {
      setPromosError(e?.message || "Error cargando promociones");
    } finally {
      setPromosLoading(false);
    }
  }

  async function loadZones() {
    if (!canManageCommercialConfig || !effectiveCitySlug) return;
    
    setZonesLoading(true);
    setZonesError(null);
    setZonesSuccess(null);

    try {
      const rows = await adminListCourierZones({
        citySlug: effectiveCitySlug,
        serviceType,
      });

      const normalizedRows = Array.isArray(rows)
        ? rows
        : Array.isArray((rows as any)?.items)
          ? (rows as any).items
          : [];

      setZones(normalizedRows);
      setZonesDraft(normalizedRows);
      setZonesDirty(false);
    } catch (e: any) {
      setZones([]);
      setZonesDraft([]);
      setZonesDirty(false);
      setZonesError(e?.message || "Error cargando zonas");
    } finally {
      setZonesLoading(false);
    }
  }

  function updateZoneDraft(id: string, field: keyof AdminCourierZone, value: any) {
    setZonesSuccess(null);
    setZonesDirty(true);

    setZonesDraft((prev) =>
      prev.map((z) => {
        if (z.id !== id) return z;

        const cleanValue = ZONE_MONEY_FIELDS.includes(field)
          ? toSafeCOP(value)
          : field === "isNegotiable"
            ? Boolean(value)
            : value;

        return {
          ...z,
          [field]: cleanValue,
        };
      })
    );
  }

  async function saveZones() {
    setZonesSaving(true);
    setZonesError(null);
    setZonesSuccess(null);

    try {
      const changedZones = zonesDraft.filter((draft) => {
        const original = zones.find((z) => z.id === draft.id);
        if (!original) return true;

        const fieldsToCompare: Array<keyof AdminCourierZone> = [
          "name",
          "baseServiceCOP",
          "feeCOP",
          "serviceFeeCOP",
          "packageLargeFeeCOP",
          "extraPointFeeCOP",
          "returnFeeCOP",
          "complexityFeeCOP",
          "isNegotiable",
        ];

        return fieldsToCompare.some((field) => original[field] !== draft[field]);
      });

      const updatedRows = await Promise.all(
        changedZones.map((zone) =>
          adminUpdateCourierZone(zone.id, {
            name: zone.name,
            baseServiceCOP: toSafeCOP(zone.baseServiceCOP),
            feeCOP: toSafeCOP(zone.feeCOP),
            serviceFeeCOP: toSafeCOP(zone.serviceFeeCOP),
            packageLargeFeeCOP: toSafeCOP(zone.packageLargeFeeCOP),
            extraPointFeeCOP: toSafeCOP(zone.extraPointFeeCOP),
            returnFeeCOP: toSafeCOP(zone.returnFeeCOP),
            complexityFeeCOP: toSafeCOP(zone.complexityFeeCOP),
            isNegotiable: Boolean(zone.isNegotiable),
          } as any)
        )
      );

      const nextRows = zonesDraft.map((draft) => {
        const updated = updatedRows.find((row) => row.id === draft.id);
        return updated ? { ...draft, ...updated } : draft;
      });

      setZones(nextRows);
      setZonesDraft(nextRows);
      setZonesDirty(false);
      setZonesSuccess(
        changedZones.length === 0
          ? "No había cambios pendientes."
          : "Tarifas courier actualizadas correctamente."
      );
    } catch (e: any) {
      setZonesError(e?.message || "Error guardando tarifas courier");
    } finally {
      setZonesSaving(false);
    }
  }

  function discardZoneChanges() {
    setZonesDraft(zones);
    setZonesDirty(false);
    setZonesError(null);
    setZonesSuccess(null);
  }

  async function quickTogglePromo(promo: AdminSystemPromo) {
    setPromosError(null);

    try {
      const updated = await adminUpdateSystemPromo(promo.id, {
        isActive: !promo.isActive,
        serviceType,
      });

      setPromos((prev) => prev.map((p) => (p.id === promo.id ? updated : p)));
    } catch (e: any) {
      setPromosError(e?.message || "Error actualizando promoción");
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (sectionTab !== "STORES") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sectionTab,
    appliedQuery.q,
    appliedQuery.status,
    appliedQuery.citySlug,
    appliedQuery.page,
    appliedQuery.limit,
  ]);

  useEffect(() => {
    setPromoEditorOpen(false);
    setEditingPromo(null);

    if (!canManageCommercialConfig) {
      setPromos([]);
      setZones([]);
      setZonesDraft([]);
      setZonesDirty(false);
      setConfigForm({
        baseDeliveryCOP: "",
        extraStoreDeliveryCOP: "",
        serviceFeeCOP: "",
        serviceFeePercent: "",
      });
      return;
    }

    if (sectionTab === "SYSTEM_FEES") loadSystemConfig();
    if (sectionTab === "ZONES") loadZones();
    if (sectionTab === "PROMOS") loadPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionTab, effectiveCitySlug, serviceType, canManageCommercialConfig]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / (appliedQuery.limit || 10))), [
    total,
    appliedQuery.limit,
  ]);

  const selectedCity = useMemo(() => {
    if (!effectiveCitySlug) return null;
    return cities.find((c) => c.slug === effectiveCitySlug) ?? null;
  }, [cities, effectiveCitySlug]);

  const effectiveCityLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.department}` : "Vista Global";
  const serviceLabel = getServiceLabel(serviceType);
  const serviceHint = getServiceHint(serviceType);

  const storesCount = items.length;
  const activeCount = items.filter((x) => x.isActive && !x.isPaused).length;
  const pausedCount = items.filter((x) => x.isActive && x.isPaused).length;
  const recommendedCount = items.filter((x) => x.isBuyerRecommended).length;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                Multi-ciudad · Operación comercial
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                Gestión de Tiendas
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Administra tiendas, tarifas y promociones por ciudad y por tipo de servicio.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  {selectedCity
                    ? `Ciudad activa: ${selectedCity.name}, ${selectedCity.department}`
                    : "Vista global: todas las ciudades"}
                </div>

                <div className="inline-flex items-center rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-400/20">
                  {loading ? "Actualizando datos..." : `${total} tiendas registradas`}
                </div>
              </div>
            </div>

            {sectionTab === "STORES" ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                + Nueva tienda
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {sectionTab === "STORES" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCard({
            label: "Tiendas en vista",
            value: loading ? "..." : storesCount,
            hint: selectedCity ? `Resultado actual para ${selectedCity.name}` : "Resultado actual según filtros",
          })}
          {kpiCard({ label: "Activas", value: loading ? "..." : activeCount, hint: "Operando normalmente" })}
          {kpiCard({ label: "Pausadas", value: loading ? "..." : pausedCount, hint: "Activas pero temporalmente pausadas" })}
          {kpiCard({ label: "Recomendadas", value: loading ? "..." : recommendedCount, hint: "Con visibilidad especial en Buyer" })}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 md:p-5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tiendas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona tiendas, tarifas del sistema y promociones comerciales.
          </p>

          {sectionTab !== "STORES" && sectionTab !== "SETTLEMENTS" ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Ciudad configuración</label>

              <select
                value={effectiveCitySlug || ""}
                disabled={!isGlobal}
                onChange={(e) => setLocalCitySlug(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Vista Global</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}, {c.department}
                  </option>
                ))}
              </select>

              <label className="ml-0 text-sm font-medium text-slate-600 md:ml-3">Servicio</label>

              <select
                value={serviceType}
                disabled={!canManageCommercialConfig}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
              >
                {SERVICE_OPTIONS.filter((s) => {
                  if (sectionTab === "SYSTEM_FEES") return s.value === "STORE";
                  if (sectionTab === "ZONES") return true;
                  return true;
                }).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {!isGlobal ? (
                <span className="text-xs text-slate-500">Bloqueado por selector superior</span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Alcance actual: {effectiveCityLabel}
              </span>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setSectionTab("STORES")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "STORES"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Tiendas
            </button>

            <button
              onClick={() => {
                setServiceType("STORE");
                setSectionTab("SYSTEM_FEES");
              }}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "SYSTEM_FEES"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Tarifas Tienda en Línea
            </button>

            <button
              onClick={() => {
                if (serviceType === "STORE") setServiceType("PICKUP_AND_DELIVERY");
                setSectionTab("ZONES");
              }}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "ZONES"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Tarifas Servicios Courier
            </button>

            <button
              onClick={() => setSectionTab("PROMOS")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "PROMOS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Promociones
            </button>

            <button
              onClick={() => setSectionTab("SETTLEMENTS")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "SETTLEMENTS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Pagos y Conciliaciones
            </button>
          </div>

          {sectionTab === "STORES" ? (
            <div className="mt-5">
              <StoresFilters
                value={uiQuery}
                cities={cities}
                citiesLoading={citiesLoading}
                contextCityLocked={!isGlobal}
                onChange={setUiQuery}
                onClear={() =>
                  setUiQuery({
                    ...DEFAULT_QUERY,
                    citySlug: isGlobal ? "" : globalCitySlug,
                  })
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {sectionTab === "STORES" ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Listado de tiendas</div>
                <div className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Cargando..."
                    : selectedCity
                      ? `${items.length} en vista · ${total} total · ${selectedCity.name}, ${selectedCity.department}`
                      : `${items.length} en vista · ${total} total · Todas las ciudades`}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
  {/* 🔄 REFRESH */}
  <button
    onClick={() => load()}
    disabled={loading}
    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
  >
    {loading ? "Actualizando..." : "⟳ Actualizar"}
  </button>

  {/* PAGINACIÓN */}
  <button
    disabled={appliedQuery.page <= 1 || loading}
    onClick={() => setUiQuery((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:bg-slate-50 disabled:opacity-50"
  >
    ←
  </button>

  <div className="text-sm text-slate-600">
    Página <span className="font-semibold text-slate-900">{appliedQuery.page}</span> / {pageCount}
  </div>

  <button
    disabled={appliedQuery.page >= pageCount || loading}
    onClick={() => setUiQuery((s) => ({ ...s, page: Math.min(pageCount, s.page + 1) }))}
    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:bg-slate-50 disabled:opacity-50"
  >
    →
  </button>
</div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5">
              <StoresTable items={items} loading={loading} onOpen={(id) => setSelectedId(id)} />
            </div>
          </div>
        </div>
      ) : null}

      {sectionTab !== "STORES" && sectionTab !== "SETTLEMENTS" && !canManageCommercialConfig ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          <div className="text-base font-extrabold">Selecciona una ciudad para continuar</div>
          <div className="mt-1">
            Las tarifas y promociones no se muestran ni se editan en Vista Global para evitar conflictos.
          </div>
        </div>
      ) : null}

      {sectionTab === "SYSTEM_FEES" && canManageCommercialConfig ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold">Tarifas Tienda en Línea</div>
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                  {effectiveCityLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Tienda en línea
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">Compras en tiendas afiliadas.</div>
            </div>

            <div className="p-4 md:p-5">
              {configError ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {configError}
                </div>
              ) : null}

              {configSuccess ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {configSuccess}
                </div>
              ) : null}

              {configLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Cargando configuración...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Tarifa base (COP)</label>
                    <input
                      value={configForm.baseDeliveryCOP}
                      onChange={(e) => setConfigForm((s) => ({ ...s, baseDeliveryCOP: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Extra por parada / tienda extra (COP)
                    </label>
                    <input
                      value={configForm.extraStoreDeliveryCOP}
                      onChange={(e) => setConfigForm((s) => ({ ...s, extraStoreDeliveryCOP: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Cargo de servicio fijo (COP)</label>
                    <input
                      value={configForm.serviceFeeCOP}
                      onChange={(e) => setConfigForm((s) => ({ ...s, serviceFeeCOP: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Cargo de servicio porcentaje</label>
                    <input
                      value={configForm.serviceFeePercent}
                      onChange={(e) => setConfigForm((s) => ({ ...s, serviceFeePercent: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ej: 0.05 = 5%"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      onClick={loadSystemConfig}
                      disabled={configLoading || configSaving}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                    >
                      Recargar
                    </button>

                    <button
                      onClick={saveSystemConfig}
                      disabled={configLoading || configSaving}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {configSaving ? "Guardando..." : "Guardar tarifas"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">Guía rápida</div>
            <div className="space-y-3 p-4 text-sm text-slate-600">
              <div>
                <b>Servicio:</b> Tienda en línea.
              </div>
              <div>
                <b>Tarifa base:</b> costo inicial para compras en tiendas afiliadas.
              </div>
              <div>
                <b>Extra:</b> valor adicional si aplica por tienda extra.
              </div>
              <div>
                <b>Cargo fijo:</b> valor de servicio que se suma al pedido.
              </div>
              <div>
                <b>Cargo %:</b> porcentaje adicional opcional. Ejemplo: <code>0.05</code> = 5%.
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                Se guarda para <b>{effectiveCityLabel}</b> y servicio <b>Tienda en línea</b>.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sectionTab === "ZONES" && canManageCommercialConfig ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold">Tarifas Servicios Courier</div>

                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    {effectiveCityLabel}
                  </span>

                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {serviceLabel}
                  </span>

                  {zonesDirty ? (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      Cambios pendientes
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Configura tarifas por zona (1–4). Zona 5 es fuera de cobertura para Tienda en Línea.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={loadZones}
                  disabled={zonesLoading || zonesSaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {zonesLoading ? "Cargando..." : "Recargar"}
                </button>

                <button
                  onClick={discardZoneChanges}
                  disabled={!zonesDirty || zonesLoading || zonesSaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Descartar
                </button>

                <button
                  onClick={saveZones}
                  disabled={zonesLoading || zonesSaving || !zonesDirty}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {zonesSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>

            <div className="p-4">
              {zonesError ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {zonesError}
                </div>
              ) : null}

              {zonesSuccess ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {zonesSuccess}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                        <th>Zona</th>
                        <th>Nombre</th>
                        <th>Base</th>
                        <th>Zona Fee</th>
                        <th>Servicio</th>
                        <th>Paquete grande</th>
                        <th>Punto extra</th>
                        <th>Retorno</th>
                        <th>Complejidad</th>
                        <th>Negociable</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {zonesLoading ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                            Cargando zonas...
                          </td>
                        </tr>
                      ) : zonesDraft.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                            No hay zonas configuradas para {effectiveCityLabel} · {serviceLabel}.
                          </td>
                        </tr>
                      ) : (
                        zonesDraft.map((z) => {
                          const isZoneFive = Number(z.zoneNumber) === 5;
                          const isStore = serviceType === "STORE";

                          return (
                            <tr key={z.id} className="[&>td]:px-3 [&>td]:py-3">
                              <td className="whitespace-nowrap font-bold text-slate-900">
                                Zona {z.zoneNumber}
                              </td>

                              <td>
                                <input
                                  value={z.name ?? ""}
                                  onChange={(e) => updateZoneDraft(z.id, "name", e.target.value)}
                                  className="h-10 w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.baseServiceCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "baseServiceCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.feeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "feeCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.serviceFeeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "serviceFeeCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.packageLargeFeeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "packageLargeFeeCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.extraPointFeeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "extraPointFeeCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.returnFeeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "returnFeeCOP", value)}
                                />
                              </td>

                              <td>
                                <ZoneMoneyInput
                                  value={z.complexityFeeCOP}
                                  disabled={isZoneFive && !isStore}
                                  onChange={(value) => updateZoneDraft(z.id, "complexityFeeCOP", value)}
                                />
                              </td>

                              <td>
                                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(z.isNegotiable)}
                                    onChange={(e) => updateZoneDraft(z.id, "isNegotiable", e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                  <span className="text-xs font-semibold text-slate-600">
                                    {z.isNegotiable ? "Sí" : "No"}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Zona 5 indica fuera de cobertura para Tienda en Línea. No se permite crear pedidos en esta zona.
                Los valores se guardan cuando presionas <b>Guardar cambios</b>.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sectionTab === "PROMOS" && canManageCommercialConfig ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold">Promociones del sistema</div>
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    {effectiveCityLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {serviceLabel}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Crea y administra promociones para la ciudad y servicio seleccionados.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadPromos}
                  disabled={promosLoading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {promosLoading ? "Cargando..." : "Actualizar"}
                </button>

                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setPromoEditorOpen(true);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  + Nueva promo
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5">
              {promosError ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {promosError}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                        <th>Código</th>
                        <th>Promoción</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Mínimo</th>
                        <th>Tope</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {promosLoading ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                            Cargando promociones...
                          </td>
                        </tr>
                      ) : promos.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                            No hay promociones para {effectiveCityLabel} · {serviceLabel}.
                          </td>
                        </tr>
                      ) : (
                        promos.map((promo) => (
                          <tr key={promo.id} className="[&>td]:px-3 [&>td]:py-3">
                            <td className="font-mono text-xs font-semibold text-slate-700">{promo.code}</td>

                            <td>
                              <div className="font-medium text-slate-900">{promo.title}</div>
                              {promo.description ? <div className="text-xs text-slate-500">{promo.description}</div> : null}
                            </td>

                            <td>{promo.discountType === "PERCENT" ? "Porcentaje" : "Fijo"}</td>

                            <td>
                              {promo.discountType === "PERCENT"
                                ? `${promo.discountValue}%`
                                : formatCOP(promo.discountValue)}
                            </td>

                            <td>{promo.minOrderCOP == null ? "—" : formatCOP(promo.minOrderCOP)}</td>
                            <td>{promo.maxDiscountCOP == null ? "—" : formatCOP(promo.maxDiscountCOP)}</td>

                            <td className="text-xs text-slate-600">
                              <div>Inicio: {promo.startsAt ? new Date(promo.startsAt).toLocaleString("es-CO") : "—"}</div>
                              <div>Fin: {promo.endsAt ? new Date(promo.endsAt).toLocaleString("es-CO") : "—"}</div>
                            </td>

                            <td>
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                  promo.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700",
                                ].join(" ")}
                              >
                                {promo.isActive ? "Activa" : "Inactiva"}
                              </span>
                            </td>

                            <td className="text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingPromo(promo);
                                    setPromoEditorOpen(true);
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                >
                                  Editar
                                </button>

                                <button
                                  onClick={() => quickTogglePromo(promo)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                >
                                  {promo.isActive ? "Desactivar" : "Activar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {promoEditorOpen ? (
            <PromoEditor
              promo={editingPromo}
              citySlug={effectiveCitySlug}
              cityLabel={effectiveCityLabel}
              serviceType={serviceType}
              onCancel={() => {
                setPromoEditorOpen(false);
                setEditingPromo(null);
              }}
              onSaved={async () => {
                setPromoEditorOpen(false);
                setEditingPromo(null);
                await loadPromos();
              }}
            />
          ) : null}
        </div>
      ) : null}

      {sectionTab === "SETTLEMENTS" ? (
        <StoreSettlementsTab />
      ) : null}

      {selectedId ? (
        <StoreDetailsModal
          storeId={selectedId}
          mode="edit"
          onClose={() => setSelectedId(null)}
          onSaved={() => load()}
          onDeactivated={() => load()}
        />
      ) : null}

      {createOpen ? (
        <StoreDetailsModal
          storeId={null}
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            setUiQuery((s) => ({ ...s, page: 1 }));
            load();
          }}
          onDeactivated={() => {}}
        />
      ) : null}
    </div>
  );
}
