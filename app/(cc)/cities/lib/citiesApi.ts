// app/(cc)/cities/lib/citiesApi.ts
import { apiFetch } from "@/lib/api";

export type CtccCity = {
  id: string;
  slug: string;
  name: string;
  department: string;
  country: string;
  isActive: boolean;
  isFeatured: boolean;
  storesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CtccCitiesResponse = {
  ok: boolean;
  items: CtccCity[];
  total: number;
  page: number;
  limit: number;
};

export async function listAdminCities(params: {
  q?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));

  return apiFetch<CtccCitiesResponse>(`/admin/cities?${qs.toString()}`);
}

export async function createAdminCity(body: {
  name: string;
  department: string;
  country: string;
  slug?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  return apiFetch<{ ok: boolean; item: CtccCity }>(`/admin/cities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function updateAdminCity(
  id: string,
  body: {
    name?: string;
    department?: string;
    country?: string;
    slug?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }
) {
  return apiFetch<{ ok: boolean; item: CtccCity }>(`/admin/cities/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}