// app/(cc)/finance/components/FinanceOrdersTable.tsx
import { formatCOP, formatDateTime } from "@/lib/format";

function pillTone(paymentStatus: string | null) {
  const v = String(paymentStatus ?? "").toUpperCase();
  if (v === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (v === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function FinanceOrdersTable({
  items,
}: {
  items: Array<{
    id: string;
    createdAt: string;
    status: string;
    flowStatus: string;
    paymentStatus: string | null;
    totalCOP: number;
    netRevenueCOP: number;
    customerName: string;
    customerPhone: string;
    storeSummary: string;
    serviceLabel: string;
    revenueSource: string;
    workerCommissionCOP: number;
    hasFinancialSnapshot: boolean;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Órdenes recientes</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Muestra rápida para validación operativa y financiera.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Ingreso neto</th>
              <th className="px-4 py-3">Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-slate-900">{row.id}</div>
                  <div className="mt-1 text-xs text-slate-500">{formatDateTime(row.createdAt)}</div>
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{row.customerName}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.customerPhone || "—"}</div>
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {row.serviceLabel || row.storeSummary}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {row.revenueSource === "WORKER_COMMISSION"
                      ? `Comisión Worker: ${formatCOP(row.workerCommissionCOP)}`
                      : row.storeSummary}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${pillTone(row.paymentStatus)}`}>
                    {row.paymentStatus ?? "UNPAID"}
                  </span>
                </td>

                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCOP(row.totalCOP)}
                </td>

                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCOP(row.netRevenueCOP)}
                </td>

                <td className="px-4 py-3">
                  {row.revenueSource === "WORKER_COMMISSION" ? (
                    <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                      SALDO TRABAJADOR
                    </span>
                  ) : row.hasFinancialSnapshot ? (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      SNAPSHOT
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      SIN INGRESO
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No hay órdenes en el rango seleccionado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}