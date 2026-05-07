// app/(cc)/finance/components/FinanceStatusChart.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function FinanceStatusChart({
  data,
}: {
  data: Array<{
    label: string;
    count: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Estado de pago</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Distribución de órdenes por estado financiero.
        </div>
      </div>

      <div className="h-[320px] px-3 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: any, name: any) => [String(value), name]} />
            <Bar dataKey="count" name="Órdenes" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}