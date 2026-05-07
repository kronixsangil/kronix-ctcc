//app\(cc)\dashboard\components\SalesChart.tsx
"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCOP } from "@/lib/format";

type Row = {
  label: string;
  ventas: number;
  ordenes: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const ventas = payload.find((p) => String(p.name) === "Ventas")?.value;
  const ordenes = payload.find((p) => String(p.name) === "Órdenes")?.value;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-xs font-semibold text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-600">
        Ventas: <span className="font-semibold text-slate-900">{formatCOP(Number(ventas || 0))}</span>
      </div>
      <div className="mt-1 text-xs text-slate-600">
        Órdenes: <span className="font-semibold text-slate-900">{Number(ordenes || 0)}</span>
      </div>
    </div>
  );
}

export default function SalesChart({
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
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${Math.round(value / 1000)}k`;
                    return `${value}`;
                  }}
                />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" name="Ventas" radius={[8, 8, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ordenes"
                  name="Órdenes"
                  strokeWidth={3}
                  dot
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}