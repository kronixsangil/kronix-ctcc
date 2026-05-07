//app\(cc)\finance\components\FinanceFilters.tsx
export default function FinanceFilters({
  from,
  to,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  from: string;
  to: string;
  loading?: boolean;
  onChange: (v: { from: string; to: string }) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Filtros</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Consulta el comportamiento financiero por rango de fechas.
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => onChange({ from: e.target.value, to })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => onChange({ from, to: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              onClick={onApply}
              disabled={!!loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Consultando..." : "Aplicar"}
            </button>

            <button
              onClick={onReset}
              disabled={!!loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}