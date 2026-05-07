//app\(cc)\dashboard\components\RecentOrders.tsx
import { formatCOP, formatDateTime } from "@/lib/format";

type Row = {
  id: string;
  customer: string;
  store: string;
  driver: string;
  flowStatus: string;
  total: number;
  createdAt: string | null;
};

export default function RecentOrders({
  rows,
  loading,
}: {
  rows: Row[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Actividad reciente</div>
        <div className="mt-0.5 text-xs text-slate-500">Últimas órdenes registradas</div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando actividad...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-500">No hay órdenes recientes para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="px-3 py-3">Orden</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Tienda</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Flow</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{row.id}</td>
                    <td className="px-3 py-3 text-slate-700">{row.customer}</td>
                    <td className="px-3 py-3 text-slate-700">{row.store}</td>
                    <td className="px-3 py-3 text-slate-700">{row.driver}</td>
                    <td className="px-3 py-3 text-slate-700">{row.flowStatus}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatCOP(row.total)}</td>
                    <td className="px-3 py-3 text-slate-500">{row.createdAt ? formatDateTime(row.createdAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}