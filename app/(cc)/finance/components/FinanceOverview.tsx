//app\(cc)\finance\components\FinanceOverview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCOP, toISODate } from "@/lib/format";
import { getFinanceOverview, type FinanceOverviewResponse } from "../lib/financeApi";
import FinanceHeader from "./FinanceHeader";
import FinanceKpiCard from "./FinanceKpiCard";
import FinanceFilters from "./FinanceFilters";
import FinanceSalesChart from "./FinanceSalesChart";
import FinanceStatusChart from "./FinanceStatusChart";
import FinancePendingCards from "./FinancePendingCards";
import FinanceTopStores from "./FinanceTopStores";
import FinanceOrdersTable from "./FinanceOrdersTable";
import FinanceAlertsCard from "./FinanceAlertsCard";
import { useCtccCity } from "../../components/CtccCityContext";

function todayISO() {
  return toISODate(new Date());
}

function daysAgoISO(days: number) {
  return toISODate(new Date(Date.now() - days * 86400000));
}

function formatPct(v: number) {
  return `${Number(v || 0).toFixed(2)}%`;
}

export default function FinanceOverview() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [filters, setFilters] = useState({
    from: daysAgoISO(29),
    to: todayISO(),
  });

  const [applied, setApplied] = useState(filters);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinanceOverviewResponse | null>(null);

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  async function load(current = applied) {
    setLoading(true);
    setError(null);
    try {
      const res = await getFinanceOverview({
        ...current,
        citySlug: effectiveCitySlug,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el módulo financiero");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied.from, applied.to, effectiveCitySlug]);

  const summary = data?.summary;
  const pending = data?.pending;

  const subtitle = useMemo(() => {
    if (!data?.range) return "—";
    return `${data.range.from} → ${data.range.to}`;
  }, [data?.range]);

  return (
    <div className="space-y-4">
      <FinanceHeader />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
          </div>

          <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            {loading ? "Actualizando datos..." : subtitle}
          </div>
        </div>
      </div>

      <FinanceFilters
        from={filters.from}
        to={filters.to}
        loading={loading}
        onChange={setFilters}
        onApply={() => setApplied(filters)}
        onReset={() => {
          const next = { from: daysAgoISO(29), to: todayISO() };
          setFilters(next);
          setApplied(next);
        }}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard
          label="Ventas pagadas"
          value={formatCOP(summary?.paidSalesCOP ?? 0)}
          hint={isGlobalCityLocked ? `${subtitle} · ${cityLabel}` : subtitle}
          tone="emerald"
        />
        <FinanceKpiCard
          label="Ingreso neto plataforma"
          value={formatCOP(summary?.platformNetRevenueCOP ?? 0)}
          hint="Comisión + service fee - promo"
          tone="blue"
        />
        <FinanceKpiCard
          label="Ticket promedio"
          value={formatCOP(summary?.avgTicketCOP ?? 0)}
          hint={`${summary?.paidOrders ?? 0} orden(es) pagadas`}
          tone="slate"
        />
        <FinanceKpiCard
          label="Margen"
          value={formatPct(summary?.marginPct ?? 0)}
          hint="Sobre ventas pagadas"
          tone="amber"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard
          label="Comisión plataforma"
          value={formatCOP(summary?.platformCommissionCOP ?? 0)}
          hint="Sobre productos"
          tone="slate"
        />
        <FinanceKpiCard
          label="Service fees"
          value={formatCOP(summary?.serviceFeesCOP ?? 0)}
          hint="Cargos de servicio"
          tone="blue"
        />
        <FinanceKpiCard
          label="Propinas"
          value={formatCOP(summary?.tipsCOP ?? 0)}
          hint="Sumadas en órdenes del periodo"
          tone="emerald"
        />
        <FinanceKpiCard
          label="Promociones"
          value={formatCOP(summary?.promoCOP ?? 0)}
          hint="Descuento aplicado"
          tone="amber"
        />
      </div>

      <FinancePendingCards
        driverPayoutsCOP={pending?.driverPayoutsCOP ?? 0}
        driverPayoutsCount={pending?.driverPayoutsCount ?? 0}
        storePayoutsCOP={pending?.storePayoutsCOP ?? 0}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FinanceSalesChart data={data?.charts.salesByDay ?? []} />
        </div>
        <div className="xl:col-span-1">
          <FinanceStatusChart data={data?.charts.statusBreakdown ?? []} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FinanceTopStores items={data?.topStores ?? []} />
        </div>
        <div className="xl:col-span-1">
          <FinanceAlertsCard items={data?.alerts ?? []} />
        </div>
      </div>

      <FinanceOrdersTable items={data?.recentOrders ?? []} />
    </div>
  );
}