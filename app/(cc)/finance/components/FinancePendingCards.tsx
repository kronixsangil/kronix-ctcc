// app/(cc)/finance/components/FinancePendingCards.tsx
import { formatCOP } from "@/lib/format";

export default function FinancePendingCards({
  driverPayoutsCOP,
  driverPayoutsCount,
  storePayoutsCOP,
}: {
  driverPayoutsCOP: number;
  driverPayoutsCount: number;
  storePayoutsCOP: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-amber-900">Pagos pendientes a drivers</div>
          <div className="mt-0.5 text-xs text-amber-700">
            Basado en payouts semanales pendientes.
          </div>
        </div>
        <div className="p-4">
          <div className="text-3xl font-semibold text-amber-700">{formatCOP(driverPayoutsCOP)}</div>
          <div className="mt-2 text-xs text-slate-500">
            {driverPayoutsCount} payout(s) pendientes dentro del rango consultado.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
          <div className="text-sm font-semibold text-blue-900">Pendiente teórico a tiendas</div>
          <div className="mt-0.5 text-xs text-blue-700">
            Aún no existe conciliación real a tiendas.
          </div>
        </div>
        <div className="p-4">
          <div className="text-3xl font-semibold text-blue-700">{formatCOP(storePayoutsCOP)}</div>
          <div className="mt-2 text-xs text-slate-500">
            Este valor representa obligación teórica basada en snapshots financieros.
          </div>
        </div>
      </div>
    </div>
  );
}