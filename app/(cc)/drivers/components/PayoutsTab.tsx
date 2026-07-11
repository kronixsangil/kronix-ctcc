//app\(cc)\drivers\components\PayoutsTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, apiFetchRaw } from "@/lib/api";
import { formatCOP, formatDateTime, toISODate } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

type PayoutStatus = "PENDING" | "PAID";

type ApiDriver = {
  id: string;
  name: string;
  phone: string;
};

type ApiPayout = {
  id: string;
  driverId: string;
  driver: ApiDriver;
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  amountCOP: number;
  ordersCount: number;
  status: PayoutStatus;
  createdAt: string;
  paidAt?: string | null;
  paidMethod?: string | null;
  paidRef?: string | null;
  paidByAdmin?: { id: string; name: string; phone: string } | null;
};

type ApiBreakdownOrder = {
  orderId: string;
  deliveredAt: string | null;
  driverPayoutCOP: number;
  hasSnapshot: boolean;
};

type ApiBreakdownResponse = {
  payout: {
    id: string;
    driverId: string;
    periodStart: string;
    periodEnd: string;
    scheduledPayDate: string;
    amountCOP: number;
    ordersCount: number;
    status: PayoutStatus;
    createdAt: string;
    paidAt?: string | null;
    paidMethod?: string | null;
    paidRef?: string | null;
  };
  driver: { id: string; name: string; phone: string } | null;
  orders: ApiBreakdownOrder[];
  totals: { orders: number; amountCOP: number };
};

type PendingCountResponse = {
  ok?: boolean;
  count?: number;
  amountCOP?: number;
};

function labelPeriod(periodStartISO: string, periodEndISO: string) {
  const start = new Date(periodStartISO);
  const end = new Date(periodEndISO);

  const s = start.toLocaleDateString("es-CO", { month: "short", day: "2-digit" });
  const e = end.toLocaleDateString("es-CO", { month: "short", day: "2-digit" });
  return `Semana (${s} - ${e})`;
}

