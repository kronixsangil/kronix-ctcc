// app/(cc)/stores/components/StoresTable.tsx
"use client";

import { formatCOP } from "@/lib/format";
import type { AdminStoreListItem } from "../lib/storesApi";

type Props = {
  items: AdminStoreListItem[];
  loading: boolean;
  onOpen: (id: string) => void;
};

function statusPill(s: AdminStoreListItem) {
  if (!s.isActive) {
    return "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700";
  }
  if (s.isPaused) {
    return "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800";
  }
  return "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700";
}

function statusLabel(s: AdminStoreListItem) {
  if (!s.isActive) return "Inactiva";
  if (s.isPaused) return "Pausada";
  return "Activa";
}

function premiumPill(tier: AdminStoreListItem["premiumTier"]) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (tier === "PREMIUM_PLUS") return `${base} bg-indigo-50 text-indigo-700`;
  if (tier === "PREMIUM") return `${base} bg-violet-50 text-violet-700`;
  return `${base} bg-slate-100 text-slate-700`;
}

function tierLabel(tier: AdminStoreListItem["premiumTier"]) {
  if (tier === "PREMIUM_PLUS") return "Premium+";
  if (tier === "PREMIUM") return "Premium";
  return "Standard";
}

function pctFromBps(bps: number) {
  const n = Number(bps);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toFixed(2);
}

function cityLabel(item: AdminStoreListItem) {
  if (!item.city) return "Sin ciudad";
  return `${item.city.name}, ${item.city.department}`;
}

export default function StoresTable({ items, loading, onOpen }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold">
              <th>Código</th>
              <th>Tienda</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Plan</th>
              <th className="text-right">Comisión</th>
              <th>Buyer</th>
              <th className="text-right">Orden</th>
              <th className="text-right">Órdenes hoy</th>
              <th className="text-right">Ventas hoy</th>
              <th className="text-right">Comisión hoy</th>
              <th>Auto</th>
              <th className="text-right">Min</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                  No hay tiendas para mostrar.
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="align-top transition hover:bg-slate-50/60 [&>td]:px-4 [&>td]:py-4">
                  <td className="font-mono text-xs font-semibold text-slate-700">{s.storeCode}</td>

                  <td className="min-w-[240px]">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{s.category}</div>
                    <div className="mt-1 text-xs text-slate-500">{s.address}</div>
                  </td>

                  <td className="min-w-[160px]">
                    <div className="font-medium text-slate-800">{cityLabel(s)}</div>
                    <div className="mt-1 text-xs text-slate-500">{s.city?.country ?? "—"}</div>
                  </td>

                  <td>
                    <span className={statusPill(s)}>{statusLabel(s)}</span>
                  </td>

                  <td>
                    <span className={premiumPill(s.premiumTier)}>{tierLabel(s.premiumTier)}</span>
                  </td>

                  <td className="text-right font-semibold text-slate-800">
                    {pctFromBps(s.commissionRateBps)}%
                  </td>

                  <td>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        s.isBuyerRecommended
                          ? "bg-fuchsia-50 text-fuchsia-700"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {s.isBuyerRecommended ? "Recomendada" : "Normal"}
                    </span>
                  </td>

                  <td className="text-right font-medium text-slate-700">
                    {s.buyerRecommendedOrder ?? "—"}
                  </td>

                  <td className="text-right font-semibold text-slate-800">{s.todayOrders}</td>
                  <td className="text-right text-slate-700">{formatCOP(s.todaySalesCOP)}</td>
                  <td className="text-right text-slate-700">{formatCOP(s.todayCommissionCOP)}</td>

                  <td>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        s.autoDecisionMode === "AUTO_CONFIRM"
                          ? "bg-sky-50 text-sky-700"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {s.autoDecisionMode === "AUTO_CONFIRM" ? "ON" : "OFF"}
                    </span>
                  </td>

                  <td className="text-right font-medium text-slate-700">{s.autoDecisionMinutes}</td>

                  <td className="text-right">
                    <button
  onClick={() => onOpen(s.id)}
  className="relative rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
>
  {String((s as any).storePayoutInfoStatus ?? "").toUpperCase() === "PENDING" ? (
    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white ring-2 ring-white">
      1
    </span>
  ) : null}
  Acciones
</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}