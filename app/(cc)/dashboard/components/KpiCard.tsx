//app\(cc)\dashboard\components\KpiCard.tsx
type Props = {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "slate" | "emerald" | "blue" | "amber" | "rose";
};

function toneText(tone: "slate" | "emerald" | "blue" | "amber" | "rose" = "slate") {
  if (tone === "emerald") return "text-emerald-700";
  if (tone === "blue") return "text-blue-700";
  if (tone === "amber") return "text-amber-700";
  if (tone === "rose") return "text-rose-700";
  return "text-slate-700";
}

export default function KpiCard({ title, value, subtitle, tone = "slate" }: Props) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "blue"
      ? "from-blue-100 to-white"
      : tone === "amber"
      ? "from-amber-100 to-white"
      : tone === "rose"
      ? "from-rose-100 to-white"
      : "from-slate-100 to-white";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${glow} pointer-events-none`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
        <div className={`mt-3 text-3xl font-semibold ${toneText(tone)}`}>{value}</div>
        {subtitle ? <div className="mt-2 text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}