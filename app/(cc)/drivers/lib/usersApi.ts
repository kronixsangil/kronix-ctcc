// app/(cc)/drivers/lib/usersApi.ts
import { apiFetch } from "@/lib/api";

export type AdminDriverUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  deletedAt: string | null;
  driverProfile: {
    isActive: boolean;
    documentId: string | null;
    level: "BRONCE" | "PLATA" | "ORO" | "PLATINO";
    rating: number;
    updatedAt: string;
    city: {
      id: string;
      slug: string;
      name: string;
      department: string;
      country: string;
    } | null;
  } | null;
};

export type AdminDriverUsersList = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  items: AdminDriverUser[];
};

export async function listDriverUsers(params: {
  q?: string;
  status?: "ALL" | "ACTIVE" | "DELETED";
  page?: number;
  limit?: number;
  citySlug?: string;
}) {
  const qs = new URLSearchParams();

  if (params.q?.trim()) qs.set("q", params.q.trim());
  qs.set("status", params.status ?? "ACTIVE");
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));

  if (params.citySlug?.trim()) qs.set("citySlug", params.citySlug.trim());

  return apiFetch<AdminDriverUsersList>(`/admin/users/drivers?${qs.toString()}`);
}

export async function createDriverUser(body: {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  documentId?: string | null;
  isActive?: boolean;
  citySlug?: string | null;
}) {
  return apiFetch(`/admin/users/drivers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDriverUser(
  id: string,
  body: {
    name?: string;
    phone?: string;
    email?: string | null;
    password?: string;
    documentId?: string | null;
    isActive?: boolean;
    citySlug?: string | null;
  }
) {
  return apiFetch(`/admin/users/drivers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteDriverUser(id: string) {
  return apiFetch(`/admin/users/drivers/${id}`, { method: "DELETE" });
}
