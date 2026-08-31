"use client";

import {
  AdminOrderRow,
  getOrderServiceMeta,
} from "../lib/ordersApi";

export type OrdersTableFilters = {
  id: string;
  serviceKey: string;
  city: string;
  status: string;
  flowStatus: string;
  paymentStatus: string;
  commission: string;
  driver: string;
  date: string;
};

function formatCOP(n?: number | null) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("es-CO");
}

function statusPill(value?: string | null) {
  const v = String(value ?? "").toUpperCase();

  if (v === "DELIVERED") return "bg-emerald-50 text-emerald-700";
  if (v === "CANCELLED") return "bg-rose-50 text-rose-700";
  if (v === "ASSIGNED") return "bg-sky-50 text-sky-700";
  if (v === "EN_ROUTE") return "bg-violet-50 text-violet-700";
  if (v === "AVAILABLE") return "bg-amber-50 text-amber-800";

  return "bg-slate-100 text-slate-700";
}

function flowPill(value?: string | null) {
  const v = String(value ?? "").toUpperCase();

  if (v === "WAITING_CONFIRMATION") return "bg-amber-50 text-amber-800";
  if (v === "STORE_CONFIRMED") return "bg-sky-50 text-sky-700";
  if (v === "PAYMENT_PENDING") return "bg-orange-50 text-orange-700";
  if (v === "PAID") return "bg-emerald-50 text-emerald-700";
  if (v === "PREPARING") return "bg-indigo-50 text-indigo-700";
  if (v === "EN_ROUTE") return "bg-violet-50 text-violet-700";
  if (v === "DELIVERED") return "bg-emerald-50 text-emerald-700";
  if (v === "CANCELLED") return "bg-rose-50 text-rose-700";
  if (v === "PAYMENT_FAILED") return "bg-rose-50 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

function paymentPill(value?: string | null) {
  const v = String(value ?? "").toUpperCase();

  if (v === "PAID") return "bg-emerald-50 text-emerald-700";
  if (v === "PENDING") return "bg-amber-50 text-amber-800";
  if (v === "FAILED") return "bg-rose-50 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function servicePillStyle(row: AdminOrderRow) {
  const snapshot = asRecord(row.serviceSnapshot);
  const definition = asRecord(snapshot?.definition) ?? snapshot;

  const primaryColor = String(definition?.primaryColor ?? "").trim();
  const accentColor = String(definition?.accentColor ?? "").trim();

  if (!primaryColor && !accentColor) return undefined;

  return {
    color: primaryColor || "#334155",
    backgroundColor: accentColor || "#F8FAFC",
    borderColor: primaryColor || "#CBD5E1",
  };
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));
}

const filterControl =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100";

