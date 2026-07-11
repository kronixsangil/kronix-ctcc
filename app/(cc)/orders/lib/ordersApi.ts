// app/(cc)/orders/lib/ordersApi.ts
// app/(cc)/orders/lib/ordersApi.ts
"use client";

import { apiFetch } from "@/lib/api";
import type { CtccCity } from "@/app/(cc)/cities/lib/citiesApi";

export type AdminOrderRow = {
  id: string;
  createdAt?: string | null;

  status?: string | null;
  flowStatus?: string | null;
  paymentStatus?: string | null;

  orderType?: string | null;

  // Nueva arquitectura multiservicio KRONIX.
  serviceType?: string | null;
  requiredWorkerType?: string | null;
  workerCommissionCOP?: number | null;

  // Campo legacy temporal para órdenes antiguas.
  courierServiceType?: string | null;

  packageType?: string | null;
  packageDescription?: string | null;

  pickupAddress?: string | null;
  pickupPlaceName?: string | null;
  pickupReference?: string | null;

  dropoffAddress?: string | null;
  dropoffPlaceName?: string | null;
  dropoffReference?: string | null;

  senderName?: string | null;
  senderPhone?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;

  totalCOP?: number | null;

  storeSummary?: string | null;
  driverSummary?: string | null;

  driverId?: string | null;

  cityId?: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
};


export type OrderServiceMeta = {
  key: string;
  label: string;
  className: string;
};

