// app/(cc)/finance/components/FinanceHeader.tsx
export default function FinanceHeader() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-100/70 to-white pointer-events-none" />
        <div className="relative px-6 py-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            KroniX · CTCC
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Finanzas
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Vista ejecutiva del comportamiento económico de la operación:
            ventas, ingresos de plataforma, obligaciones pendientes, top tiendas
            y detalle financiero reciente.
          </p>
        </div>
      </div>
    </div>
  );
}