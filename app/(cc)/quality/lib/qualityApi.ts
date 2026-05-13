//app\(cc)\quality\lib\qualityApi.ts
"use client";

import { apiFetch } from "@/lib/api";

export type QualityReviewType = "ALL" | "DRIVER" | "STORE";
export type QualityServiceType = "ALL" | "STORE" | "COURIER";

export type QualityReviewItem = {
  id: string;
  type: "DRIVER" | "STORE";
  targetId?: string | null;
  orderId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerName: string;
  targetName: string;
  targetExtra?: string | null;
  cityLabel: string;
  orderType?: string | null;
  courierServiceType?: string | null;
  totalCOP?: number | null;
};

export type QualityOverview = {
  ok: boolean;
  totals: {
    allReviews: number;
    avgRating: number | null;
    criticalReviews: number;
    commentsCount: number;
  };
  drivers: { count: number; avgRating: number | null };
  stores: { count: number; avgRating: number | null };
  recentCritical: QualityReviewItem[];
};

export type QualityReviewsResponse = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  items: QualityReviewItem[];
};

export type QualityQuery = {
  citySlug?: string;
  type?: QualityReviewType;
  serviceType?: QualityServiceType;
  ratingMax?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type QualityProfileDetail = {
  ok: boolean;
  type: "DRIVER" | "STORE";
  profile: {
    id: string;
    name: string;
    phone?: string | null;
    storeCode?: string | null;
    active: boolean;
    cityLabel: string;
  };
  metrics: {
    avgRating: number | null;
    totalRatings: number;
    totalComments: number;
    criticalCount: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalOrders: number;
    cancellationRate: number;
    avgTicketCOP: number;
  };
  stars: Record<string, number>;
  recentComments: QualityReviewItem[];
  recentOrders: Array<{
    id: string;
    status?: string | null;
    flowStatus?: string | null;
    orderType?: string | null;
    courierServiceType?: string | null;
    totalCOP?: number | null;
    createdAt: string;
    updatedAt: string;
    customerName: string;
    cityLabel: string;
  }>;
};

function qs(input: Record<string, any>) {
  const p = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    const s = String(value ?? "").trim();
    if (!s || s === "ALL") return;
    p.set(key, s);
  });

  const out = p.toString();
  return out ? `?${out}` : "";
}

export async function getQualityOverview(query: QualityQuery) {
  return apiFetch<QualityOverview>(`/admin/quality/overview${qs(query)}`, {
    method: "GET",
  });
}

export async function getQualityReviews(query: QualityQuery) {
  return apiFetch<QualityReviewsResponse>(`/admin/quality/reviews${qs(query)}`, {
    method: "GET",
  });
}

export async function getQualityDriverDetail(driverId: string, query: QualityQuery = {}) {
  return apiFetch<QualityProfileDetail>(
    `/admin/quality/drivers/${encodeURIComponent(driverId)}${qs(query)}`,
    { method: "GET" }
  );
}

export async function getQualityStoreDetail(storeId: string, query: QualityQuery = {}) {
  return apiFetch<QualityProfileDetail>(
    `/admin/quality/stores/${encodeURIComponent(storeId)}${qs(query)}`,
    { method: "GET" }
  );
}