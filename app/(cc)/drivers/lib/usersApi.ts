// app/(cc)/drivers/lib/usersApi.ts
import { apiFetch } from "@/lib/api";

export type WorkerTypeCode = "MOTORCYCLE" | "TAXI" | "MOTORCARGO";

export type AdminDriverUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  deletedAt: string | null;
  workerTypes?: WorkerTypeCode[];
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
  workerTypes?: WorkerTypeCode[];
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
    workerTypes?: WorkerTypeCode[];
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


export async function getDriverWorkerTypes(
  id: string,
  params?: { citySlug?: string | null; cityId?: string | null }
) {
  const qs = new URLSearchParams();
  if (params?.citySlug?.trim()) qs.set("citySlug", params.citySlug.trim());
  if (params?.cityId?.trim()) qs.set("cityId", params.cityId.trim());

  return apiFetch<{
    ok: true;
    driverId: string;
    cityId: string;
    workerTypes: WorkerTypeCode[];
    items: Array<{
      id: string;
      userId: string;
      cityId: string | null;
      workerType: WorkerTypeCode;
      serviceType?: string;
      isActive: boolean;
    }>;
  }>(`/drivers/admin/${id}/worker-types${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export async function setDriverWorkerTypes(
  id: string,
  body: { workerTypes: WorkerTypeCode[]; citySlug?: string | null; cityId?: string | null }
) {
  return apiFetch(`/drivers/admin/${id}/worker-types`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getDriverWorkerWallet(
  id: string,
  params?: { citySlug?: string | null; cityId?: string | null; take?: number }
) {
  const qs = new URLSearchParams();
  if (params?.citySlug?.trim()) qs.set("citySlug", params.citySlug.trim());
  if (params?.cityId?.trim()) qs.set("cityId", params.cityId.trim());
  if (params?.take) qs.set("take", String(params.take));

  return apiFetch<{
    ok: true;
    driverId: string;
    city: { id: string; slug?: string; name: string; department: string; country?: string } | null;
    wallet: {
      id: string;
      userId: string;
      cityId: string;
      cashBalanceCOP: number;
      bonusBalanceCOP: number;
      totalAvailableCOP: number;
      isActive: boolean;
    };
    items: Array<any>;
  }>(`/drivers/admin/${id}/wallet${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export async function adjustDriverWorkerWallet(
  id: string,
  body: {
    citySlug?: string | null;
    cityId?: string | null;
    bucket?: "CASH" | "BONUS";
    amountCOP: number;
    note: string;
    reference?: string;
  }
) {
  return apiFetch(`/drivers/admin/${id}/wallet/adjust`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