function safeFilePart(s: string) {
  return String(s || "").replace(/[^\w.-]+/g, "_");
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "blue";
  hint?: string;
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "amber"
        ? "from-amber-100 to-white"
        : tone === "blue"
          ? "from-sky-100 to-white"
          : "from-slate-100 to-white";

  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-sky-700"
          : "text-slate-900";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${glow} pointer-events-none`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

function statusPill(status: PayoutStatus) {
  if (status === "PENDING") {
    return "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700";
  }
  return "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700";
}

export default function PayoutsTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [items, setItems] = useState<ApiPayout[]>([]);
  const [status, setStatus] = useState<"ALL" | PayoutStatus>("PENDING");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>(() => toISODate(new Date()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ApiPayout | null>(null);
  const [paidDate, setPaidDate] = useState(() => toISODate(new Date()));
  const [paidMethod, setPaidMethod] = useState("NEQUI");
  const [paidRef, setPaidRef] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmPayChecked, setConfirmPayChecked] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiBreakdownResponse | null>(null);

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  async function loadPendingCounter() {
    try {
      const qs = new URLSearchParams();
      if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);

      const data = await apiFetch<PendingCountResponse>(
        `/admin/driver-payouts/pending-count${qs.toString() ? `?${qs.toString()}` : ""}`
      );

      window.dispatchEvent(
        new CustomEvent("kronix:driver-payouts-pending-count", {
          detail: {
            count: Number(data?.count ?? 0),
            amountCOP: Number(data?.amountCOP ?? 0),
          },
        })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("kronix:driver-payouts-pending-count", {
          detail: { count: 0, amountCOP: 0 },
        })
      );
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();

      if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);
      qs.set("status", status);

      if (q.trim()) qs.set("q", q.trim());
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      const data = await apiFetch<ApiPayout[]>(`/admin/driver-payouts?${qs.toString()}`);
      setItems(data);
      await loadPendingCounter();
    } catch (e: any) {
      setError(e?.message || "Error cargando payouts");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function syncAllPendingWeeks() {
    setGenerating(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);

      await apiFetch(`/admin/driver-payouts/generate-missing${qs.toString() ? `?${qs.toString()}` : ""}`, {
        method: "POST",
      });

      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudieron sincronizar las semanas pendientes.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, from, to, effectiveCitySlug]);

  const totals = useMemo(() => {
    const pending = items.filter((i) => i.status === "PENDING").reduce((acc, i) => acc + i.amountCOP, 0);
    const paid = items.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.amountCOP, 0);
    const orders = items.reduce((acc, i) => acc + Number(i.ordersCount || 0), 0);
    return { pending, paid, orders };
  }, [items]);

  const groupedByWeek = useMemo(() => {
    const map = new Map<string, ApiPayout[]>();

    for (const item of items) {
      const key = `${item.periodStart}|${item.periodEnd}`;
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    }

    return Array.from(map.entries()).map(([key, rows]) => {
      const [periodStart, periodEnd] = key.split("|");
      const pendingCOP = rows.filter((x) => x.status === "PENDING").reduce((acc, x) => acc + x.amountCOP, 0);
      const paidCOP = rows.filter((x) => x.status === "PAID").reduce((acc, x) => acc + x.amountCOP, 0);
      const orders = rows.reduce((acc, x) => acc + Number(x.ordersCount || 0), 0);

      return {
        key,
        periodStart,
        periodEnd,
        rows,
        pendingCOP,
        paidCOP,
        orders,
      };
    });
  }, [items]);

  function openPayModal(it: ApiPayout) {
    setSelected(it);
    setPaidDate(toISODate(new Date()));
    setPaidMethod("NEQUI");
    setPaidRef("");
    setConfirmPayChecked(false);
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setSelected(null);
    setConfirmPayChecked(false);
  }

  async function markAsPaid() {
    if (!selected) return;

    setSaving(true);
    setError(null);

    try {
      await apiFetch<ApiPayout>(`/admin/driver-payouts/${selected.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          paidDate,
          method: paidMethod,
          ref: paidRef.trim() || undefined,
        }),
      });

      setOpen(false);
      setSelected(null);
      setConfirmPayChecked(false);

      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo marcar como pagado");
    } finally {
      setSaving(false);
    }
  }

  async function openDetailModal(payoutId: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const data = await apiFetch<ApiBreakdownResponse>(`/admin/driver-payouts/${payoutId}/breakdown`);
      setDetail(data);
    } catch (e: any) {
      setDetailError(e?.message || "No se pudo cargar el detalle del payout");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    if (detailLoading) return;
    setDetailOpen(false);
    setDetail(null);
    setDetailError(null);
  }

  async function exportCSV() {
    setError(null);
    try {
      const qs = new URLSearchParams();

      if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);
      qs.set("status", status);

      if (q.trim()) qs.set("q", q.trim());
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      const res = await apiFetchRaw(`/admin/driver-payouts/export.csv?${qs.toString()}`, {
        method: "GET",
        headers: {
          Accept: "text/csv",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error exportando CSV (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const cityPart = effectiveCitySlug ? safeFilePart(effectiveCitySlug) : "ALL_CITIES";
      const filename = `worker_payouts_${cityPart}_${safeFilePart(status)}_${safeFilePart(from || "ALL")}_${safeFilePart(to || "ALL")}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "No se pudo exportar CSV");
    }
  }

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <SectionHeader
            title="Pagos automáticos a trabajadores de Tienda en Línea"
            subtitle="Sincroniza pagos de workers que realizan entregas de Tienda en Línea."
            right={
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={syncAllPendingWeeks}
                  disabled={generating || loading}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {generating ? "Sincronizando..." : "Sincronizar semanas"}
                </button>

                <button
                  onClick={exportCSV}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Exportar CSV
                </button>
              </div>
            }
          />
          <div className="p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
              </div>

              <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                {loading ? "Actualizando datos..." : `${items.length} payout(s) en vista`}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Pendiente (COP)"
                value={formatCOP(totals.pending)}
                tone="amber"
                hint="Monto aún no pagado"
              />
              <MetricCard
                label="Pagado (COP)"
                value={formatCOP(totals.paid)}
                tone="emerald"
                hint="Monto ya registrado"
              />
              <MetricCard
                label="Órdenes cubiertas"
                value={String(totals.orders)}
                tone="slate"
                hint="Sumatoria de órdenes"
              />
              <MetricCard
                label="Semanas en vista"
                value={String(groupedByWeek.length)}
                tone="blue"
                hint="Agrupadas por período"
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <SectionHeader title="Resumen de vista" subtitle="Estado actual según filtros aplicados" />
          <div className="p-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ciudad</span>
                <span className="font-semibold text-slate-900">
                  {isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Registros</span>
                <span className="font-semibold text-slate-900">{loading ? "…" : items.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Estado filtro</span>
                <span className="font-semibold text-slate-900">
                  {status === "ALL" ? "Todos" : status === "PENDING" ? "Pendiente" : "Pagado"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Rango</span>
                <span className="font-semibold text-slate-900">
                  {from || "Primera orden"} → {to || "Hoy"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
              Tip: usa Pendiente para ver semanas atrasadas por pagar; Todos incluye pendientes y pagados.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <SectionHeader title="Filtros" subtitle="Pendientes muestra todas las semanas atrasadas y la semana actual si aplica." />
        <div className="p-4">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-slate-600">Ciudad</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                value={isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                disabled
              />
              <div className="mt-1 text-[11px] text-slate-500">
                {isGlobalCityLocked
                  ? "La ciudad está siendo controlada desde el selector global del CTCC."
                  : "Vista global gobernada por el selector superior del CTCC."}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-600">Estado</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="ALL">Todos</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-slate-600">Buscar</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Nombre, teléfono, id..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-600">Desde</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-600">Hasta</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="lg:col-span-12 flex flex-wrap items-end justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStatus("PENDING");
                  setQ("");
                  setFrom("");
                  setTo(toISODate(new Date()));
                }}
              >
                Ver pendientes históricos
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStatus("ALL");
                  setQ("");
                  setFrom(toISODate(new Date(Date.now() - 86400000 * 7)));
                  setTo(toISODate(new Date()));
                }}
              >
                Semana actual
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <SectionHeader
          title="Pagos a workers"
          subtitle="Listado consolidado por payout, agrupado por semana."
          right={
            <span className="text-xs text-slate-500">
              {loading ? "Cargando..." : `${items.length} registro(s)`}
            </span>
          }
        />

        <div className="divide-y divide-slate-100">
          {groupedByWeek.map((week) => (
            <div key={week.key} className="p-4">
              <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-base font-black text-slate-900">
                    {labelPeriod(week.periodStart, week.periodEnd)}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {week.rows.length} payout(s) · {week.orders} orden(es) cubiertas
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                    Pendiente {formatCOP(week.pendingCOP)}
                  </span>
                  <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                    Pagado {formatCOP(week.paidCOP)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-3">Worker</th>
                      <th className="px-4 py-3">Pago programado</th>
                      <th className="px-4 py-3 text-center">Órdenes</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Pago real</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {week.rows.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-4 align-top">
                          <div className="font-semibold text-slate-900">{it.driver?.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {it.driver?.phone} · {it.id}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top text-slate-700">
                          {formatDateTime(it.scheduledPayDate)}
                        </td>

                        <td className="px-4 py-4 align-top text-center font-medium text-slate-900">
                          {it.ordersCount}
                        </td>

                        <td className="px-4 py-4 align-top text-right font-semibold text-slate-900">
                          {formatCOP(it.amountCOP)}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className={statusPill(it.status)}>
                            {it.status === "PENDING" ? "Pendiente" : "Pagado"}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top text-slate-600">
                          {it.status === "PAID" ? (
                            <div className="text-xs">
                              <div className="font-medium text-slate-900">
                                {it.paidAt ? formatDateTime(it.paidAt) : "—"}
                              </div>
                              <div className="mt-1 text-slate-500">
                                {it.paidMethod || "—"}
                                {it.paidRef ? ` · ${it.paidRef}` : ""}
                              </div>
                              {it.paidByAdmin?.name ? (
                                <div className="mt-1 text-slate-400">Por: {it.paidByAdmin.name}</div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openDetailModal(it.id)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Ver detalle
                            </button>

                            {it.status === "PENDING" ? (
                              <button
                                onClick={() => openPayModal(it)}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                              >
                                Marcar pagado
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-3 py-2 text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {!loading && groupedByWeek.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500">
              No hay registros para los filtros actuales.
            </div>
          ) : null}
        </div>
      </div>

      {open && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-900">Marcar como pagado</div>
              <div className="mt-1 text-sm text-slate-600">
                {selected.driver?.name} · {formatCOP(selected.amountCOP)} · {labelPeriod(selected.periodStart, selected.periodEnd)}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">Fecha de pago</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Método</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={paidMethod}
                  onChange={(e) => setPaidMethod(e.target.value)}
                  disabled={saving}
                >
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                  <option value="BANCOLOMBIA">Bancolombia</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Referencia (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Ej: comprobante, referencia o código"
                  value={paidRef}
                  onChange={(e) => setPaidRef(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mt-1 flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmPayChecked}
                    onChange={(e) => setConfirmPayChecked(e.target.checked)}
                    disabled={saving}
                  />
                  <span>
                    Confirmo que este pago fue realizado y entiendo que quedará registrado con auditoría.
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={markAsPaid}
                disabled={saving || !confirmPayChecked}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetailModal} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">Detalle del payout</div>
                {detail?.payout ? (
                  <div className="mt-1 text-sm text-slate-600">
                    {detail.driver?.name || "Worker"} · {formatCOP(detail.payout.amountCOP)} ·{" "}
                    {labelPeriod(detail.payout.periodStart, detail.payout.periodEnd)}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-slate-600">Desglose por órdenes del periodo.</div>
                )}
              </div>

              <button
                onClick={closeDetailModal}
                disabled={detailLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Cargando detalle...
              </div>
            ) : null}

            {detailError ? (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {detailError}
              </div>
            ) : null}

            {!detailLoading && detail ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Órdenes" value={String(detail.totals.orders)} tone="slate" />
                  <MetricCard label="Total payout" value={formatCOP(detail.totals.amountCOP)} tone="amber" />
                  <MetricCard
                    label="Snapshots faltantes"
                    value={String(detail.orders.filter((o) => !o.hasSnapshot).length)}
                    tone="slate"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <SectionHeader
                    title="Órdenes del periodo"
                    subtitle="Base del cálculo del payout"
                    right={<span className="text-xs text-slate-500">{detail.orders.length} registro(s)</span>}
                  />

                  <div className="overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                          <th className="px-4 py-3">Orden</th>
                          <th className="px-4 py-3">Entregada</th>
                          <th className="px-4 py-3">Snapshot</th>
                          <th className="px-4 py-3 text-right">Payout (COP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detail.orders.map((o) => (
                          <tr key={o.orderId}>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{o.orderId}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {o.deliveredAt ? formatDateTime(o.deliveredAt) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {o.hasSnapshot ? (
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                                  OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                                  FALTA
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCOP(o.driverPayoutCOP)}
                            </td>
                          </tr>
                        ))}

                        {detail.orders.length === 0 ? (
                          <tr>
                            <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                              No hay órdenes DELIVERED en el periodo del payout.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Nota: el desglose se calcula por órdenes DELIVERED dentro del periodo del payout y usa financialSnapshot.driverPayoutCOP para compatibilidad técnica.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
