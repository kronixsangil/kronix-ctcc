//app\(cc)\orders\components\OrderFilters.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

export type OrdersFiltersValue = {
  q: string;
  status: string;
  flowStatus: string;
  paymentStatus: string;
  from: string;
  to: string;
  store: string;
  driver: string;
  city: string;
};

export default function OrdersFilters(props: {
  value: OrdersFiltersValue;
  onChange: (v: OrdersFiltersValue) => void;
  loading?: boolean;
  onClear?: () => void;
}) {
  const { value, onChange, onClear, loading } = props;

  const [local, setLocal] = useState<OrdersFiltersValue>(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(local)]);

  const flowOptions = useMemo(
    () => [
      { v: "", l: "Flow (flowStatus)" },
      { v: "WAITING_CONFIRMATION", l: "WAITING_CONFIRMATION" },
      { v: "STORE_CONFIRMED", l: "STORE_CONFIRMED" },
      { v: "PAYMENT_PENDING", l: "PAYMENT_PENDING" },
      { v: "PREPARING", l: "PREPARING" },
      { v: "EN_ROUTE", l: "EN_ROUTE" },
      { v: "DELIVERED", l: "DELIVERED" },
      { v: "CANCELLED", l: "CANCELLED" },
      { v: "PAYMENT_FAILED", l: "PAYMENT_FAILED" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { v: "", l: "Estado (status)" },
      { v: "AVAILABLE", l: "AVAILABLE" },
      { v: "ASSIGNED", l: "ASSIGNED" },
      { v: "EN_ROUTE", l: "EN_ROUTE" },
      { v: "DELIVERED", l: "DELIVERED" },
      { v: "CANCELLED", l: "CANCELLED" },
    ],
    []
  );

  const payOptions = useMemo(
    () => [
      { v: "", l: "Pago (paymentStatus)" },
      { v: "PENDING", l: "PENDING" },
      { v: "PAID", l: "PAID" },
      { v: "FAILED", l: "FAILED" },
    ],
    []
  );

  const inputBase =
    "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200";

  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <input
            className={inputBase}
            placeholder="Buscar (id, customer, teléfono, etc.)"
            value={local.q}
            onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-2">
          <select
            className={inputBase}
            value={local.status}
            onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
            disabled={!!loading}
          >
            {statusOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            className={inputBase}
            value={local.flowStatus}
            onChange={(e) => setLocal((s) => ({ ...s, flowStatus: e.target.value }))}
            disabled={!!loading}
          >
            {flowOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            className={inputBase}
            value={local.paymentStatus}
            onChange={(e) => setLocal((s) => ({ ...s, paymentStatus: e.target.value }))}
            disabled={!!loading}
          >
            {payOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <input
            className={inputBase}
            placeholder="Store (código o nombre)"
            value={local.store}
            onChange={(e) => setLocal((s) => ({ ...s, store: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-3">
          <input
            className={inputBase}
            placeholder="Driver (id / nombre / placa)"
            value={local.driver}
            onChange={(e) => setLocal((s) => ({ ...s, driver: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-2">
          <input
            className={inputBase}
            type="date"
            value={local.from}
            onChange={(e) => setLocal((s) => ({ ...s, from: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-2">
          <input
            className={inputBase}
            type="date"
            value={local.to}
            onChange={(e) => setLocal((s) => ({ ...s, to: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-3">
          <input
            className={inputBase}
            placeholder="Ciudad (opcional)"
            value={local.city}
            onChange={(e) => setLocal((s) => ({ ...s, city: e.target.value }))}
            disabled={!!loading}
          />
        </div>

        <div className="lg:col-span-2 lg:col-start-11">
          <button
            onClick={() => onClear?.()}
            className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
            disabled={!!loading || !onClear}
            title={onClear ? "Limpiar filtros" : "onClear no fue provisto"}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">Los filtros se aplican automáticamente.</p>
    </div>
  );
}