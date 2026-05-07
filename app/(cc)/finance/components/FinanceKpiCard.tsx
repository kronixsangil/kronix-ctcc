//app\(cc)\finance\components\FinanceKpiCard.tsx
type Tone = "slate" | "emerald" | "blue" | "amber";

export default function FinanceKpiCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "blue"
      ? "from-blue-100 to-white"
      : tone === "amber"
      ? "from-amber-100 to-white"
      : "from-slate-100 to-white";

  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "blue"
      ? "text-blue-700"
      : tone === "amber"
      ? "text-amber-700"
      : "text-slate-900";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${glow} pointer-events-none`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}