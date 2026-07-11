//app\(cc)\orders\components\OrderDetailsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cancelAdminOrder,
  forceAdminOrderState,
  getAdminOrder,
  getAdminOrderMetrics,
  getAdminOrderTimeline,
  listAdminDrivers,
  reassignAdminDriver,
  unassignAdminDriver,
  type AdminDriverOption,
  type MetricsResponse,
  type TimelineEvent,
  getOrderServiceMeta,
  getWorkerTypeLabel,
} from "../lib/ordersApi";

function formatCOP(n?: number | null) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("es-CO");
}

function pickCustomer(order: any) {
  const u = order?.customer ?? order?.user ?? order?.buyer ?? order?.client ?? null;
  const name = u?.name ?? u?.fullName ?? u?.displayName ?? order?.customerName ?? null;
  const email = u?.email ?? order?.customerEmail ?? null;
  const phone = u?.phone ?? order?.customerPhone ?? null;
  return {
    name: name ? String(name) : "—",
    email: email ? String(email) : "",
    phone: phone ? String(phone) : "",
  };
}

function pickAddress(order: any) {
  const a =
    order?.dropoffAddress ??
    order?.deliveryAddress ??
    order?.address ??
    order?.shippingAddress ??
    order?.dropoff?.address ??
    null;

  if (!a) return "—";
  if (typeof a === "string") return a;

  const line1 = a?.line1 ?? a?.address1 ?? a?.street ?? a?.addressLine1 ?? "";
  const line2 = a?.line2 ?? a?.address2 ?? a?.addressLine2 ?? "";
  const city = a?.city ?? a?.town ?? "";
  const dept = a?.state ?? a?.region ?? "";
  const out = [line1, line2, city, dept]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
  return out || "—";
}

function pickStores(order: any) {
  if (Array.isArray(order?.pickups) && order.pickups.length) {
    const names = order.pickups
      .map((p: any) => p?.store?.name ?? p?.storeName ?? null)
      .filter(Boolean)
      .map((x: any) => String(x));
    return names.length ? names.join(", ") : "—";
  }

  if (Array.isArray(order?.stores) && order.stores.length) {
    const names = order.stores
      .map((s: any) => s?.name ?? s?.store?.name ?? s?.storeName ?? null)
      .filter(Boolean)
      .map((x: any) => String(x));
    return names.length ? names.join(", ") : "—";
  }

  if (typeof order?.storeSummary === "string" && order.storeSummary.trim()) {
    return order.storeSummary.trim();
  }

  return "—";
}

function getOrderCityInfo(order: any) {
  const cityId =
    order?.cityId ??
    order?.city?.id ??
    order?.store?.cityId ??
    order?.store?.city?.id ??
    order?.pickup?.store?.cityId ??
    null;

  const citySlug =
    order?.city?.slug ??
    order?.store?.city?.slug ??
    order?.pickup?.store?.city?.slug ??
    null;

  const cityName =
    order?.city?.name ??
    order?.store?.city?.name ??
    order?.pickup?.store?.city?.name ??
    null;

  const department =
    order?.city?.department ??
    order?.store?.city?.department ??
    order?.pickup?.store?.city?.department ??
    null;

  return {
    cityId: cityId ? String(cityId) : "",
    citySlug: citySlug ? String(citySlug) : "",
    cityName: cityName ? String(cityName) : "",
    department: department ? String(department) : "",
  };
}

function getDriverCityInfo(driver: AdminDriverOption | null | undefined) {
  if (!driver) {
    return {
      cityId: "",
      citySlug: "",
      cityName: "",
      department: "",
    };
  }

  return {
    cityId: driver.cityId ? String(driver.cityId) : "",
    citySlug: driver.city?.slug ? String(driver.city.slug) : "",
    cityName: driver.city?.name ? String(driver.city.name) : "",
    department: driver.city?.department ? String(driver.city.department) : "",
  };
}

function sameCity(order: any, driver: AdminDriverOption | null | undefined) {
  const o = getOrderCityInfo(order);
  const d = getDriverCityInfo(driver);

  if (o.cityId && d.cityId) return o.cityId === d.cityId;
  if (o.citySlug && d.citySlug) return o.citySlug.toLowerCase() === d.citySlug.toLowerCase();
  if (o.cityName && d.cityName) return o.cityName.trim().toLowerCase() === d.cityName.trim().toLowerCase();

  return false;
}