function normalizeServiceValue(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

/**
 * Fuente visual centralizada para el módulo Órdenes del CTCC.
 * Prioriza serviceType (arquitectura nueva) y usa courierServiceType
 * únicamente como respaldo para registros legacy.
 */
export function getOrderServiceMeta(order: {
  orderType?: unknown;
  serviceType?: unknown;
  courierServiceType?: unknown;
}): OrderServiceMeta {
  const orderType = normalizeServiceValue(order?.orderType || "STORE");
  const serviceType = normalizeServiceValue(order?.serviceType);
  const courierServiceType = normalizeServiceValue(order?.courierServiceType);

  if (orderType === "STORE" || serviceType === "STORE") {
    return {
      key: "STORE",
      label: "Tienda en línea",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (serviceType === "DELIVERY") {
    return {
      key: "DELIVERY",
      label: "Domicilio Express",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (serviceType === "PACKAGE") {
    return {
      key: "PACKAGE",
      label: "KroniX Envíos",
      className: "bg-cyan-50 text-cyan-700",
    };
  }

  if (serviceType === "TAXI") {
    return {
      key: "TAXI",
      label: "Taxi",
      className: "bg-amber-50 text-amber-800",
    };
  }

  if (serviceType === "MOTORCARGO") {
    return {
      key: "MOTORCARGO",
      label: "Motocarga",
      className: "bg-violet-50 text-violet-700",
    };
  }

  // Compatibilidad temporal con órdenes creadas antes de serviceType.
  if (courierServiceType === "SEND_PACKAGE") {
    return {
      key: "PACKAGE",
      label: "KroniX Envíos",
      className: "bg-cyan-50 text-cyan-700",
    };
  }

  if (courierServiceType === "PICKUP_AND_DELIVERY") {
    return {
      key: "DELIVERY",
      label: "Domicilio Express",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    key: serviceType || courierServiceType || "COURIER",
    label: serviceType || "Servicio legado",
    className: "bg-slate-100 text-slate-700",
  };
}

export function getWorkerTypeLabel(workerType?: unknown) {
  const value = normalizeServiceValue(workerType);

  if (value === "MOTORCYCLE") return "Domiciliario";
  if (value === "TAXI") return "Taxista";
  if (value === "MOTORCARGO") return "Motocarguero";

  return value || "—";
}

export type TimelineEvent = {
  at: string;
  type: string;
  label: string;
  meta?: any;
};

export type MetricsResponse = {
  prepMinutes: number | null;
  deliveryMinutes: number | null;
  platformCommissionCOP: number | null;
  platformRevenueNetCOP: number | null;
  platformRevenueGrossCOP: number | null;
};

export type AdminDriverOption = {
  id: string;
  name: string;
  plate?: string | null;
  isActive?: boolean | null;
  cityId?: string | null;
  city?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    department?: string | null;
    country?: string | null;
  } | null;
};

export type OrdersQuery = {
  q?: string;
  status?: string;
  flowStatus?: string;
  paymentStatus?: string;
  serviceType?: string;
  store?: string;
  driver?: string;
  city?: string;
  citySlug?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

function qs(obj: Record<string, any>) {
  const p = new URLSearchParams();

  Object.entries(obj).forEach(([k, v]) => {
    const s = String(v ?? "").trim();
    if (s) p.set(k, s);
  });

  const out = p.toString();
  return out ? `?${out}` : "";
}

export async function listAdminOrders(input: OrdersQuery) {
  const query = qs({
    q: input.q,
    status: input.status,
    flowStatus: input.flowStatus,
    paymentStatus: input.paymentStatus,
    serviceType: input.serviceType,
    store: input.store,
    driver: input.driver,
    citySlug: input.citySlug,
    from: input.from,
    to: input.to,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });

  const r = await apiFetch<any>(`/admin/orders${query}`, { method: "GET" });

  const items: AdminOrderRow[] = (r?.items ?? []).map((x: any) => ({
    id: String(x?.id ?? ""),
    createdAt: x?.createdAt ? new Date(x.createdAt).toISOString() : null,
    status: x?.status ?? null,
    flowStatus: x?.flowStatus ?? null,
    paymentStatus: x?.paymentStatus ?? null,

    orderType: x?.orderType ?? null,
    serviceType: x?.serviceType ?? null,
    requiredWorkerType: x?.requiredWorkerType ?? null,
    workerCommissionCOP:
      typeof x?.workerCommissionCOP === "number" ? x.workerCommissionCOP : null,
    courierServiceType: x?.courierServiceType ?? null,

    packageType: x?.packageType ?? null,
    packageDescription: x?.packageDescription ?? null,

    pickupAddress: x?.pickupAddress ?? null,
    pickupPlaceName: x?.pickupPlaceName ?? null,
    pickupReference: x?.pickupReference ?? null,

    dropoffAddress: x?.dropoffAddress ?? null,
    dropoffPlaceName: x?.dropoffPlaceName ?? null,
    dropoffReference: x?.dropoffReference ?? null,

    senderName: x?.senderName ?? null,
    senderPhone: x?.senderPhone ?? null,
    receiverName: x?.receiverName ?? null,
    receiverPhone: x?.receiverPhone ?? null,

    totalCOP: typeof x?.totalCOP === "number" ? x.totalCOP : null,
    storeSummary: x?.storeSummary ?? null,
    driverSummary: x?.driverSummary ?? null,
    driverId: x?.driverId ?? null,
    cityId: x?.cityId ?? null,
    city: x?.city
      ? {
          id: x.city.id,
          slug: x.city.slug,
          name: x.city.name,
          department: x.city.department,
          country: x.city.country,
        }
      : null,
  }));

  return {
    ok: !!r?.ok,
    page: r?.page ?? 1,
    limit: r?.limit ?? 20,
    total: r?.total ?? items.length,
    items,
  };
}

export async function getAdminOrder(orderId: string) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

export async function getAdminOrderTimeline(orderId: string) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/timeline`, { method: "GET" });
}

export async function getAdminOrderMetrics(orderId: string): Promise<MetricsResponse> {
  const r = await apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/metrics`, {
    method: "GET",
  });

  return {
    prepMinutes: typeof r?.prepMinutes === "number" ? r.prepMinutes : null,
    deliveryMinutes: typeof r?.deliveryMinutes === "number" ? r.deliveryMinutes : null,
    platformCommissionCOP:
      typeof r?.platform?.commissionCOP === "number" ? r.platform.commissionCOP : null,
    platformRevenueNetCOP:
      typeof r?.platform?.revenueNetCOP === "number" ? r.platform.revenueNetCOP : null,
    platformRevenueGrossCOP:
      typeof r?.platform?.revenueGrossCOP === "number" ? r.platform.revenueGrossCOP : null,
  };
}

export async function cancelAdminOrder(orderId: string, reason?: string) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

export async function reassignAdminDriver(
  orderId: string,
  driverId?: string | null
) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/reassign-driver`, {
    method: "POST",
    body: JSON.stringify({ driverId: driverId ?? undefined }),
  });
}

export async function unassignAdminDriver(orderId: string, note?: string) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/reassign-driver`, {
    method: "POST",
    body: JSON.stringify({ unassign: true, note: note ?? "" }),
  });
}

export async function forceAdminOrderState(
  orderId: string,
  body: { status?: string; flowStatus?: string; paymentStatus?: string; note?: string }
) {
  return apiFetch<any>(`/admin/orders/${encodeURIComponent(orderId)}/force-status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listAdminDrivers(input?: {
  q?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  limit?: number;
}): Promise<AdminDriverOption[]> {
  const query = qs({
    q: input?.q ?? "",
    status: input?.status ?? "ACTIVE",
    page: input?.page ?? 1,
    limit: input?.limit ?? 200,
  });

  const r = await apiFetch<any>(`/drivers/admin/list${query}`, { method: "GET" });

  const items = (r?.items ?? r?.data ?? r?.results ?? []) as any[];

  return items.map((d: any) => ({
    id: String(d?.id ?? d?.driverId ?? ""),
    name: String(d?.name ?? d?.fullName ?? d?.user?.name ?? "—"),
    plate:
      d?.plate ??
      d?.vehicle?.plate ??
      d?.driverVehicle?.plate ??
      d?.vehiclePlate ??
      null,
    isActive:
      typeof d?.isActive === "boolean"
        ? d.isActive
        : typeof d?.profile?.isActive === "boolean"
          ? d.profile.isActive
          : typeof d?.driverProfile?.isActive === "boolean"
            ? d.driverProfile.isActive
            : null,

    cityId:
      d?.cityId ??
      d?.profile?.cityId ??
      d?.driverProfile?.cityId ??
      d?.city?.id ??
      d?.profile?.city?.id ??
      d?.driverProfile?.city?.id ??
      null,

    city:
      d?.city
        ? {
            id: d.city?.id ?? null,
            slug: d.city?.slug ?? null,
            name: d.city?.name ?? null,
            department: d.city?.department ?? null,
            country: d.city?.country ?? null,
          }
        : d?.profile?.city
          ? {
              id: d.profile.city?.id ?? null,
              slug: d.profile.city?.slug ?? null,
              name: d.profile.city?.name ?? null,
              department: d.profile.city?.department ?? null,
              country: d.profile.city?.country ?? null,
            }
          : d?.driverProfile?.city
            ? {
                id: d.driverProfile.city?.id ?? null,
                slug: d.driverProfile.city?.slug ?? null,
                name: d.driverProfile.city?.name ?? null,
                department: d.driverProfile.city?.department ?? null,
                country: d.driverProfile.city?.country ?? null,
              }
            : null,
  }));
}

export type OrdersCityOption = Pick<
  CtccCity,
  "id" | "slug" | "name" | "department" | "country" | "isActive"
>;