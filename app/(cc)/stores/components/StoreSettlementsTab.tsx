//app\(cc)\stores\components\StoreSettlementsTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../../components/CtccCityContext";
import { adminListCities, type AdminCityItem } from "../lib/storesApi";
import {
  adminListStoreSettlements,
  adminMarkStoreSettlementPaid,
  type StoreSettlementFrequency,
  type StoreSettlementRow,
  type StoreSettlementsResponse,
} from "../lib/storeSettlementsApi";

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusLabel(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "PAID") return "Pagada";
  if (s === "CANCELLED") return "Cancelada";
  return "Pendiente";
}

function statusClass(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "CANCELLED") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function settlementKey(row: StoreSettlementRow) {
  return `${row.storeId}-${row.periodStart}-${row.periodEnd}`;
}

function frequencyLabel(frequency: StoreSettlementFrequency) {
  if (frequency === "BIWEEKLY") return "Quincenal";
  if (frequency === "MONTHLY") return "Mensual";
  return "Semanal";
}

function FrequencyButton({
  active,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2.5 text-left text-sm font-black transition",
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <div>{label}</div>
      <div className={active ? "text-xs font-semibold text-white/60" : "text-xs font-semibold text-slate-400"}>
        {helper}
      </div>
    </button>
  );
}

function KpiCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "dark" | "blue" | "green" | "amber";
}) {
  const cls =
    tone === "dark"
      ? "border-transparent bg-[linear-gradient(135deg,#111827_0%,#334155_100%)] text-white"
      : tone === "blue"
        ? "border-transparent bg-[linear-gradient(135deg,#0f62fe_0%,#38bdf8_100%)] text-white"
        : tone === "green"
          ? "border-transparent bg-[linear-gradient(135deg,#047857_0%,#34d399_100%)] text-white"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-white text-slate-900";

  const helperCls = tone === "default" || tone === "amber" ? "text-slate-500" : "text-white/75";

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      {helper ? <div className={`mt-2 text-xs font-semibold ${helperCls}`}>{helper}</div> : null}
    </div>
  );
}

function DetailLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "text-sm font-black text-slate-900" : "text-sm font-semibold text-slate-500"}>
        {label}
      </span>
      <span className={strong ? "text-base font-black text-slate-900" : "text-sm font-black text-slate-900"}>
        {value}
      </span>
    </div>
  );
}

