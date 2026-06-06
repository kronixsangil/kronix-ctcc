//app\(cc)\buyer\lib\buyerAdminApi.ts
import { apiFetch } from "@/lib/api";

export type BuyerAdminItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  nickname?: string | null;
  role?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
  defaultAddress?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
  city?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    department?: string | null;
    country?: string | null;
  } | null;
  legal?: {
    legalCurrent?: boolean;
    hasAnyLegalAcceptance?: boolean;
    hasOutdatedLegal?: boolean;
    docs?: Array<any>;
  };
};

export type BuyersAdminResponse = {
  ok?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  summary?: {
    totalClients?: number;
    legalCurrent?: number;
    pending?: number;
    outdated?: number;
  };
  items?: BuyerAdminItem[];
};

export type KronixPlusApplication = {
  id: string;
  userId?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  businessName?: string | null;
  businessType?: string | null;
  placeName?: string | null;
  address?: string | null;
  addressReference?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  citySlug?: string | null;
  cityName?: string | null;
  expectedShipmentsPerMonth?: number | null;
  notes?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: BuyerAdminItem | null;
};

export type KronixPlusApplicationsResponse = {
  ok?: boolean;
  items?: KronixPlusApplication[];
  summary?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };
};

export type WalletListItem = {
  wallet: {
    id: string;
    userId: string;
    cityId?: string;
    cashBalanceCOP: number;
    bonusBalanceCOP: number;
    totalAvailableCOP: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  city?: {
    id: string;
    name?: string | null;
    department?: string | null;
  } | null;
};

export type WalletTxItem = {
  id: string;
  walletId: string;
  userId: string;
  cityId?: string;
  orderId?: string | null;
  createdByAdminId?: string | null;
  type: string;
  bucket: string;
  amountCOP: number;
  cashBalanceAfterCOP: number;
  bonusBalanceAfterCOP: number;
  reference?: string | null;
  note?: string | null;
  createdAt: string;
};

export type WalletDetailResponse = {
  ok: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  city?: {
    id: string;
    name?: string | null;
    department?: string | null;
  } | null;
  wallet: {
    id: string;
    userId: string;
    cityId?: string;
    cashBalanceCOP: number;
    bonusBalanceCOP: number;
    totalAvailableCOP: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  items: WalletTxItem[];
};

export function formatCOP(value?: number | null) {
  return Number(value ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export function getPersonLabel(item?: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  id?: string | null;
}) {
  return item?.name || item?.email || item?.phone || item?.id || "Cliente sin nombre";
}

export function getCityText(item?: { name?: string | null; department?: string | null } | null) {
  if (!item) return "Ciudad no disponible";
  if (item.name && item.department) return `${item.name}, ${item.department}`;
  return item.name || "Ciudad no disponible";
}

export async function listBuyers(input: {
  q?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
  citySlug?: string;
}) {
  const params = new URLSearchParams();
  if (input.q?.trim()) params.set("q", input.q.trim());
  params.set("status", input.status || "ALL");
  params.set("page", String(input.page || 1));
  params.set("limit", String(input.limit || 10));
  if (input.citySlug?.trim()) params.set("citySlug", input.citySlug.trim());
  return apiFetch<BuyersAdminResponse>(`/users/admin/buyers?${params.toString()}`, { method: "GET" });
}

export async function listKronixPlusApplications(input: { citySlug?: string; status?: string }) {
  const params = new URLSearchParams();
  if (input.citySlug?.trim()) params.set("citySlug", input.citySlug.trim());
  if (input.status?.trim()) params.set("status", input.status.trim());
  const qs = params.toString();
  return apiFetch<KronixPlusApplicationsResponse>(`/users/admin/kronix-plus/applications${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function updateKronixPlusApplicationStatus(
  applicationId: string,
  payload: { status: "APPROVED" | "REJECTED" | "PENDING"; reviewNotes?: string | null }
) {
  return apiFetch<KronixPlusApplication>(
  `/users/admin/kronix-plus/applications/${encodeURIComponent(applicationId)}/status`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);
}

export async function loadWalletDetail(userId: string, input: { cityId?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (input.cityId?.trim()) params.set("cityId", input.cityId.trim());
  if (input.limit) params.set("limit", String(input.limit));
  const qs = params.toString();
  return apiFetch<WalletDetailResponse>(`/wallet/admin/by-user/${encodeURIComponent(userId)}${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function adjustWallet(payload: {
  userId: string;
  cityId?: string;
  bucket: "CASH" | "BONUS";
  amountCOP: number;
  note: string;
}) {
  return apiFetch("/wallet/admin/adjust", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
}
