//app\(cc)\orders\components\OrdersTab.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import OrdersFilters from "./OrdersFilters";
import OrdersTable from "./OrdersTable";
import OrderDetailsModal from "./OrderDetailsModal";
import { listAdminCities } from "@/app/(cc)/cities/lib/citiesApi";
import { useCtccCity } from "@/app/(cc)/components/CtccCityContext";
import {
  listAdminOrders,
  type AdminOrderRow,
  type OrdersCityOption,
} from "../lib/ordersApi";

const EMPTY_FILTERS = {
  q: "",
  status: "",
  flowStatus: "",
  paymentStatus: "",
  serviceType: "",
  store: "",
  driver: "",
  citySlug: "",
  from: "",
  to: "",
  page: 1,
  limit: 20,
};

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
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

export default function OrdersTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [filters, setFilters] = useState<any>(EMPTY_FILTERS);
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState<OrdersCityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reqSeq = useRef(0);

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      citySlug: effectiveCitySlug,
    }),
    [filters, effectiveCitySlug]
  );

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const res = await listAdminCities({
        q: "",
        status: "ACTIVE",
        page: 1,
        limit: 100,
      });

      setCities(
        Array.isArray(res?.items)
          ? res.items.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              department: c.department,
              country: c.country,
              isActive: c.isActive,
            }))
          : []
      );
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function load(currentFilters: any) {
    const mySeq = ++reqSeq.current;
    setLoading(true);

    try {
      const r = await listAdminOrders(currentFilters);

      if (mySeq === reqSeq.current) {
        setRows(r.items ?? []);
      }
    } finally {
      if (mySeq === reqSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (isGlobalCityLocked) {
      setFilters((prev: any) => {
        if (prev.citySlug === globalCitySlug) return prev;
        return { ...prev, citySlug: globalCitySlug, page: 1 };
      });
      return;
    }

    setFilters((prev: any) => {
      if (!prev.citySlug) return prev;
      return { ...prev, citySlug: "", page: 1 };
    });
  }, [isGlobalCityLocked, globalCitySlug]);

  useEffect(() => {
    const t = setTimeout(() => {
      load(effectiveFilters);
    }, 300);

    return () => clearTimeout(t);
  }, [
    effectiveFilters.q,
    effectiveFilters.status,
    effectiveFilters.flowStatus,
    effectiveFilters.paymentStatus,
    effectiveFilters.serviceType,
    effectiveFilters.store,
    effectiveFilters.driver,
    effectiveFilters.citySlug,
    effectiveFilters.from,
    effectiveFilters.to,
    effectiveFilters.page,
    effectiveFilters.limit,
  ]);

  const totalOrders = rows.length;
  const deliveredOrders = rows.filter((r) => String(r.flowStatus ?? "").toUpperCase() === "DELIVERED").length;
  const paidOrders = rows.filter((r) => String(r.paymentStatus ?? "").toUpperCase() === "PAID").length;
  const salesTotal = rows.reduce((acc, r) => acc + Number(r.totalCOP ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                Multi-ciudad · Operación de pedidos
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                Gestión de Órdenes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Supervisa el flujo operativo de órdenes, pagos, estado logístico y distribución
                por ciudad desde el CTCC.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  {isGlobalCityLocked
                    ? `Ciudad activa: ${cityLabel}`
                    : "Vista global: todas las ciudades"}
                </div>

                <div className="inline-flex items-center rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-400/20">
                  {loading ? "Actualizando datos..." : `${totalOrders} órdenes en vista`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCard({
          label: "Órdenes en vista",
          value: loading ? "..." : totalOrders,
          hint: isGlobalCityLocked ? `Filtrado por ${cityLabel}` : "Resultado según filtros",
        })}

        {kpiCard({
          label: "Entregadas",
          value: loading ? "..." : deliveredOrders,
          hint: "Flow status = DELIVERED",
        })}

        {kpiCard({
          label: "Pagadas",
          value: loading ? "..." : paidOrders,
          hint: "Payment status = PAID",
        })}

        {kpiCard({
          label: "Ventas en vista",
          value: loading ? "..." : formatCOP(salesTotal),
          hint: "Suma de totalCOP del resultado actual",
        })}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 flex items-center justify-between">
  <div>
    <div className="text-2xl font-semibold leading-tight text-slate-900">
      Órdenes
    </div>
    <div className="mt-1 text-sm text-slate-500">
      Los filtros se aplican automáticamente.
    </div>
  </div>

  {/* 🔄 REFRESH */}
  <button
    onClick={() => load(effectiveFilters)}
    disabled={loading}
    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
  >
    {loading ? "Actualizando..." : "⟳ Actualizar"}
  </button>
</div>

        <div className="px-4 py-4">
          <OrdersFilters
            value={effectiveFilters}
            cities={cities}
            cityLockedByGlobal={true}
            globalCityLabel={isGlobalCityLocked ? cityLabel : "Vista Global"}
            loading={loading || citiesLoading}
            onChange={(next) => {
              setFilters((prev: any) => ({
                ...prev,
                ...next,
                citySlug: effectiveCitySlug,
              }));
            }}
            onClear={() =>
              setFilters({
                ...EMPTY_FILTERS,
                citySlug: effectiveCitySlug,
              })
            }
          />
        </div>
      </div>

      <OrdersTable rows={rows} loading={loading} onActions={(id) => setSelectedId(id)} />

      {selectedId ? (
        <OrderDetailsModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={() => load(effectiveFilters)}
        />
      ) : null}
    </div>
  );
}