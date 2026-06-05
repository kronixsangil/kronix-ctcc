//app\(cc)\buyer\components\BuyerKpiCard.tsx
type Props = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky";
};

export default function BuyerKpiCard({ label, value, helper, tone = "slate" }: Props) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : tone === "sky"
            ? "border-sky-200 bg-sky-50 text-sky-800"
            : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${cls}`}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black leading-none">{value}</div>
      {helper ? <div className="mt-2 text-xs font-semibold opacity-75">{helper}</div> : null}
    </div>
  );
}
