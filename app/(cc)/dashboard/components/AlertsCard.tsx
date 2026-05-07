//app\(cc)\dashboard\components\AlertsCard.tsx
type AlertItem = {
  label: string;
  tone: "amber" | "rose" | "blue" | "slate";
};

function statusTone(tone: "amber" | "rose" | "blue" | "slate") {
  if (tone === "amber") return "bg-amber-50 text-amber-700 border-amber-200";
  if (tone === "rose") return "bg-rose-50 text-rose-700 border-rose-200";
  if (tone === "blue") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function AlertsCard({
  alerts,
  loading,
}: {
  alerts: AlertItem[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Alertas operativas</div>
        <div className="mt-0.5 text-xs text-slate-500">Puntos que requieren atención</div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Analizando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="text-sm text-slate-500">Sin alertas críticas por ahora.</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={`${alert.label}-${idx}`}
                className={`rounded-xl border px-3 py-3 text-sm ${statusTone(alert.tone)}`}
              >
                {alert.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}