//app\(cc)\quality\lib\qualityApi.ts
"use client";

import { apiFetch } from "@/lib/api";

export type QualityReviewType = "ALL" | "DRIVER" | "STORE";
export type QualityServiceType = "ALL" | "STORE" | "COURIER";

export type QualityOverview = {
  ok: boolean;
  totals: {
    allReviews: number;
    avgRating: number | null;
    criticalReviews: number;
    commentsCount: number;
  };
  drivers: {
    count: number;
    avgRating: number | null;
  };
  stores: {
    count: number;
    avgRating: number | null;
  };
  recentCritical: QualityReviewItem[];
};

export type QualityReviewItem = {
  id: string;
  type: "DRIVER" | "STORE";
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