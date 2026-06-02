// app/(cc)/stores/components/StoreDetailsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  AdminCityItem,
  AdminCreateStoreInput,
  AdminStoreDetails,
  AdminStoreMetrics,
  StorePremiumTier,
  adminCreateStore,
  adminDeactivateStore,
  adminGetStore,
  adminGetStoreMetricsToday,
  adminListCities,
  adminUpdateStore,
} from "../lib/storesApi";

import StoreOnboardingTab from "./store-details/StoreOnboardingTab";
import StorePlanOperationTab from "./store-details/StorePlanOperationTab";
import StorePermissionsTab from "./store-details/StorePermissionsTab";
import StoreProductsTab from "./store-details/StoreProductsTab";
import StoreMetricsActionsPanel from "./store-details/StoreMetricsActionsPanel";

type Props = {
  storeId: string | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: () => void;
  onDeactivated: () => void;
};

type DetailsTab = "ONBOARDING" | "PLAN" | "PERMISSIONS" | "PRODUCTS";

function overlayClose(e: MouseEvent<HTMLDivElement>, onClose: () => void) {
  if (e.target === e.currentTarget) onClose();
}

const emptyCreate: AdminCreateStoreInput & Record<string, any> = {
  citySlug: "",
  storeCode: "",
  name: "",
  legalName: "",
  nit: "",
  businessEmail: "",
  address: "",
  addressReference: "",
  lat: 0,
  lng: 0,
  mainEntranceLat: "",
  mainEntranceLng: "",
  pickupLat: "",
  pickupLng: "",
  category: "General",
  description: "",
  etaMin: 10,
  etaMax: 25,
  cel1: "",
  cel2: "",
  hrOp: "",
  hrCl: "",
  image: "",
  image2: "",
  image3: "",
  image4: "",
  coverImage: "",
  primaryColor: "",
  secondaryColor: "",
  onboardingStep: 1,
  onboardingCompleted: false,
};