export default function OrdersTable(props: {
  rows: AdminOrderRow[];
  sourceRows: AdminOrderRow[];
  loading?: boolean;
  selectedId?: string;
  filters: OrdersTableFilters;
  onFiltersChange: (next: OrdersTableFilters) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onActions: (id: string) => void;
}) {
  const {
    rows,
    sourceRows,
    loading,
    selectedId,
    filters,
    onFiltersChange,
    onClearFilters,
    onRefresh,
    onActions,
  } = props;

  const setFilter = <K extends keyof OrdersTableFilters>(
    key: K,
    value: OrdersTableFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const serviceOptions = Array.from(
    new Map(
      sourceRows.map((row) => {
        const meta = getOrderServiceMeta(row);
        return [meta.key, meta] as const;
      })
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, "es"));

  const cityOptions = uniqueOptions(
    sourceRows.map((row) =>
      row.city?.name && row.city?.department
        ? `${row.city.name}, ${row.city.department}`
        : row.city?.name
    )
  );

  const statusOptions = uniqueOptions(sourceRows.map((row) => row.status));
  const flowOptions = uniqueOptions(sourceRows.map((row) => row.flowStatus));
  const paymentOptions = uniqueOptions(
    sourceRows.map((row) => row.paymentStatus)
  );

  const hasFilters = Object.values(filters).some(
    (value) => String(value ?? "").trim() !== ""
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            Listado de órdenes
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {loading ? "Cargando..." : `${rows.length} órdenes en vista`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={loading}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Limpiar filtros
            </button>
          ) : null}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "⟳ Actualizar"}
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1320px] text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-[170px] px-3 pb-2 pt-3">ID</th>
              <th className="w-[190px] px-3 pb-2 pt-3">Servicio</th>
              <th className="w-[190px] px-3 pb-2 pt-3">Ciudad</th>
              <th className="w-[120px] px-3 pb-2 pt-3">Status</th>
              <th className="w-[170px] px-3 pb-2 pt-3">Flow</th>
              <th className="w-[95px] px-3 pb-2 pt-3">Pago</th>
              <th className="w-[105px] px-3 pb-2 pt-3 text-right">Comisión</th>
              <th className="w-[220px] px-3 pb-2 pt-3">Driver</th>
              <th className="w-[185px] px-3 pb-2 pt-3">Fecha</th>
              <th className="w-[110px] px-3 pb-2 pt-3 text-right">Acciones</th>
            </tr>

            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-3 pb-3">
                <input
                  className={filterControl}
                  placeholder="ID..."
                  value={filters.id}
                  onChange={(e) => setFilter("id", e.target.value)}
                />
              </th>

              <th className="px-3 pb-3">
                <select
                  className={filterControl}
                  value={filters.serviceKey}
                  onChange={(e) => setFilter("serviceKey", e.target.value)}
                >
                  <option value="">Todos</option>
                  {serviceOptions.map((service) => (
                    <option key={service.key} value={service.key}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </th>

              <th className="px-3 pb-3">
                <select
                  className={filterControl}
                  value={filters.city}
                  onChange={(e) => setFilter("city", e.target.value)}
                >
                  <option value="">Todas</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </th>

              <th className="px-3 pb-3">
                <select
                  className={filterControl}
                  value={filters.status}
                  onChange={(e) => setFilter("status", e.target.value)}
                >
                  <option value="">Todos</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </th>

              <th className="px-3 pb-3">
                <select
                  className={filterControl}
                  value={filters.flowStatus}
                  onChange={(e) => setFilter("flowStatus", e.target.value)}
                >
                  <option value="">Todos</option>
                  {flowOptions.map((flow) => (
                    <option key={flow} value={flow}>
                      {flow}
                    </option>
                  ))}
                </select>
              </th>

              <th className="px-3 pb-3">
                <select
                  className={filterControl}
                  value={filters.paymentStatus}
                  onChange={(e) => setFilter("paymentStatus", e.target.value)}
                >
                  <option value="">Todos</option>
                  {paymentOptions.map((payment) => (
                    <option key={payment} value={payment}>
                      {payment}
                    </option>
                  ))}
                </select>
              </th>

              <th className="px-3 pb-3">
                <input
                  className={filterControl}
                  placeholder="$..."
                  inputMode="numeric"
                  value={filters.commission}
                  onChange={(e) =>
                    setFilter(
                      "commission",
                      e.target.value.replace(/[^\d]/g, "")
                    )
                  }
                />
              </th>

              <th className="px-3 pb-3">
                <input
                  className={filterControl}
                  placeholder="Driver..."
                  value={filters.driver}
                  onChange={(e) => setFilter("driver", e.target.value)}
                />
              </th>

              <th className="px-3 pb-3">
                <input
                  type="date"
                  className={filterControl}
                  value={filters.date}
                  onChange={(e) => setFilter("date", e.target.value)}
                />
              </th>

              <th className="px-3 pb-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const active = selectedId === r.id;
              const service = getOrderServiceMeta(r);
              const dynamicStyle = servicePillStyle(r);

              return (
                <tr
                  key={r.id}
                  className={[
                    "transition hover:bg-slate-50/70",
                    active ? "bg-slate-50" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-4 font-mono text-xs text-slate-700">
                    {r.id}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      style={dynamicStyle}
                      className={[
                        "inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
                        dynamicStyle ? "" : service.className,
                      ].join(" ")}
                    >
                      {service.label}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    {r.city ? (
                      <span className="whitespace-nowrap font-medium text-slate-900">
                        {r.city.name}, {r.city.department}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusPill(r.status),
                      ].join(" ")}
                    >
                      {String(r.status ?? "—")}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        flowPill(r.flowStatus),
                      ].join(" ")}
                    >
                      {String(r.flowStatus ?? "—")}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        paymentPill(r.paymentStatus),
                      ].join(" ")}
                    >
                      {String(r.paymentStatus ?? "—")}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-right font-semibold text-slate-900">
                    {formatCOP(r.workerCommissionCOP)}
                  </td>

                  <td className="px-3 py-4 text-slate-700">
                    <div className="max-w-[220px] whitespace-normal">
                      {r.driverSummary || "—"}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-slate-700">
                    {formatDate(r.createdAt)}
                  </td>

                  <td className="px-3 py-4 text-right">
                    <button
                      onClick={() => onActions(r.id)}
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:translate-y-[1px]"
                    >
                      Acciones
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No hay órdenes con esos filtros.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
