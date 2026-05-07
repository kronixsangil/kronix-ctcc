// app/(cc)/finance/components/FinanceSalesChart.tsx
"use client";

import { formatCOP } from "@/lib/format";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

export default function FinanceSalesChart({
  data,
}: {
  data: Array<{
    date: string;
    grossSalesCOP: number;
    paidSalesCOP: number;
    netRevenueCOP: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Comportamiento diario</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Ventas brutas, ventas pagadas e ingreso neto de plataforma.
        </div>
      </div>

      <div className="h-[320px] px-3 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: any) => formatCOP(Number(value || 0))}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="grossSalesCOP" name="Ventas brutas" strokeWidth={2} />
            <Line type="monotone" dataKey="paidSalesCOP" name="Ventas pagadas" strokeWidth={2} />
            <Line type="monotone" dataKey="netRevenueCOP" name="Ingreso neto" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}