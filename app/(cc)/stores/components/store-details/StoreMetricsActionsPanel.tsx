// app/(cc)/stores/components/store-details/StoreMetricsActionsPanel.tsx
"use client";

import { formatCOP } from "@/lib/format";
import { AdminStoreMetrics } from "../../lib/storesApi";

type Props = {
  mode: "create" | "edit";
  metrics: AdminStoreMetrics | null;
  saving: boolean;
  loading: boolean;
  citiesLoading: boolean;
  deleting: boolean;
  onSave: () => void | Promise<void>;
  onDeactivate: () => void | Promise<void>;
};

export default function StoreMetricsActionsPanel({
  mode,
  metrics,
  saving,
  loading,
  citiesLoading,
  deleting,
  onSave,
  onDeactivate,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Métricas de hoy
        </div>

        <div className="p-4 text-sm">
          {mode === "edit" ? (
            metrics ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Órdenes</div>
                  <div className="font-semibold">{metrics.ordersCount}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Ventas</div>
                  <div className="font-semibold">{formatCOP(metrics.salesCOP)}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Comisión</div>
                  <div className="font-semibold">{formatCOP(metrics.commissionCOP)}</div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500">Fecha: {metrics.date}</div>
              </div>
            ) : (
              <div className="text-slate-500">Cargando métricas...</div>
            )
          ) : (
            <div className="text-slate-500">Disponible después de crear.</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Acciones
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={onSave}
            disabled={saving || loading || citiesLoading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Guardando..." : mode === "create" ? "Crear tienda" : "Guardar cambios"}
          </button>

          {mode === "edit" ? (
            <button
              onClick={onDeactivate}
              disabled={deleting || loading}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              {deleting ? "Desactivando..." : "Desactivar tienda"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Guía rápida Buyer
        </div>

        <div className="p-4 text-sm text-slate-600 space-y-2">
          <div>
            <b>Ciudad:</b> define en qué mercado aparecerá la tienda.
          </div>
          <div>
            <b>Recomendada Buyer:</b> controla si aparece en Recomendados.
          </div>
          <div>
            <b>Orden recomendado:</b> menor número = aparece primero.
          </div>
          <div>
            <b>Título/Subtítulo override:</b> sobreescribe texto de la tarjeta.
          </div>
          <div>
            <b>Orden imágenes:</b> ejemplo <code>image,image3,image2,image4</code>.
          </div>
          <div>
            <b>Sticker emoji:</b> ejemplo 🐾 👜 💊
          </div>
        </div>
      </div>
    </div>
  );
}
