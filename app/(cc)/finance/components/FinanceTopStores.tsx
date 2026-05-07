// app/(cc)/finance/components/FinanceTopStores.tsx
import { formatCOP } from "@/lib/format";

export default function FinanceTopStores({
  items,
}: {
  items: Array<{
    storeId: string;
    storeCode: string;
    name: string;
    orders: number;
    salesCOP: number;
    commissionCOP: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Top tiendas</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Mayor volumen comercial dentro del rango consultado.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Órdenes</th>
              <th className="px-4 py-3 text-right">Ventas</th>
              <th className="px-4 py-3 text-right">Ingreso plataforma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((row) => (
              <tr key={row.storeId} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.storeCode || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{row.orders}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCOP(row.salesCOP)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCOP(row.commissionCOP)}
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  No hay tiendas con actividad en el rango seleccionado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}