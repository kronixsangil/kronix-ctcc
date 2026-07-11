//app\(cc)\orders\components\OrdersTable.tsx

"use client";

import {
  AdminOrderRow,
  getOrderServiceMeta,
  getWorkerTypeLabel,
} from "../lib/ordersApi";

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

export default function OrdersTable(props: {
  rows: AdminOrderRow[];
  loading?: boolean;
  selectedId?: string;
  onActions: (id: string) => void;
}) {
  const { rows, loading, selectedId, onActions } = props;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">Listado de órdenes</div>
          <div className="mt-1 text-xs text-slate-500">
            {loading ? "Cargando..." : `${rows.length} órdenes en vista`}
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1500px] text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flow</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Tiendas / origen</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const active = selectedId === r.id;
              const service = getOrderServiceMeta(r);

              return (
                <tr
                  key={r.id}
                  className={[
                    "transition hover:bg-slate-50/70",
                    active ? "bg-slate-50" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-4 font-mono text-xs text-slate-700">{r.id}</td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={[
                          "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                          service.className,
                        ].join(" ")}
                      >
                        {service.label}
                      </span>

                      {String(r.orderType ?? "").toUpperCase() === "COURIER" ? (
                        <div className="text-xs text-slate-500">
                          Worker: {getWorkerTypeLabel(r.requiredWorkerType)}
                        </div>
                      ) : null}

                      {service.key === "PACKAGE" && String(r.packageType ?? "").trim() ? (
                        <div className="text-xs text-slate-500">
                          Tipo de paquete: {r.packageType}
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {r.city ? (
                      <div>
                        <div className="font-medium text-slate-900">{r.city.name}</div>
                        <div className="text-xs text-slate-500">{r.city.department}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        statusPill(r.status),
                      ].join(" ")}
                    >
                      {String(r.status ?? "—")}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        flowPill(r.flowStatus),
                      ].join(" ")}
                    >
                      {String(r.flowStatus ?? "—")}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        paymentPill(r.paymentStatus),
                      ].join(" ")}
                    >
                      {String(r.paymentStatus ?? "—")}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-900">
                    {formatCOP(r.totalCOP)}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    <div className="max-w-[260px] whitespace-normal">
                      {String(r.orderType ?? "").toUpperCase() === "COURIER"
                        ? r.pickupPlaceName || r.pickupAddress || "—"
                        : r.storeSummary || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    <div className="max-w-[220px] whitespace-normal">{r.driverSummary || "—"}</div>
                  </td>

                  <td className="px-4 py-4 text-slate-700">{formatDate(r.createdAt)}</td>

                  <td className="px-4 py-4 text-right">
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
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
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