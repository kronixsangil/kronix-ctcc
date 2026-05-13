//app\(cc)\dashboard\page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCOP, formatDateTime, toISODate } from "@/lib/format";
import { listAdminOrders } from "../orders/lib/ordersApi";
import { adminListStores } from "../stores/lib/storesApi";
import { useCtccCity } from "../components/CtccCityContext";

import KpiCard from "./components/KpiCard";
import SalesChart from "./components/SalesChart";
import OrdersChart from "./components/OrdersChart";
import RecentOrders from "./components/RecentOrders";
import AlertsCard from "./components/AlertsCard";

type DriverListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  profile?: {
    level?: "BRONCE" | "PLATA" | "ORO" | "PLATINO";
    rating?: number;
    isActive?: boolean;
  } | null;
  vehicle?: {
    plate?: string | null;
    isActive?: boolean;
  } | null;
  docs?: {
    docsOk?: boolean | null;
    reason?: string;
  } | null;
};

type DriverListResponse = {
  items?: DriverListItem[];
};

type ApiPayout = {
  id: string;
  driverId: string;
  amountCOP: number;
  ordersCount: number;
  status: "PENDING" | "PAID";
  scheduledPayDate: string;
  createdAt: string;
};

type DashboardData = {
  orders: any[];
  stores: any[];
  drivers: DriverListItem[];
  pendingPayouts: ApiPayout[];
};

function normalizeDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickCreatedAt(order: any): string | null {
  return order?.createdAt ?? order?.createdAtISO ?? order?.createdAtIso ?? null;
}

function pickDeliveredAt(order: any): string | null {
  return order?.deliveredAt ?? order?.deliveredAtISO ?? order?.deliveredAtIso ?? null;
}