const STATUS_OPTIONS = ["", "AVAILABLE", "ASSIGNED", "EN_ROUTE", "DELIVERED", "CANCELLED"];
const FLOW_OPTIONS = [
  "",
  "WAITING_CONFIRMATION",
  "STORE_CONFIRMED",
  "PAYMENT_PENDING",
  "PAYMENT_FAILED",
  "PREPARING",
  "EN_ROUTE",
  "DELIVERED",
  "CANCELLED",
  "PAID",
];
const PAYMENT_OPTIONS = ["", "PENDING", "PAID", "FAILED"];

function buildForceSuggestions(input: {
  currentStatus?: string | null;
  currentFlow?: string | null;
  currentPayment?: string | null;
  hasDriver: boolean;
  nextStatus?: string;
  nextFlow?: string;
  nextPayment?: string;
}) {
  const currentStatus = String(input.currentStatus ?? "").toUpperCase();
  const currentFlow = String(input.currentFlow ?? "").toUpperCase();
  const currentPayment = String(input.currentPayment ?? "").toUpperCase();

  const nextStatus = String(input.nextStatus || currentStatus).toUpperCase();
  const nextFlow = String(input.nextFlow || currentFlow).toUpperCase();
  const nextPayment = String(input.nextPayment || currentPayment).toUpperCase();

  const messages: Array<{ kind: "warn" | "info"; text: string }> = [];

  if (nextPayment && nextPayment !== "PAID" && ["ASSIGNED", "EN_ROUTE", "DELIVERED"].includes(nextStatus)) {
    messages.push({
      kind: "warn",
      text: "Una orden con pago distinto de PAID no puede quedar ASSIGNED, EN_ROUTE o DELIVERED.",
    });
  }

  if (nextStatus === "AVAILABLE" && nextPayment !== "PAID") {
    messages.push({
      kind: "warn",
      text: "AVAILABLE requiere paymentStatus=PAID para que la orden sea coherente.",
    });
  }

  if (nextStatus === "EN_ROUTE" && !input.hasDriver) {
    messages.push({
      kind: "warn",
      text: "EN_ROUTE requiere un driver asignado.",
    });
  }

  if (nextStatus === "DELIVERED" && nextPayment !== "PAID") {
    messages.push({
      kind: "warn",
      text: "DELIVERED requiere paymentStatus=PAID.",
    });
  }

  if (nextFlow === "DELIVERED" && nextPayment !== "PAID") {
    messages.push({
      kind: "warn",
      text: "flowStatus DELIVERED requiere paymentStatus=PAID.",
    });
  }

  if (nextStatus === "AVAILABLE" && input.hasDriver) {
    messages.push({
      kind: "info",
      text: "Si aplicas AVAILABLE, el backend limpiará conductor, asignación y ubicación GPS del driver.",
    });
  }

  if ((nextStatus === "CANCELLED" || nextFlow === "CANCELLED") && input.hasDriver) {
    messages.push({
      kind: "info",
      text: "Si cancelas la orden, el backend limpiará conductor, asignación y ubicación GPS.",
    });
  }

  if (nextPayment === "FAILED" && input.hasDriver) {
    messages.push({
      kind: "warn",
      text: "Si el pago falla, no debería quedar conductor asignado. Considera desasignar o cancelar la orden.",
    });
  }

  return messages;
}

