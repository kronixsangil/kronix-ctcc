//app\(cc)\orders\components\OrdersFilters.tsx
"use client";

import type { OrdersCityOption } from "../lib/ordersApi";

export type OrdersFiltersValue = {
  q: string;
  status: string;
  flowStatus: string;
  paymentStatus: string;
  serviceType: string;
  from: string;
  to: string;
  store: string;
  driver: string;
  citySlug: string;
  page: number;
  limit: number;
};

export default function OrdersFilters({
  value,
  cities,
  cityLockedByGlobal,
  globalCityLabel,
  onChange,
  loading,
  onClear,
}: {
  value: OrdersFiltersValue;
  cities: OrdersCityOption[];
  cityLockedByGlobal?: boolean;
  globalCityLabel?: string;
  onChange: (v: OrdersFiltersValue) => void;
  loading?: boolean;
  onClear?: () => void;
}) {
  const clear = () => {
    if (onClear) return onClear();

    onChange({
      q: "",
      status: "",
      flowStatus: "",
      paymentStatus: "",
      serviceType: "",
      from: "",
      to: "",
      store: "",
      driver: "",
      citySlug: "",
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buscar
          </label>
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            placeholder="ID, cliente, teléfono, tienda, dirección..."
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ciudad
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-100"
            value={value.citySlug}
            disabled
            onChange={() => {}}
          >
            {!value.citySlug ? (
              <option value="">{globalCityLabel || "Vista Global"}</option>
            ) : null}

            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.department}
              </option>
            ))}
          </select>

          <div className="mt-2 text-[11px] text-slate-500">
            {cityLockedByGlobal
              ? "La ciudad está siendo controlada desde el selector global del CTCC."
              : "Vista global activa desde el selector del CTCC."}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Flow
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.flowStatus}
            onChange={(e) => onChange({ ...value, flowStatus: e.target.value, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="WAITING_CONFIRMATION">WAITING_CONFIRMATION</option>
            <option value="STORE_CONFIRMED">STORE_CONFIRMED</option>
            <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
            <option value="PAID">PAID</option>
            <option value="PREPARING">PREPARING</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pago
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.paymentStatus}
            onChange={(e) => onChange({ ...value, paymentStatus: e.target.value, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Servicio
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.serviceType}
            onChange={(e) => onChange({ ...value, serviceType: e.target.value, page: 1 })}
          >
            <option value="">Todos</option>
            <option value="STORE">Tienda en línea</option>
            <option value="PICKUP_AND_DELIVERY">Domicilio Express</option>
            <option value="SEND_PACKAGE">KroniX Envíos</option>
            <option value="ERRAND">Domicilios y Diligencias</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fecha desde
          </label>
          <input
            type="date"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value, page: 1 })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fecha hasta
          </label>
          <input
            type="date"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value, page: 1 })}
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tienda
          </label>
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            placeholder="Store code o nombre"
            value={value.store}
            onChange={(e) => onChange({ ...value, store: e.target.value, page: 1 })}
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Driver
          </label>
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            placeholder="ID, nombre o placa"
            value={value.driver}
            onChange={(e) => onChange({ ...value, driver: e.target.value, page: 1 })}
          />
        </div>

        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            En vista
          </label>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            value={value.limit}
            onChange={(e) => onChange({ ...value, limit: Number(e.target.value), page: 1 })}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="md:col-span-1 flex md:justify-end">
          <button
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={clear}
            disabled={!!loading}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        {loading
          ? "Cargando órdenes..."
          : "Los filtros se aplican automáticamente. La ciudad está gobernada por el selector global del CTCC."}
      </div>
    </div>
  );
}