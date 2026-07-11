"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StoresFilters from "./StoresFilters";
import StoresTable from "./StoresTable";
import StoreDetailsModal from "./StoreDetailsModal";
import StoreSettlementsTab from "./StoreSettlementsTab";
import BuyerCategoriesCard from "./BuyerCategoriesCard";
import { useCtccCity } from "../../components/CtccCityContext";
import {
  AdminCityItem,
  AdminStoreListItem,
  StoreStatusFilter,
  adminListCities,
  adminListStores,
} from "../lib/storesApi";

type QueryState = {
  q: string;
  status: StoreStatusFilter;
  citySlug: string;
  page: number;
  limit: number;
};

type StoresSectionTab = "STORES" | "BUYER_CATEGORIES" | "SETTLEMENTS";

const DEFAULT_QUERY: QueryState = {
  q: "",
  status: "ALL",
  citySlug: "",
  page: 1,
  limit: 10,
};

function KpiCard({
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

export default function StoresTab() {
  const { isGlobal, citySlug: globalCitySlug } = useCtccCity();

  const [sectionTab, setSectionTab] = useState<StoresSectionTab>("STORES");
  const [uiQuery, setUiQuery] = useState<QueryState>(DEFAULT_QUERY);
  const [appliedQuery, setAppliedQuery] = useState<QueryState>(DEFAULT_QUERY);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cities, setCities] = useState<AdminCityItem[]>([]);
  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const count = items.filter(
      (item) =>
        String((item as any).storePayoutInfoStatus ?? "").toUpperCase() === "PENDING"
    ).length;

    window.dispatchEvent(
      new CustomEvent("kronix:stores-payment-pending-count", {
        detail: { count },
      })
    );
  }, [items]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setAppliedQuery(uiQuery), 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [uiQuery]);

  useEffect(() => {
    setUiQuery((previous) => {
      const nextCitySlug = isGlobal ? "" : globalCitySlug;
      if (previous.citySlug === nextCitySlug) return previous;
      return { ...previous, citySlug: nextCitySlug, page: 1 };
    });
  }, [globalCitySlug, isGlobal]);

  async function loadCities() {
    setCitiesLoading(true);

    try {
      const response = await adminListCities({
        status: "ACTIVE",
        page: 1,
        limit: 100,
      });

      setCities(Array.isArray(response?.items) ? response.items : []);
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
      const response = await adminListStores(appliedQuery);
      setItems(response.items);
      setTotal(response.total);
    } catch (e: any) {
      setError(e?.message || "Error cargando tiendas");
    } finally {
      setLoading(false);
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

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / (appliedQuery.limit || 10))),
    [total, appliedQuery.limit]
  );

  const selectedCity = useMemo(() => {
    const slug = isGlobal ? appliedQuery.citySlug : globalCitySlug;
    if (!slug) return null;
    return cities.find((city) => city.slug === slug) ?? null;
  }, [cities, appliedQuery.citySlug, globalCitySlug, isGlobal]);

  const effectiveCitySlug = isGlobal ? appliedQuery.citySlug : globalCitySlug;
  const effectiveCityLabel = selectedCity
    ? `${selectedCity.name}, ${selectedCity.department}`
    : isGlobal
      ? "Vista Global"
      : "Ciudad activa";

  const activeCount = items.filter((item) => item.isActive && !item.isPaused).length;
  const pausedCount = items.filter((item) => item.isActive && item.isPaused).length;
  const recommendedCount = items.filter((item) => item.isBuyerRecommended).length;

  return (
    <div className="space-y-2">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Gestión de Tiendas
              </h1>
              
            </div>

            {sectionTab === "STORES" ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                + Nueva tienda
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {sectionTab === "STORES" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tiendas en vista"
            value={loading ? "..." : items.length}
            hint={selectedCity ? `Resultado actual para ${selectedCity.name}` : "Resultado según filtros"}
          />
          <KpiCard label="Activas" value={loading ? "..." : activeCount} hint="Operando normalmente" />
          <KpiCard label="Pausadas" value={loading ? "..." : pausedCount} hint="Temporalmente fuera de operación" />
          <KpiCard label="Recomendadas" value={loading ? "..." : recommendedCount} hint="Con visibilidad especial en Buyer" />
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 md:p-5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tiendas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Este módulo contiene únicamente funciones propias de Tienda en Línea.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: "STORES", label: "Tiendas" },
              { key: "BUYER_CATEGORIES", label: "Categorías Buyer" },
              { key: "SETTLEMENTS", label: "Pagos y conciliaciones" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSectionTab(tab.key as StoresSectionTab)}
                className={[
                  "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                  sectionTab === tab.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
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
      </section>

      {sectionTab === "STORES" ? (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Listado de tiendas</div>
                <div className="mt-1 text-xs text-slate-500">
                  {loading ? "Cargando..." : `${items.length} en vista · ${total} total · ${effectiveCityLabel}`}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Actualizando..." : "⟳ Actualizar"}
                </button>

                <button
                  type="button"
                  disabled={appliedQuery.page <= 1 || loading}
                  onClick={() =>
                    setUiQuery((state) => ({
                      ...state,
                      page: Math.max(1, state.page - 1),
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                >
                  ←
                </button>

                <div className="text-sm text-slate-600">
                  Página <span className="font-semibold text-slate-900">{appliedQuery.page}</span> / {pageCount}
                </div>

                <button
                  type="button"
                  disabled={appliedQuery.page >= pageCount || loading}
                  onClick={() =>
                    setUiQuery((state) => ({
                      ...state,
                      page: Math.min(pageCount, state.page + 1),
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
              <StoresTable items={items} loading={loading} onOpen={setSelectedId} />
            </div>
          </div>
        </section>
      ) : null}

      {sectionTab === "BUYER_CATEGORIES" ? (
        effectiveCitySlug ? (
          <BuyerCategoriesCard citySlug={effectiveCitySlug} cityLabel={effectiveCityLabel} />
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
            Selecciona una ciudad desde el selector superior para gestionar Categorías Buyer.
          </div>
        )
      ) : null}

      {sectionTab === "SETTLEMENTS" ? <StoreSettlementsTab /> : null}

      {selectedId ? (
        <StoreDetailsModal
          storeId={selectedId}
          mode="edit"
          onClose={() => setSelectedId(null)}
          onSaved={load}
          onDeactivated={load}
        />
      ) : null}

      {createOpen ? (
        <StoreDetailsModal
          storeId={null}
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            setUiQuery((state) => ({ ...state, page: 1 }));
            load();
          }}
          onDeactivated={() => {}}
        />
      ) : null}
    </div>
  );
}
