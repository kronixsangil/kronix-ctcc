//app\(cc)\security\components\SecurityKpiCard.tsx
"use client";

export default function SecurityKpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "blue" | "green" | "amber" | "rose";
}) {
  const toneClass =
    tone === "blue"
      ? "from-blue-50 to-white"
      : tone === "green"
      ? "from-emerald-50 to-white"
      : tone === "amber"
      ? "from-amber-50 to-white"
      : tone === "rose"
      ? "from-rose-50 to-white"
      : "from-slate-50 to-white";

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-gradient-to-br p-4 shadow-sm",
        toneClass,
      ].join(" ")}
    >
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-2 text-xs text-slate-500">{hint || "—"}</div>
    </div>
  );
}