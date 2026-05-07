// app/(cc)/finance/components/FinanceAlertsCard.tsx
function toneStyles(tone: "emerald" | "amber" | "rose" | "blue") {
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "rose") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-blue-200 bg-blue-50 text-blue-900";
}

export default function FinanceAlertsCard({
  items,
}: {
  items: Array<{
    kind: string;
    title: string;
    description: string;
    tone: "emerald" | "amber" | "rose" | "blue";
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Alertas y hallazgos</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Señales clave para operación real, conciliación y control.
        </div>
      </div>

      <div className="p-4 space-y-3">
        {items.map((alert) => (
          <div
            key={alert.kind}
            className={`rounded-2xl border px-4 py-3 ${toneStyles(alert.tone)}`}
          >
            <div className="text-sm font-semibold">{alert.title}</div>
            <div className="mt-1 text-xs opacity-90">{alert.description}</div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No hay alertas para este rango.
          </div>
        ) : null}
      </div>
    </div>
  );
}