export default function OrderDetailsModal(props: {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { orderId, onClose, onRefresh } = props;

  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [cancelReason, setCancelReason] = useState("");
  const [busyCancel, setBusyCancel] = useState(false);

  const [drivers, setDrivers] = useState<AdminDriverOption[]>([]);
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [driversLoaded, setDriversLoaded] = useState(false);
  const [busyReassign, setBusyReassign] = useState(false);
  const [busyUnassign, setBusyUnassign] = useState(false);

  const [forceStatus, setForceStatus] = useState("");
  const [forceFlow, setForceFlow] = useState("");
  const [forcePayment, setForcePayment] = useState("");
  const [busyForce, setBusyForce] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const o = await getAdminOrder(orderId);
      const t = await getAdminOrderTimeline(orderId);
      const m = await getAdminOrderMetrics(orderId);

      setOrder(o?.order ?? o);
      setTimeline(t?.events ?? []);
      setMetrics(m ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    (async () => {
      if (driversLoaded) return;
      try {
        const list = await listAdminDrivers({ status: "ACTIVE", limit: 200 });
        setDrivers(list);
      } finally {
        setDriversLoaded(true);
      }
    })();
  }, [driversLoaded]);

  const customer = useMemo(() => pickCustomer(order), [order]);
  const addressText = useMemo(() => pickAddress(order), [order]);
  const storesText = useMemo(() => pickStores(order), [order]);
  const orderCity = useMemo(() => getOrderCityInfo(order), [order]);

  const driverFromList = useMemo(() => {
    const id = String(order?.driverId ?? "").trim();
    if (!id) return null;
    return drivers.find((d) => d.id === id) ?? null;
  }, [order?.driverId, drivers]);

  const driverName =
    driverFromList?.name && driverFromList.name.trim()
      ? driverFromList.name.trim()
      : order?.driverId
        ? `Driver ${String(order.driverId).slice(0, 8)}…`
        : "—";

  const driverPlate = driverFromList?.plate ? String(driverFromList.plate) : "";
  const driverCityText = useMemo(() => {
    const info = getDriverCityInfo(driverFromList);
    if (info.cityName && info.department) return `${info.cityName}, ${info.department}`;
    if (info.cityName) return info.cityName;
    return "";
  }, [driverFromList]);

  const driversSameCity = useMemo(() => {
    if (!orderCity.cityId && !orderCity.citySlug && !orderCity.cityName) {
      return [];
    }
    return drivers.filter((d) => sameCity(order, d));
  }, [drivers, order, orderCity]);

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return drivers.find((d) => d.id === selectedDriverId) ?? null;
  }, [drivers, selectedDriverId]);

  const selectedDriverMatchesOrderCity = useMemo(() => {
    if (!selectedDriver) return false;
    return sameCity(order, selectedDriver);
  }, [order, selectedDriver]);

  const selectedDriverCityText = useMemo(() => {
    const info = getDriverCityInfo(selectedDriver);
    if (info.cityName && info.department) return `${info.cityName}, ${info.department}`;
    if (info.cityName) return info.cityName;
    return "";
  }, [selectedDriver]);

  const driverFiltered = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    const base = driversSameCity;

    if (!q) return base.slice(0, 30);

    return base
      .filter((d) => {
        const cityInfo = getDriverCityInfo(d);
        const hay = `${d.name} ${d.plate ?? ""} ${d.id} ${cityInfo.cityName} ${cityInfo.department}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 30);
  }, [driversSameCity, driverQuery]);

  const hasDriver = !!order?.driverId;
  const isPaid = String(order?.paymentStatus ?? "").toUpperCase() === "PAID";
  const serviceMeta = useMemo(() => getOrderServiceMeta(order), [order]);

  const forceSuggestions = useMemo(
    () =>
      buildForceSuggestions({
        currentStatus: order?.status,
        currentFlow: order?.flowStatus,
        currentPayment: order?.paymentStatus,
        hasDriver: !!order?.driverId,
        nextStatus: forceStatus,
        nextFlow: forceFlow,
        nextPayment: forcePayment,
      }),
    [order, forceStatus, forceFlow, forcePayment]
  );

  const orderCityText = useMemo(() => {
    if (orderCity.cityName && orderCity.department) return `${orderCity.cityName}, ${orderCity.department}`;
    if (orderCity.cityName) return orderCity.cityName;
    return "—";
  }, [orderCity]);

  async function doCancel() {
    setBusyCancel(true);
    setErrorMessage(null);

    try {
      await cancelAdminOrder(orderId, cancelReason);
      await loadAll();
      onRefresh();
    } catch (err: any) {
      setErrorMessage(
        err?.message || "No se pudo cancelar la orden."
      );
    } finally {
      setBusyCancel(false);
    }
  }

  async function doReassign() {
    if (!selectedDriverId) return;

    if (!selectedDriverMatchesOrderCity) {
      setErrorMessage("No puedes reasignar un driver de una ciudad diferente a la de la orden.");
      return;
    }

    setBusyReassign(true);
    setErrorMessage(null);

    try {
      await reassignAdminDriver(orderId, selectedDriverId);
      await loadAll();
      onRefresh();
    } catch (err: any) {
      setErrorMessage(
        err?.message || "No se pudo reasignar el driver."
      );
    } finally {
      setBusyReassign(false);
    }
  }

  async function doUnassign() {
    setBusyUnassign(true);
    setErrorMessage(null);

    try {
      await unassignAdminDriver(orderId);
      await loadAll();
      onRefresh();
    } catch (err: any) {
      setErrorMessage(
        err?.message || "No se pudo desasignar el driver."
      );
    } finally {
      setBusyUnassign(false);
    }
  }

  async function doForce() {
    if (!forceStatus && !forceFlow && !forcePayment) return;

    setBusyForce(true);
    setErrorMessage(null);

    try {
      await forceAdminOrderState(orderId, {
        status: forceStatus || undefined,
        flowStatus: forceFlow || undefined,
        paymentStatus: forcePayment || undefined,
      });

      await loadAll();
      onRefresh();
    } catch (err: any) {
      const msg =
        err?.message ||
        "No se pudo aplicar el cambio. Verifica la coherencia del estado.";

      setErrorMessage(msg);
    } finally {
      setBusyForce(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[1100px] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">KroniX Control Center</div>
            <div className="mt-1 truncate text-lg font-semibold">
              Orden <span className="font-mono text-base">{orderId}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                status: <span className="font-semibold text-slate-900">{order?.status ?? "—"}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                flow: <span className="font-semibold text-slate-900">{order?.flowStatus ?? "—"}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                pay: <span className="font-semibold text-slate-900">{order?.paymentStatus ?? "—"}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                total:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCOP(order?.totalCOP ?? order?.total)}
                </span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                ciudad: <span className="font-semibold text-slate-900">{orderCityText}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {formatDate(order?.createdAt ?? order?.createdAtISO ?? order?.createdAtIso)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto bg-slate-50 px-6 py-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              Cargando detalle…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Detalle completo</div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <div className="flex flex-wrap items-center gap-2">
    <div className="text-xs font-semibold text-slate-600">Servicio</div>
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        serviceMeta.className,
      ].join(" ")}
    >
      {serviceMeta.label}
    </span>
  </div>

  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
    <div>
      <div className="text-xs font-semibold text-slate-600">Tipo de orden</div>
      <div className="mt-1 text-sm text-slate-900">{order?.orderType ?? "—"}</div>
    </div>

    <div>
      <div className="text-xs font-semibold text-slate-600">Service type</div>
      <div className="mt-1 text-sm text-slate-900">{order?.serviceType ?? "—"}</div>
    </div>

    {String(order?.orderType ?? "").toUpperCase() === "COURIER" ? (
      <div>
        <div className="text-xs font-semibold text-slate-600">Tipo de Worker</div>
        <div className="mt-1 text-sm text-slate-900">
          {getWorkerTypeLabel(order?.requiredWorkerType)}
        </div>
      </div>
    ) : null}

    {order?.courierServiceType ? (
      <div>
        <div className="text-xs font-semibold text-slate-600">
          Courier service type (legacy)
        </div>
        <div className="mt-1 text-sm text-slate-900">
          {order.courierServiceType}
        </div>
      </div>
    ) : null}

    {String(order?.orderType ?? "").toUpperCase() === "COURIER" ? (
      <>
        <div>
          <div className="text-xs font-semibold text-slate-600">Origen</div>
          <div className="mt-1 text-sm text-slate-900">
            {order?.pickupPlaceName || order?.pickupAddress || "—"}
          </div>
          {order?.pickupReference ? (
            <div className="mt-1 text-xs text-slate-500">
              Referencia: {order.pickupReference}
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600">Destino</div>
          <div className="mt-1 text-sm text-slate-900">
            {order?.dropoffPlaceName || order?.dropoffAddress || "—"}
          </div>
          {order?.dropoffReference ? (
            <div className="mt-1 text-xs text-slate-500">
              Referencia: {order.dropoffReference}
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600">Tipo de paquete</div>
          <div className="mt-1 text-sm text-slate-900">{order?.packageType || "—"}</div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600">Descripción</div>
          <div className="mt-1 text-sm text-slate-900">
            {order?.packageDescription || order?.customerNote || "—"}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600">Remitente</div>
          <div className="mt-1 text-sm text-slate-900">
            {order?.senderName || "—"}
            {order?.senderPhone ? ` • ${order.senderPhone}` : ""}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600">Destinatario</div>
          <div className="mt-1 text-sm text-slate-900">
            {order?.receiverName || "—"}
            {order?.receiverPhone ? ` • ${order.receiverPhone}` : ""}
          </div>
        </div>
      </>
    ) : null}
  </div>
</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-600">Cliente</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{customer.name}</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {[customer.email, customer.phone].filter(Boolean).join(" • ") || "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-600">Dirección</div>
                      <div className="mt-1 text-sm text-slate-900">{addressText}</div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-600">Stores</div>
                      <div className="mt-1 text-sm text-slate-900">{storesText}</div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-600">Driver</div>
                      <div className="mt-1 text-sm text-slate-900">{driverName}</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {driverPlate
                          ? `Placa: ${driverPlate}`
                          : order?.driverId
                            ? `ID: ${String(order.driverId).slice(0, 10)}…`
                            : "—"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {driverCityText ? `Ciudad: ${driverCityText}` : "Ciudad: —"}
                      </div>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">
                      Ver JSON (debug)
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
{JSON.stringify(order, null, 2)}
                    </pre>
                  </details>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Timeline completo</div>

                  <div className="mt-3 space-y-3">
                    {timeline.length ? (
                      timeline.map((ev, idx) => (
                        <div key={idx} className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs text-slate-600">{formatDate(ev.at)}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{ev.label}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        Sin eventos.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Métricas por orden</div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Prep time</span>
                      <span className="font-semibold">{metrics?.prepMinutes ?? "—"} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Delivery time</span>
                      <span className="font-semibold">{metrics?.deliveryMinutes ?? "—"} min</span>
                    </div>
                    <div className="my-2 h-px bg-slate-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Comisión plataforma</span>
                      <span className="font-semibold">{formatCOP(metrics?.platformCommissionCOP ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ganancia neta</span>
                      <span className="font-semibold">{formatCOP(metrics?.platformRevenueNetCOP ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ganancia total</span>
                      <span className="font-semibold">{formatCOP(metrics?.platformRevenueGrossCOP ?? null)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">Acciones</div>

                  {errorMessage ? (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">Cancelar manual</div>
                    <textarea
                      className="mt-2 h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="Motivo (opcional)"
                      value={cancelReason}
                      onChange={(e) => {
                        setCancelReason(e.target.value);
                        setErrorMessage(null);
                      }}
                    />
                    <button
                      onClick={doCancel}
                      disabled={busyCancel}
                      className="mt-2 h-10 w-full rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyCancel ? "Cancelando…" : "Cancelar orden"}
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">Reasignar driver</div>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                      Solo se muestran drivers de la misma ciudad de la orden:
                      <span className="ml-1 font-semibold text-slate-900">{orderCityText}</span>
                    </div>

                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="Escribe nombre/placa…"
                      value={driverQuery}
                      onChange={(e) => {
                        setDriverQuery(e.target.value);
                        setErrorMessage(null);
                      }}
                    />

                    <div className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white">
                      {driversLoaded && drivers.length === 0 ? (
                        <div className="p-3 text-xs text-slate-600">
                          No se pudo cargar la lista de drivers (revisa permisos/endpoint).
                        </div>
                      ) : null}

                      {driversLoaded && drivers.length > 0 && !orderCity.cityId && !orderCity.citySlug && !orderCity.cityName ? (
                        <div className="p-3 text-xs text-amber-700">
                          Esta orden no trae ciudad identificable. No se permite reasignar hasta tener cityId/city en el detalle de la orden.
                        </div>
                      ) : null}

                      {driversLoaded &&
                      (orderCity.cityId || orderCity.citySlug || orderCity.cityName) &&
                      driversSameCity.length === 0 ? (
                        <div className="p-3 text-xs text-slate-600">
                          No hay drivers activos disponibles para la ciudad de esta orden.
                        </div>
                      ) : null}

                      {driverFiltered.map((d) => {
                        const active = selectedDriverId === d.id;
                        const info = getDriverCityInfo(d);
                        const cityText =
                          info.cityName && info.department
                            ? `${info.cityName}, ${info.department}`
                            : info.cityName || "Ciudad no disponible";

                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setSelectedDriverId(d.id);
                              setErrorMessage(null);
                            }}
                            className={[
                              "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50",
                              active ? "bg-slate-100" : "",
                            ].join(" ")}
                          >
                            <span className="min-w-0">
                              <span className="block font-medium text-slate-900">{d.name}</span>
                              <span className="block text-xs text-slate-500">{cityText}</span>
                            </span>
                            <span className="text-xs text-slate-600">
                              {d.plate ? d.plate : d.id.slice(0, 8)}
                              {typeof d.isActive === "boolean"
                                ? d.isActive
                                  ? " • activo"
                                  : " • inactivo"
                                : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedDriverId ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                        Driver seleccionado:
                        <span className="ml-1 font-semibold text-slate-900">
                          {selectedDriver?.name ?? "—"}
                        </span>
                        {selectedDriverCityText ? (
                          <span className="ml-2 text-slate-500">({selectedDriverCityText})</span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={doReassign}
                        disabled={
                          busyReassign ||
                          !selectedDriverId ||
                          !selectedDriverMatchesOrderCity ||
                          (!orderCity.cityId && !orderCity.citySlug && !orderCity.cityName)
                        }
                        className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                      >
                        {busyReassign ? "Reasignando…" : "Reasignar"}
                      </button>

                      <button
                        onClick={doUnassign}
                        disabled={busyUnassign || !order?.driverId}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                      >
                        {busyUnassign ? "Quitando…" : "Desasignar"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      Desasignar dejará la orden en AVAILABLE + PREPARING y limpiará GPS/asignación del driver.
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">
                      Forzar cambio de estado (emergencia)
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        value={forceStatus}
                        onChange={(e) => {
                          setForceStatus(e.target.value);
                          setErrorMessage(null);
                        }}
                      >
                        {STATUS_OPTIONS.map((x) => {
                          let disabled = false;
                          let label = x ? x : "status (opcional)";

                          if (x === "ASSIGNED" && !hasDriver) {
                            disabled = true;
                            label = "ASSIGNED (requiere driver)";
                          }

                          if (x === "AVAILABLE" && !isPaid) {
                            disabled = true;
                            label = "AVAILABLE (requiere pago PAID)";
                          }

                          if (x === "EN_ROUTE" && !hasDriver) {
                            disabled = true;
                            label = "EN_ROUTE (requiere driver)";
                          }

                          if (x === "DELIVERED" && (!hasDriver || !isPaid)) {
                            disabled = true;
                            label = !hasDriver
                              ? "DELIVERED (requiere driver)"
                              : "DELIVERED (requiere pago PAID)";
                          }

                          return (
                            <option key={x} value={x} disabled={disabled}>
                              {label}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        value={forceFlow}
                        onChange={(e) => {
                          setForceFlow(e.target.value);
                          setErrorMessage(null);
                        }}
                      >
                        {FLOW_OPTIONS.map((x) => {
                          let disabled = false;
                          let label = x ? x : "flowStatus (opcional)";

                          if (x === "EN_ROUTE" && !hasDriver) {
                            disabled = true;
                            label = "EN_ROUTE (requiere driver)";
                          }

                          if (x === "DELIVERED" && (!hasDriver || !isPaid)) {
                            disabled = true;
                            label = !hasDriver
                              ? "DELIVERED (requiere driver)"
                              : "DELIVERED (requiere pago PAID)";
                          }

                          return (
                            <option key={x} value={x} disabled={disabled}>
                              {label}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        value={forcePayment}
                        onChange={(e) => {
                          setForcePayment(e.target.value);
                          setErrorMessage(null);
                        }}
                      >
                        {PAYMENT_OPTIONS.map((x) => (
                          <option key={x} value={x}>
                            {x ? x : "paymentStatus (opcional)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {forceSuggestions.length ? (
                      <div className="mt-3 space-y-2">
                        {forceSuggestions.map((msg, idx) => (
                          <div
                            key={idx}
                            className={[
                              "rounded-xl px-3 py-2 text-xs",
                              msg.kind === "warn"
                                ? "border border-amber-200 bg-amber-50 text-amber-900"
                                : "border border-sky-200 bg-sky-50 text-sky-900",
                            ].join(" ")}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <button
                      onClick={doForce}
                      disabled={busyForce || (!forceStatus && !forceFlow && !forcePayment)}
                      className="mt-3 h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      {busyForce ? "Aplicando…" : "Aplicar cambios"}
                    </button>

                    <p className="mt-2 text-xs text-slate-600">
                      Tip: si dejas una orden en AVAILABLE o CANCELLED, el backend limpiará conductor y ubicación del driver.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-3 text-xs text-slate-500">
          {loading ? "Cargando…" : "Listo."}
        </div>
      </div>
    </div>
  );
}