function SettlementRowCard({
  row,
  expanded,
  onToggle,
  onPay,
  paying,
}: {
  row: StoreSettlementRow;
  expanded: boolean;
  onToggle: () => void;
  onPay: () => void;
  paying: boolean;
}) {
  const hasMovement = row.storePayoutCOP > 0 || row.courierServicesCOP > 0;
  const isPaid = String(row.status ?? "").toUpperCase() === "PAID";
  const hasDebtToKronix = Number(row.amountDueToKronixCOP || 0) > 0;
  const hasPayoutToStore = Number(row.netToStoreCOP || 0) > 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-black text-slate-950">{row.storeName}</div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                {row.storeCode}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(row.status)}`}>
                {statusLabel(row.status)}
              </span>
            </div>

            <div className="mt-1 text-xs font-semibold text-slate-500">
              {row.city ? `${row.city.name}, ${row.city.department}` : "Vista global"} · {formatDate(row.periodStart)} - {formatDate(row.periodEnd)}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">Órdenes tienda: {row.storeOrdersCount}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">KroniX Envíos: {row.courierServicesCount}</span>
              {row.payoutInfo?.method ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Pago: {row.payoutInfo.method}</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Sin método de pago</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-right md:grid-cols-4 xl:w-[650px]">
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Ventas</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatCOP(row.storeSalesCOP)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Comisión</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatCOP(row.platformCommissionCOP)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Envíos</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatCOP(row.courierServicesCOP)}</div>
            </div>
            <div className={[
              "rounded-2xl px-3 py-2",
              hasDebtToKronix ? "bg-amber-50" : hasPayoutToStore ? "bg-emerald-50" : "bg-slate-50",
            ].join(" ")}>
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Resultado</div>
              <div className={[
                "mt-1 text-sm font-black",
                hasDebtToKronix ? "text-amber-700" : hasPayoutToStore ? "text-emerald-700" : "text-slate-900",
              ].join(" ")}>
                {hasDebtToKronix
                  ? `Debe ${formatCOP(row.amountDueToKronixCOP)}`
                  : hasPayoutToStore
                    ? `Pagar ${formatCOP(row.netToStoreCOP)}`
                    : formatCOP(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            {expanded ? "− Ocultar desglose" : "+ Ver desglose"}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {isPaid ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                Pagada {formatDateTime(row.paidAt)}
              </div>
            ) : hasMovement ? (
              <button
                type="button"
                onClick={onPay}
                disabled={paying}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {paying ? "Marcando..." : "Marcar como pagada"}
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-500">
                Sin movimiento
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-black text-slate-900">Detalle financiero</div>
              <div className="mt-3 space-y-2 text-sm">
                <DetailLine label="Ventas tienda online" value={formatCOP(row.storeSalesCOP)} />
                <DetailLine label="Comisión KroniX" value={formatCOP(row.platformCommissionCOP)} />
                <DetailLine label="Neto tienda" value={formatCOP(row.storePayoutCOP)} />
                <DetailLine label="KroniX Envíos" value={formatCOP(row.courierServicesCOP)} />
                <div className="border-t border-slate-100 pt-2" />
                <DetailLine
                  label={hasDebtToKronix ? "Tienda debe a KroniX" : "KroniX paga a tienda"}
                  value={hasDebtToKronix ? formatCOP(row.amountDueToKronixCOP) : formatCOP(row.netToStoreCOP)}
                  strong
                />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs font-semibold leading-5 text-slate-500">
                La conciliación cruza las ventas de tienda en línea contra los servicios KroniX Envíos solicitados por la tienda.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-900">Desglose KroniX Envíos</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {row.courierServicesCount} servicios · {formatCOP(row.courierServicesCOP)}
                  </div>
                </div>
              </div>

              <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(row.courierOrders ?? []).length ? (
                  (row.courierOrders ?? []).map((order) => (
                    <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-black text-slate-900">{order.shortId}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{formatDateTime(order.createdAt)}</div>
                          <div className="mt-2 line-clamp-2 text-xs font-medium text-slate-600">
                            <b>Destino:</b> {order.dropoffAddress || "Sin destino"}
                          </div>
                          {order.receiverName || order.receiverPhone ? (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {order.receiverName || "Sin receptor"} · {order.receiverPhone || "Sin teléfono"}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right text-sm font-black text-slate-900">
                          {formatCOP(order.totalCOP)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid min-h-[160px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                    <div>
                      <div className="text-sm font-black text-slate-800">Sin KroniX Envíos</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        Esta tienda no solicitó servicios en el período.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaymentConfirmModal({
  row,
  open,
  saving,
  onClose,
  onConfirm,
}: {
  row: StoreSettlementRow | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (payload: { paidMethod: string; paidReference: string; notes: string }) => void;
}) {
  const [paidMethod, setPaidMethod] = useState("TRANSFERENCIA");
  const [paidReference, setPaidReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setPaidMethod("TRANSFERENCIA");
    setPaidReference("");
    setNotes("");
  }, [open, row?.storeId, row?.periodStart, row?.periodEnd]);

  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-950 px-5 py-4 text-white">
          <div className="text-lg font-black">Confirmar conciliación</div>
          <div className="mt-1 text-sm font-semibold text-white/65">
            {row.storeName} · {formatDate(row.periodStart)} - {formatDate(row.periodEnd)}
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">KroniX paga</div>
              <div className="mt-1 text-lg font-black text-emerald-700">{formatCOP(row.netToStoreCOP)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Tienda debe</div>
              <div className="mt-1 text-lg font-black text-amber-700">{formatCOP(row.amountDueToKronixCOP)}</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Método</label>
            <select
              value={paidMethod}
              onChange={(e) => setPaidMethod(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-100"
            >
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="NEQUI">Nequi</option>
              <option value="DAVIPLATA">Daviplata</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="AJUSTE_INTERNO">Ajuste interno</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Referencia</label>
            <input
              value={paidReference}
              onChange={(e) => setPaidReference(e.target.value)}
              placeholder="Comprobante, transacción, nota interna..."
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones de conciliación..."
              className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm({ paidMethod, paidReference, notes })}
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Confirmar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreSettlementsTab() {
  const { isGlobal, citySlug: globalCitySlug } = useCtccCity();
  const [frequency, setFrequency] = useState<StoreSettlementFrequency>("WEEKLY");
  const [localCitySlug, setLocalCitySlug] = useState("");
  const [cities, setCities] = useState<AdminCityItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [data, setData] = useState<StoreSettlementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [payingStoreId, setPayingStoreId] = useState<string | null>(null);
  const [paymentRow, setPaymentRow] = useState<StoreSettlementRow | null>(null);

  const effectiveCitySlug = isGlobal ? localCitySlug : globalCitySlug;

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const res = await adminListCities({ status: "ACTIVE", page: 1, limit: 100 });
      setCities(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await adminListStoreSettlements({
        frequency,
        citySlug: effectiveCitySlug || undefined,
      });
      setData(res);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "No fue posible cargar conciliaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (!isGlobal) setLocalCitySlug(globalCitySlug || "");
  }, [isGlobal, globalCitySlug]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency, effectiveCitySlug]);

  const rows = data?.rows ?? [];
  const rowsWithMovement = useMemo(
    () => rows.filter((row) => row.storePayoutCOP > 0 || row.courierServicesCOP > 0),
    [rows]
  );

  const summary = data?.summary;
  const selectedCity = cities.find((city) => city.slug === effectiveCitySlug) ?? null;
  const cityLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.department}` : "Vista Global";

  async function confirmPayment(payload: { paidMethod: string; paidReference: string; notes: string }) {
    if (!paymentRow) return;

    setPayingStoreId(paymentRow.storeId);
    setError(null);

    try {
      await adminMarkStoreSettlementPaid({
        storeId: paymentRow.storeId,
        frequency,
        periodStart: String(paymentRow.periodStart ?? ""),
        periodEnd: String(paymentRow.periodEnd ?? ""),
        paidMethod: payload.paidMethod,
        paidReference: payload.paidReference.trim() || null,
        notes: payload.notes.trim() || null,
      });
      setPaymentRow(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible marcar la conciliación como pagada.");
    } finally {
      setPayingStoreId(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] p-5 text-white md:p-6">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-[-90px] left-[30%] h-52 w-52 rounded-full bg-emerald-400/15 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200">
                Pagos y conciliaciones
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
                Conciliación KroniX ↔ Tiendas
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                Cruza ventas de Tienda en Línea, comisión KroniX y servicios KroniX Envíos solicitados por la tienda.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/20">
                  {cityLabel}
                </span>
                <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-200 ring-1 ring-sky-400/20">
                  {data?.range ? `${formatDate(data.range.from)} - ${formatDate(data.range.to)}` : "Rango activo"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "⟳ Actualizar"}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <FrequencyButton
                active={frequency === "WEEKLY"}
                label="Semanal"
                helper="Todas las semanas"
                onClick={() => setFrequency("WEEKLY")}
              />
              <FrequencyButton
                active={frequency === "BIWEEKLY"}
                label="Quincenal"
                helper="Todos los cortes"
                onClick={() => setFrequency("BIWEEKLY")}
              />
              <FrequencyButton
                active={frequency === "MONTHLY"}
                label="Mensual"
                helper="Todos los meses"
                onClick={() => setFrequency("MONTHLY")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-bold text-slate-600">Ciudad</label>
              <select
                value={effectiveCitySlug || ""}
                disabled={!isGlobal || citiesLoading}
                onChange={(e) => setLocalCitySlug(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">Vista Global</option>
                {cities.map((city) => (
                  <option key={city.slug} value={city.slug}>
                    {city.name}, {city.department}
                  </option>
                ))}
              </select>
              {!isGlobal ? <span className="text-xs font-semibold text-slate-500">Bloqueado por selector superior</span> : null}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Por conciliar"
          value={loading ? "..." : formatCOP(summary?.amountDueToKronixCOP ?? 0)}
          helper="Valor que las tiendas deben a KroniX."
          tone="dark"
        />
        <KpiCard
          label="Períodos con movimiento"
          value={loading ? "..." : rowsWithMovement.length}
          helper={`${summary?.storesWithMovement ?? 0} registros acumulados.`}
        />
        <KpiCard
          label="KroniX Envíos"
          value={loading ? "..." : formatCOP(summary?.courierServicesCOP ?? 0)}
          helper={`${summary?.courierServicesCount ?? 0} servicios en los períodos.`}
          tone="blue"
        />
        <KpiCard
          label="Neto a tiendas"
          value={loading ? "..." : formatCOP(summary?.netToStoreCOP ?? 0)}
          helper="Valor estimado a pagar a comercios."
          tone="green"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xl font-black text-slate-950">Resumen por período y tienda</div>
            <div className="mt-1 text-sm font-medium text-slate-500">
              {loading
                ? "Cargando conciliaciones..."
                : `${rowsWithMovement.length} períodos con movimiento · ${rows.length} períodos revisados`}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
            {frequencyLabel(frequency)}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div>
                <div className="text-lg font-black text-slate-800">Cargando conciliaciones...</div>
                <div className="mt-2 text-sm font-semibold text-slate-500">Estamos cruzando ventas, comisiones y servicios courier.</div>
              </div>
            </div>
          ) : rowsWithMovement.length ? (
            rowsWithMovement.map((row) => {
              const key = settlementKey(row);

              return (
                <SettlementRowCard
                  key={key}
                  row={row}
                  expanded={Boolean(expanded[key])}
                  paying={payingStoreId === row.storeId}
                  onToggle={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                  onPay={() => setPaymentRow(row)}
                />
              );
            })
          ) : (
            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div>
                <div className="text-lg font-black text-slate-800">Sin movimientos en este período</div>
                <div className="mt-2 text-sm font-semibold text-slate-500">
                  Cuando las tiendas tengan ventas o usen KroniX Envíos, aparecerán aquí para conciliación.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <PaymentConfirmModal
        open={Boolean(paymentRow)}
        row={paymentRow}
        saving={Boolean(payingStoreId)}
        onClose={() => setPaymentRow(null)}
        onConfirm={confirmPayment}
      />
    </div>
  );
}

