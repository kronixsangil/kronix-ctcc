//app\(cc)\orders\components\OrderDetailsPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

function formatCOP(n: number) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export type AdminOrderDetails = {
  id: string;
  status?: string;
  flowStatus?: string;
  paymentStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;

  totals?: {
    totalCOP?: number;
    storesSubtotalCOP?: number;
    deliveryFeeCOP?: number;
    serviceFeeCOP?: number;
    promoCOP?: number;
    tipCOP?: number;
  };

  timeline?: Array<{ at: string; title: string; meta?: string }>;

  metrics?: {
    prepMinutes?: number | null;
    deliveryMinutes?: number | null;
    platformCommissionCOP?: number | null;
    platformRevenueNetCOP?: number | null;
  };
};

export default function OrderDetailsPanel({
  orderId,
  loading,
  details,
  onClose,
  onRefresh,
}: {
  orderId: string;
  loading?: boolean;
  details: AdminOrderDetails | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);

  const header = useMemo(() => {
    if (!orderId) return "Selecciona una orden";
    return `Orden ${orderId}`;
  }, [orderId]);

  async function cancelOrder() {
    if (!orderId) return;
    const ok = confirm("¿Cancelar esta orden manualmente?");
    if (!ok) return;

    setActionLoading(true);
    try {
      // ✅ asumiendo: POST /admin/orders/:id/cancel
      await apiFetch(`/admin/orders/${orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "MANUAL_CANCEL" }),
      } as any);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  }

  async function reassignDriver() {
    if (!orderId) return;
    const driverId = prompt("Nuevo driverId (cuid):");
    if (!driverId) return;

    setActionLoading(true);
    try {
      // ✅ asumiendo: POST /admin/orders/:id/reassign-driver
      await apiFetch(`/admin/orders/${orderId}/reassign-driver`, {
        method: "POST",
        body: JSON.stringify({ driverId }),
      } as any);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b p-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-500">KroniX Control Center</div>
          <div className="truncate text-base font-semibold text-slate-900">{header}</div>
          {details ? (
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1">status: {details.status ?? "—"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">flow: {details.flowStatus ?? "—"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">pay: {details.paymentStatus ?? "—"}</span>
            </div>
          ) : null}
        </div>

        <button
          className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!orderId ? (
          <div className="text-sm text-slate-500">Selecciona una orden para ver detalles.</div>
        ) : loading ? (
          <div className="text-sm text-slate-500">Cargando detalle…</div>
        ) : !details ? (
          <div className="text-sm text-slate-500">No hay detalle disponible.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Totales */}
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Totales</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-600">Subtotal tiendas</div>
                <div className="text-right">{formatCOP(details.totals?.storesSubtotalCOP ?? 0)}</div>

                <div className="text-slate-600">Domicilio</div>
                <div className="text-right">{formatCOP(details.totals?.deliveryFeeCOP ?? 0)}</div>

                <div className="text-slate-600">Service fee</div>
                <div className="text-right">{formatCOP(details.totals?.serviceFeeCOP ?? 0)}</div>

                <div className="text-slate-600">Promo</div>
                <div className="text-right">-{formatCOP(details.totals?.promoCOP ?? 0)}</div>

                <div className="text-slate-600">Propina</div>
                <div className="text-right">{formatCOP(details.totals?.tipCOP ?? 0)}</div>

                <div className="border-t pt-2 font-semibold text-slate-900">Total</div>
                <div className="border-t pt-2 text-right font-semibold text-slate-900">
                  {formatCOP(details.totals?.totalCOP ?? 0)}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-slate-900">Timeline</div>
              <div className="mt-3 space-y-2">
                {(details.timeline ?? []).length === 0 ? (
                  <div className="text-sm text-slate-500">Sin eventos.</div>
                ) : (
                  (details.timeline ?? []).map((t, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3 border">
                      <div className="text-xs text-slate-500">{new Date(t.at).toLocaleString("en-US")}</div>
                      <div className="text-sm font-medium text-slate-900">{t.title}</div>
                      {t.meta ? <div className="text-xs text-slate-600 mt-1">{t.meta}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-slate-900">Métricas</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-600">Prep time</div>
                <div className="text-right">{details.metrics?.prepMinutes ?? "—"} min</div>

                <div className="text-slate-600">Delivery time</div>
                <div className="text-right">{details.metrics?.deliveryMinutes ?? "—"} min</div>

                <div className="text-slate-600">Comisión plataforma</div>
                <div className="text-right">{formatCOP(details.metrics?.platformCommissionCOP ?? 0)}</div>

                <div className="text-slate-600">Ganancia neta</div>
                <div className="text-right">{formatCOP(details.metrics?.platformRevenueNetCOP ?? 0)}</div>
              </div>
            </div>

            {/* Acciones */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-slate-900">Acciones</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  onClick={onRefresh}
                  disabled={actionLoading}
                >
                  Refrescar
                </button>
                <button
                  className="h-10 rounded-xl bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  onClick={cancelOrder}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  onClick={reassignDriver}
                  disabled={actionLoading}
                >
                  Reasignar driver
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                (Si tus endpoints tienen nombres distintos, dime los paths y lo adapto en 30 segundos.)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}