function pctFromBps(bps: number) {
  const n = Number(bps);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

function bpsFromPct(pct: any) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

function prettyTier(t: StorePremiumTier) {
  if (t === "PREMIUM_PLUS") return "Premium+";
  if (t === "PREMIUM") return "Premium";
  return "Standard";
}

function storeStatusLabel(s: AdminStoreDetails) {
  if (!s.isActive) return "INACTIVA";
  if (s.isPaused) return "PAUSADA";
  return "ACTIVA";
}

function storeStatusPill(s: AdminStoreDetails) {
  if (!s.isActive) return "bg-slate-100";
  if (s.isPaused) return "bg-amber-50";
  return "bg-emerald-50";
}

function storeStatusText(s: AdminStoreDetails) {
  if (!s.isActive) return "text-slate-700";
  if (s.isPaused) return "text-amber-800";
  return "text-emerald-700";
}

function nullableText(value: any) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function nullableNumber(value: any) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeStep(value: any) {
  const n = Math.round(Number(value ?? 1));
  return Number.isFinite(n) ? Math.max(1, n) : 1;
}

function DetailsTabButton({
  active,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="text-sm font-black">{label}</div>
      <div
        className={[
          "mt-1 text-[11px] font-semibold",
          active ? "text-slate-300" : "text-slate-500",
        ].join(" ")}
      >
        {helper}
      </div>
    </button>
  );
}

export default function StoreDetailsModal({
  storeId,
  mode,
  onClose,
  onSaved,
  onDeactivated,
}: Props) {
  const [activeTab, setActiveTab] = useState<DetailsTab>("ONBOARDING");

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [store, setStore] = useState<AdminStoreDetails | null>(null);
  const [metrics, setMetrics] = useState<AdminStoreMetrics | null>(null);

  const [form, setForm] = useState<any>(
    mode === "create"
      ? {
          ...emptyCreate,
          isActive: true,
          isPaused: false,
          pausedReason: "",
          commissionRatePct: 8,
          premiumTier: "STANDARD",
          autoDecisionMode: "AUTO_REJECT",
          autoDecisionMinutes: 5,
          isBuyerRecommended: false,
          buyerRecommendedOrder: "",
          buyerCardTitleOverride: "",
          buyerCardSubtitleOverride: "",
          buyerCardBadgeText: "",
          buyerCardDistanceText: "",
          buyerCardRatingText: "",
          buyerCardStickerEmoji: "",
          buyerCardImageOrder: "",

          productsFeatureEnabled: true,
          storeAppCanManageProducts: true,
          storeAppCanCreateProducts: true,
          storeAppCanEditProducts: true,
          storeAppCanDeleteProducts: true,
          storeAppCanChangeProductPrices: true,
          storeAppCanUploadProductImages: true,
          storeAppCanUseProductCamera: true,
          storeAppCanImportProductsCsv: true,
          storeAppCanToggleProductActive: true,
          storeAppCanToggleProductAvailable: true,
        }
      : null
  );

  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cities, setCities] = useState<AdminCityItem[]>([]);

  const title = useMemo(() => {
    return mode === "create" ? "Nueva tienda" : `Tienda ${store?.storeCode ?? ""}`;
  }, [mode, store?.storeCode]);

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
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      const [s, m] = await Promise.all([
        adminGetStore(storeId),
        adminGetStoreMetricsToday(storeId),
      ]);

      setStore(s);
      setMetrics(m);

      const storeAny = s as any;

      setForm({
        citySlug: s.city?.slug ?? "",
        storeCode: s.storeCode,

        name: s.name,
        legalName: storeAny.legalName ?? "",
        nit: storeAny.nit ?? "",
        businessEmail: storeAny.businessEmail ?? "",

        address: s.address,
        addressReference: storeAny.addressReference ?? "",

        lat: s.lat,
        lng: s.lng,
        mainEntranceLat: storeAny.mainEntranceLat ?? "",
        mainEntranceLng: storeAny.mainEntranceLng ?? "",
        pickupLat: storeAny.pickupLat ?? "",
        pickupLng: storeAny.pickupLng ?? "",

        category: s.category,
        description: s.description,
        etaMin: s.etaMin,
        etaMax: s.etaMax,
        cel1: s.cel1 ?? "",
        cel2: s.cel2 ?? "",
        hrOp: s.hrOp ?? "",
        hrCl: s.hrCl ?? "",

        image: s.image ?? "",
        image2: s.image2 ?? "",
        image3: s.image3 ?? "",
        image4: s.image4 ?? "",
        coverImage: storeAny.coverImage ?? "",
        primaryColor: storeAny.primaryColor ?? "",
        secondaryColor: storeAny.secondaryColor ?? "",

        onboardingStep: storeAny.onboardingStep ?? 1,
        onboardingCompleted: Boolean(storeAny.onboardingCompleted),

        isActive: s.isActive,
        isPaused: Boolean(s.isPaused),
        pausedReason: s.pausedReason ?? "",
        commissionRatePct: pctFromBps(s.commissionRateBps),
        premiumTier: s.premiumTier ?? "STANDARD",
        autoDecisionMode: s.autoDecisionMode,
        autoDecisionMinutes: s.autoDecisionMinutes,
        isBuyerRecommended: Boolean(s.isBuyerRecommended),
        buyerRecommendedOrder: s.buyerRecommendedOrder ?? "",
        buyerCardTitleOverride: s.buyerCardTitleOverride ?? "",
        buyerCardSubtitleOverride: s.buyerCardSubtitleOverride ?? "",
        buyerCardBadgeText: s.buyerCardBadgeText ?? "",
        buyerCardDistanceText: s.buyerCardDistanceText ?? "",
        buyerCardRatingText: s.buyerCardRatingText ?? "",
        buyerCardStickerEmoji: s.buyerCardStickerEmoji ?? "",
        buyerCardImageOrder: s.buyerCardImageOrder ?? "",

        productsFeatureEnabled: Boolean(storeAny.productsFeatureEnabled ?? true),
        storeAppCanManageProducts: Boolean(storeAny.storeAppCanManageProducts ?? true),
        storeAppCanCreateProducts: Boolean(storeAny.storeAppCanCreateProducts ?? true),
        storeAppCanEditProducts: Boolean(storeAny.storeAppCanEditProducts ?? true),
        storeAppCanDeleteProducts: Boolean(storeAny.storeAppCanDeleteProducts ?? true),
        storeAppCanChangeProductPrices: Boolean(storeAny.storeAppCanChangeProductPrices ?? true),
        storeAppCanUploadProductImages: Boolean(storeAny.storeAppCanUploadProductImages ?? true),
        storeAppCanUseProductCamera: Boolean(storeAny.storeAppCanUseProductCamera ?? true),
        storeAppCanImportProductsCsv: Boolean(storeAny.storeAppCanImportProductsCsv ?? true),
        storeAppCanToggleProductActive: Boolean(storeAny.storeAppCanToggleProductActive ?? true),
        storeAppCanToggleProductAvailable: Boolean(storeAny.storeAppCanToggleProductAvailable ?? true),
      });
    } catch (e: any) {
      setError(e?.message || "Error cargando tienda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (mode === "edit") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const citySlug = String(form.citySlug || "").trim();
      if (!citySlug) throw new Error("Debes seleccionar una ciudad.");

      if (mode === "create") {
        const created = await adminCreateStore({
          citySlug,
          storeCode: String(form.storeCode || "").trim(),
          name: String(form.name || "").trim(),
          legalName: nullableText(form.legalName),
          nit: nullableText(form.nit),
          businessEmail: nullableText(form.businessEmail),
          address: String(form.address || "").trim(),
          addressReference: nullableText(form.addressReference),
          lat: Number(form.lat),
          lng: Number(form.lng),
          mainEntranceLat: nullableNumber(form.mainEntranceLat),
          mainEntranceLng: nullableNumber(form.mainEntranceLng),
          pickupLat: nullableNumber(form.pickupLat),
          pickupLng: nullableNumber(form.pickupLng),
          category: String(form.category || "").trim(),
          description: String(form.description || "").trim(),
          etaMin: Number(form.etaMin),
          etaMax: Number(form.etaMax),
          cel1: form.cel1 ? String(form.cel1) : null,
          cel2: form.cel2 ? String(form.cel2) : null,
          hrOp: form.hrOp ? String(form.hrOp) : null,
          hrCl: form.hrCl ? String(form.hrCl) : null,
          image: form.image ? String(form.image) : null,
          image2: form.image2 ? String(form.image2) : null,
          image3: form.image3 ? String(form.image3) : null,
          image4: form.image4 ? String(form.image4) : null,
          coverImage: nullableText(form.coverImage),
          primaryColor: nullableText(form.primaryColor),
          secondaryColor: nullableText(form.secondaryColor),
          onboardingStep: safeStep(form.onboardingStep),
          onboardingCompleted: Boolean(form.onboardingCompleted),
        } as any);

        setStore(created);
        onSaved();
      } else {
        if (!storeId) return;

        const updated = await adminUpdateStore(storeId, {
          citySlug,
          name: String(form.name || "").trim(),
          legalName: nullableText(form.legalName),
          nit: nullableText(form.nit),
          businessEmail: nullableText(form.businessEmail),
          address: String(form.address || "").trim(),
          addressReference: nullableText(form.addressReference),
          lat: Number(form.lat),
          lng: Number(form.lng),
          mainEntranceLat: nullableNumber(form.mainEntranceLat),
          mainEntranceLng: nullableNumber(form.mainEntranceLng),
          pickupLat: nullableNumber(form.pickupLat),
          pickupLng: nullableNumber(form.pickupLng),
          category: String(form.category || "").trim(),
          description: String(form.description || "").trim(),
          etaMin: Number(form.etaMin),
          etaMax: Number(form.etaMax),
          cel1: form.cel1 ? String(form.cel1) : null,
          cel2: form.cel2 ? String(form.cel2) : null,
          hrOp: form.hrOp ? String(form.hrOp) : null,
          hrCl: form.hrCl ? String(form.hrCl) : null,
          image: form.image ? String(form.image) : null,
          image2: form.image2 ? String(form.image2) : null,
          image3: form.image3 ? String(form.image3) : null,
          image4: form.image4 ? String(form.image4) : null,
          coverImage: nullableText(form.coverImage),
          primaryColor: nullableText(form.primaryColor),
          secondaryColor: nullableText(form.secondaryColor),
          onboardingStep: safeStep(form.onboardingStep),
          onboardingCompleted: Boolean(form.onboardingCompleted),

          isActive: Boolean(form.isActive),
          isPaused: Boolean(form.isActive) ? Boolean(form.isPaused) : false,
          pausedReason:
            Boolean(form.isActive) && Boolean(form.isPaused)
              ? String(form.pausedReason || "").trim() || null
              : null,
          commissionRateBps: bpsFromPct(form.commissionRatePct),
          premiumTier: (form.premiumTier as StorePremiumTier) || "STANDARD",
          autoDecisionMode:
            form.autoDecisionMode === "AUTO_CONFIRM" ? "AUTO_CONFIRM" : "AUTO_REJECT",
          autoDecisionMinutes: Math.max(
            1,
            Math.round(Number(form.autoDecisionMinutes || 5))
          ),
          isBuyerRecommended: Boolean(form.isBuyerRecommended),
          buyerRecommendedOrder:
            form.buyerRecommendedOrder === "" || form.buyerRecommendedOrder === null
              ? null
              : Math.max(0, Math.round(Number(form.buyerRecommendedOrder))),
          buyerCardTitleOverride:
            String(form.buyerCardTitleOverride || "").trim() || null,
          buyerCardSubtitleOverride:
            String(form.buyerCardSubtitleOverride || "").trim() || null,
          buyerCardBadgeText: String(form.buyerCardBadgeText || "").trim() || null,
          buyerCardDistanceText:
            String(form.buyerCardDistanceText || "").trim() || null,
          buyerCardRatingText: String(form.buyerCardRatingText || "").trim() || null,
          buyerCardStickerEmoji:
            String(form.buyerCardStickerEmoji || "").trim() || null,
          buyerCardImageOrder:
            String(form.buyerCardImageOrder || "").trim() || null,

          productsFeatureEnabled: Boolean(form.productsFeatureEnabled),
          storeAppCanManageProducts: Boolean(form.storeAppCanManageProducts),
          storeAppCanCreateProducts: Boolean(form.storeAppCanCreateProducts),
          storeAppCanEditProducts: Boolean(form.storeAppCanEditProducts),
          storeAppCanDeleteProducts: Boolean(form.storeAppCanDeleteProducts),
          storeAppCanChangeProductPrices: Boolean(form.storeAppCanChangeProductPrices),
          storeAppCanUploadProductImages: Boolean(form.storeAppCanUploadProductImages),
          storeAppCanUseProductCamera: Boolean(form.storeAppCanUseProductCamera),
          storeAppCanImportProductsCsv: Boolean(form.storeAppCanImportProductsCsv),
          storeAppCanToggleProductActive: Boolean(form.storeAppCanToggleProductActive),
          storeAppCanToggleProductAvailable: Boolean(
            form.storeAppCanToggleProductAvailable
          ),
        } as any);

        setStore(updated);
        onSaved();
      }
    } catch (e: any) {
      setError(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!storeId) return;

    const ok = window.confirm("¿Desactivar esta tienda? (No se borra, solo se marca inactiva)");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await adminDeactivateStore(storeId);
      onDeactivated();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error desactivando");
    } finally {
      setDeleting(false);
    }
  }

  function renderActiveTab() {
    if (activeTab === "ONBOARDING") {
      return (
        <StoreOnboardingTab
          mode={mode}
          form={form}
          setForm={setForm}
          cities={cities}
          citiesLoading={citiesLoading}
        />
      );
    }

    if (activeTab === "PLAN") {
      return <StorePlanOperationTab mode={mode} form={form} setForm={setForm} />;
    }

    if (activeTab === "PERMISSIONS") {
      return <StorePermissionsTab mode={mode} form={form} setForm={setForm} />;
    }

    return <StoreProductsTab mode={mode} storeId={storeId} store={store} />;
  }

  return (
    <div
      onMouseDown={(e) => overlayClose(e, onClose)}
      className="fixed inset-0 z-50 bg-black/30 p-3 md:p-6"
    >
      <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 md:p-5">
          <div>
            <div className="text-sm text-slate-500">KroniX Control Center</div>
            <div className="text-lg font-semibold">{title}</div>

            {mode === "edit" && store ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span
                  className={[
                    "rounded-full px-2.5 py-1",
                    storeStatusPill(store),
                    storeStatusText(store),
                  ].join(" ")}
                >
                  estado: <b>{storeStatusLabel(store)}</b>
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  premium: <b>{prettyTier(store.premiumTier)}</b>
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  comisión: <b>{(store.commissionRateBps / 100).toFixed(2)}%</b>
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  auto: <b>{store.autoDecisionMode === "AUTO_CONFIRM" ? "ON" : "OFF"}</b>
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  min: <b>{store.autoDecisionMinutes}</b>
                </span>

                <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-fuchsia-700">
                  buyer recom.: <b>{store.isBuyerRecommended ? "Sí" : "No"}</b>
                </span>

                {store.city ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                    ciudad:{" "}
                    <b>
                      {store.city.name}, {store.city.department}
                    </b>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-4 md:p-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Cargando...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="xl:col-span-3 space-y-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <DetailsTabButton
                    active={activeTab === "ONBOARDING"}
                    label="Onboarding"
                    helper="Información y afiliación"
                    onClick={() => setActiveTab("ONBOARDING")}
                  />

                  <DetailsTabButton
                    active={activeTab === "PLAN"}
                    label="Plan y operación"
                    helper="Plan, comisión y Buyer"
                    onClick={() => setActiveTab("PLAN")}
                  />

                  <DetailsTabButton
                    active={activeTab === "PERMISSIONS"}
                    label="Permisos"
                    helper="Store App y catálogo"
                    onClick={() => setActiveTab("PERMISSIONS")}
                  />

                  <DetailsTabButton
                    active={activeTab === "PRODUCTS"}
                    label="Productos"
                    helper="Catálogo y CSV"
                    onClick={() => setActiveTab("PRODUCTS")}
                  />
                </div>

                {renderActiveTab()}
              </div>

              <StoreMetricsActionsPanel
                mode={mode}
                metrics={metrics}
                saving={saving}
                loading={loading}
                citiesLoading={citiesLoading}
                deleting={deleting}
                onSave={save}
                onDeactivate={deactivate}
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 md:p-5">
          <div className="text-xs text-slate-500">
            Tip: “Recomendada Buyer” se usa para Home → Recomendados.
          </div>
        </div>
      </div>
    </div>
  );
}
