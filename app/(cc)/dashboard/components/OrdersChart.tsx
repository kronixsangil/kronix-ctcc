//app\(cc)\dashboard\components\OrdersChart.tsx
"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Row = {
  name: string;
  value: number;
};

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#64748b", "#8b5cf6"];

export default function OrdersChart({
  title,
  subtitle,
  data,
  loading,
}: {
  title: string;
  subtitle?: string;
  data: Row[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando gráfico...</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-slate-500">Sin datos para mostrar.</div>
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}