function pickOrderTotal(order: any): number {
  const raw = order?.totalCOP ?? order?.total ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function pickOrderStatus(order: any): string {
  return String(order?.status ?? "UNKNOWN").toUpperCase();
}

function pickFlowStatus(order: any): string {
  return String(order?.flowStatus ?? "UNKNOWN").toUpperCase();
}

function pickPaymentStatus(order: any): string {
  return String(order?.paymentStatus ?? "UNKNOWN").toUpperCase();
}

function pickStoreName(order: any): string {
  if (typeof order?.storeSummary === "string" && order.storeSummary.trim()) return order.storeSummary.trim();

  if (Array.isArray(order?.pickups) && order.pickups.length) {
    const names = order.pickups
      .map((p: any) => p?.store?.name ?? p?.storeName ?? null)
      .filter(Boolean)
      .map((x: any) => String(x).trim())
      .filter(Boolean);

    if (names.length) return names.join(", ");
  }

  if (Array.isArray(order?.storesSummary) && order.storesSummary.length) {
    const names = order.storesSummary
      .map((s: any) => s?.name ?? null)
      .filter(Boolean)
      .map((x: any) => String(x).trim())
      .filter(Boolean);

    if (names.length) return names.join(", ");
  }

  return "—";
}

function pickCustomerName(order: any): string {
  return String(
    order?.customerName ??
      order?.customer?.name ??
      order?.user?.name ??
      order?.buyer?.name ??
      order?.client?.name ??
      "Cliente"
  );
}

function pickDriverName(order: any): string {
  return String(order?.driverName ?? order?.driver?.name ?? "—");
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("es-CO", { weekday: "short" });
}

function prettyFlowStatus(v: string) {
  const x = String(v || "").toUpperCase();
  if (x === "WAITING_CONFIRMATION") return "Esperando confirmación";
  if (x === "STORE_CONFIRMED") return "Tienda confirmó";
  if (x === "PAYMENT_PENDING") return "Pago pendiente";
  if (x === "PAYMENT_FAILED") return "Pago falló";
  if (x === "PREPARING") return "Preparando";
  if (x === "EN_ROUTE") return "En camino";
  if (x === "DELIVERED") return "Entregada";
  if (x === "CANCELLED") return "Cancelada";
  if (x === "PAID") return "Pagada";
  return x || "—";
}

export default function DashboardPage() {
  const { mode, citySlug, cityLabel } = useCtccCity();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [data, setData] = useState<DashboardData>({
    orders: [],
    stores: [],
    drivers: [],
    pendingPayouts: [],
  });

  const effectiveCitySlug = mode === "CITY" ? citySlug : "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const from = toISODate(sevenDaysAgo);
      const to = toISODate(tomorrow);

      const ordersPromise = listAdminOrders({
        q: "",
        status: "",
        flowStatus: "",
        paymentStatus: "",
        store: "",
        driver: "",
        city: effectiveCitySlug,
        citySlug: effectiveCitySlug,
        from,
        to,
      } as any);

      const storesPromise = adminListStores({
        q: "",
        status: "ALL",
        citySlug: effectiveCitySlug,
        page: 1,
        limit: 200,
      } as any);

      const driversPromise = apiFetch<DriverListResponse>(
        `/drivers/admin/list?status=ALL&page=1&limit=200`
      );

      const payoutsPromise = apiFetch<ApiPayout[]>(
        `/admin/driver-payouts?status=PENDING&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );

      const results = await Promise.allSettled([
        ordersPromise,
        storesPromise,
        driversPromise,
        payoutsPromise,
      ]);

      const orders =
        results[0].status === "fulfilled" && Array.isArray((results[0].value as any)?.items)
          ? (results[0].value as any).items
          : [];

      const stores =
        results[1].status === "fulfilled" && Array.isArray((results[1].value as any)?.items)
          ? (results[1].value as any).items
          : [];

      const drivers =
        results[2].status === "fulfilled" && Array.isArray((results[2].value as any)?.items)
          ? (results[2].value as any).items
          : [];

      const pendingPayouts =
        results[3].status === "fulfilled" && Array.isArray(results[3].value)
          ? results[3].value
          : [];

      setData({ orders, stores, drivers, pendingPayouts });
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el Panel General.");
    } finally {
      setLoading(false);
    }
  }, [effectiveCitySlug]);

  useEffect(() => {
    load();
  }, [load]);

  const view = useMemo(() => {
    const now = new Date();

    const todayOrders = data.orders.filter((o) => {
      const created = normalizeDate(pickCreatedAt(o));
      return created ? sameLocalDay(created, now) : false;
    });

    const salesToday = todayOrders.reduce((acc, o) => acc + pickOrderTotal(o), 0);
    const deliveredToday = todayOrders.filter(
      (o) => pickFlowStatus(o) === "DELIVERED" || pickOrderStatus(o) === "DELIVERED"
    ).length;

    const avgTicketToday =
      todayOrders.length > 0 ? Math.round(salesToday / todayOrders.length) : 0;

    const deliveryDurations = todayOrders
      .map((o) => {
        const created = normalizeDate(pickCreatedAt(o));
        const delivered = normalizeDate(pickDeliveredAt(o));
        if (!created || !delivered) return null;
        const diffMin = Math.round((delivered.getTime() - created.getTime()) / 60000);
        return diffMin > 0 ? diffMin : null;
      })
      .filter((x): x is number => typeof x === "number");

    const avgDeliveryMinutes =
      deliveryDurations.length > 0
        ? Math.round(deliveryDurations.reduce((acc, v) => acc + v, 0) / deliveryDurations.length)
        : null;

    const activeDrivers = data.drivers.filter((d) => Boolean(d.profile?.isActive)).length;
    const inactiveDrivers = data.drivers.filter((d) => !Boolean(d.profile?.isActive)).length;
    const driversWithDocsIssues = data.drivers.filter((d) => d.docs?.docsOk === false).length;

    const activeStores = data.stores.filter((s: any) => Boolean(s?.isActive) && !Boolean(s?.isPaused)).length;
    const pausedStores = data.stores.filter((s: any) => Boolean(s?.isActive) && Boolean(s?.isPaused)).length;
    const inactiveStores = data.stores.filter((s: any) => !Boolean(s?.isActive)).length;

    const payoutPendingCOP = data.pendingPayouts.reduce((acc, p) => acc + Number(p.amountCOP || 0), 0);

    const sales7d: Array<{ label: string; ventas: number; ordenes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);

      const dayOrders = data.orders.filter((o) => {
        const created = normalizeDate(pickCreatedAt(o));
        return created ? sameLocalDay(created, day) : false;
      });

      sales7d.push({
        label: dayLabel(day),
        ventas: dayOrders.reduce((acc, o) => acc + pickOrderTotal(o), 0),
        ordenes: dayOrders.length,
      });
    }

    const flowMap = new Map<string, number>();
    for (const o of data.orders) {
      const flow = pickFlowStatus(o);
      flowMap.set(flow, (flowMap.get(flow) ?? 0) + 1);
    }

    const ordersByStatus = [
      { name: "Esperando", value: flowMap.get("WAITING_CONFIRMATION") ?? 0 },
      { name: "Preparando", value: flowMap.get("PREPARING") ?? 0 },
      { name: "En camino", value: flowMap.get("EN_ROUTE") ?? 0 },
      { name: "Entregadas", value: flowMap.get("DELIVERED") ?? 0 },
      { name: "Canceladas", value: flowMap.get("CANCELLED") ?? 0 },
    ].filter((x) => x.value > 0);

    const paymentMap = new Map<string, number>();
    for (const o of data.orders) {
      const pay = pickPaymentStatus(o);
      paymentMap.set(pay, (paymentMap.get(pay) ?? 0) + 1);
    }

    const payments = [
      { name: "Pendiente", value: paymentMap.get("PENDING") ?? 0 },
      { name: "Pagada", value: paymentMap.get("PAID") ?? 0 },
      { name: "Fallida", value: paymentMap.get("FAILED") ?? 0 },
    ].filter((x) => x.value > 0);

    const topStoresMap = new Map<string, { name: string; orders: number; sales: number }>();
    for (const o of data.orders) {
      const name = pickStoreName(o);
      if (!name || name === "—") continue;

      const current = topStoresMap.get(name) ?? { name, orders: 0, sales: 0 };
      current.orders += 1;
      current.sales += pickOrderTotal(o);
      topStoresMap.set(name, current);
    }

    const topStores = Array.from(topStoresMap.values())
      .sort((a, b) => b.sales - a.sales || b.orders - a.orders)
      .slice(0, 5);

    const topDrivers = [...data.drivers]
      .sort((a, b) => Number(b.profile?.rating ?? 0) - Number(a.profile?.rating ?? 0))
      .slice(0, 5);

    const recentOrders = [...data.orders]
      .sort((a, b) => {
        const ad = normalizeDate(pickCreatedAt(a))?.getTime() ?? 0;
        const bd = normalizeDate(pickCreatedAt(b))?.getTime() ?? 0;
        return bd - ad;
      })
      .slice(0, 8)
      .map((order) => ({
        id: String(order?.id ?? "—"),
        customer: pickCustomerName(order),
        store: pickStoreName(order),
        driver: pickDriverName(order),
        flowStatus: prettyFlowStatus(pickFlowStatus(order)),
        total: pickOrderTotal(order),
        createdAt: pickCreatedAt(order),
      }));

    const alerts: Array<{ label: string; tone: "amber" | "rose" | "blue" | "slate" }> = [];
    if (pausedStores > 0) alerts.push({ label: `${pausedStores} tienda(s) pausadas`, tone: "amber" });
    if (inactiveStores > 0) alerts.push({ label: `${inactiveStores} tienda(s) inactivas`, tone: "slate" });
    if (driversWithDocsIssues > 0) alerts.push({ label: `${driversWithDocsIssues} conductor(es) con documentos pendientes`, tone: "amber" });
    if (inactiveDrivers > 0) alerts.push({ label: `${inactiveDrivers} conductor(es) inactivos`, tone: "slate" });
    if (data.pendingPayouts.length > 0) {
      alerts.push({
        label: `${data.pendingPayouts.length} payout(s) pendientes por ${formatCOP(payoutPendingCOP)}`,
        tone: "blue",
      });
    }

    return {
      ordersToday: todayOrders.length,
      deliveredToday,
      salesToday,
      activeDrivers,
      activeStores,
      avgTicketToday,
      avgDeliveryMinutes,
      pausedStores,
      payoutPendingCOP,
      sales7d,
      ordersByStatus,
      payments,
      topStores,
      topDrivers,
      recentOrders,
      alerts,
    };
  }, [data]);

  return (
    <main className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Panel General</h1>
            <p className="mt-1 text-sm text-slate-600">
              Vista ejecutiva del sistema con indicadores, gráficos, alertas y actividad reciente.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold",
                  effectiveCitySlug
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-slate-200 bg-slate-50 text-slate-700",
                ].join(" ")}
              >
                {effectiveCitySlug ? `Ciudad activa: ${cityLabel}` : "Vista Global"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {lastUpdated ? `Actualizado: ${formatDateTime(lastUpdated.toISOString())}` : "Sin actualización"}
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Refrescar panel"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard title="Órdenes hoy" value={loading ? "…" : String(view.ordersToday)} subtitle={`${view.deliveredToday} entregadas`} tone="blue" />
        <KpiCard title="Ventas hoy" value={loading ? "…" : formatCOP(view.salesToday)} subtitle={`Ticket promedio: ${formatCOP(view.avgTicketToday)}`} tone="emerald" />
        <KpiCard title="Conductores activos" value={loading ? "…" : String(view.activeDrivers)} subtitle="Operación disponible" tone="slate" />
        <KpiCard title="Tiendas operativas" value={loading ? "…" : String(view.activeStores)} subtitle={`${view.pausedStores} pausadas`} tone="amber" />
        <KpiCard title="Tiempo promedio" value={loading ? "…" : view.avgDeliveryMinutes != null ? `${view.avgDeliveryMinutes} min` : "—"} subtitle="Hoy" tone="blue" />
        <KpiCard title="Payouts pendientes" value={loading ? "…" : formatCOP(view.payoutPendingCOP)} subtitle="Pendientes de pago" tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SalesChart
            title="Ventas y órdenes últimos 7 días"
            subtitle={effectiveCitySlug ? `Tendencia reciente · ${cityLabel}` : "Tendencia reciente del negocio"}
            data={view.sales7d}
            loading={loading}
          />
        </div>

        <div className="xl:col-span-5">
          <OrdersChart
            title="Órdenes por estado"
            subtitle={effectiveCitySlug ? `Distribución de flowStatus · ${cityLabel}` : "Distribución de flowStatus reciente"}
            data={view.ordersByStatus}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <AlertsCard alerts={view.alerts} loading={loading} />
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Top tiendas</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {effectiveCitySlug ? `Mayor volumen reciente · ${cityLabel}` : "Mayor volumen reciente"}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Cargando ranking...</div>
            ) : view.topStores.length === 0 ? (
              <div className="text-sm text-slate-500">Sin datos.</div>
            ) : (
              view.topStores.map((store, idx) => (
                <div key={`${store.name}-${idx}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">#{idx + 1} · {store.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{store.orders} orden(es)</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-slate-900">{formatCOP(store.sales)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Top conductores</div>
            <div className="mt-0.5 text-xs text-slate-500">Por rating actual</div>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Cargando conductores...</div>
            ) : view.topDrivers.length === 0 ? (
              <div className="text-sm text-slate-500">Sin datos.</div>
            ) : (
              view.topDrivers.map((driver, idx) => (
                <div key={driver.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">#{idx + 1} · {driver.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{driver.vehicle?.plate ? `Placa: ${driver.vehicle.plate}` : driver.phone}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-slate-900">{Number(driver.profile?.rating ?? 0).toFixed(1)}</div>
                      <div className="text-xs text-slate-500">{driver.profile?.isActive ? "Activo" : "Inactivo"}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <RecentOrders rows={view.recentOrders} loading={loading} />
    </main>
  );
}