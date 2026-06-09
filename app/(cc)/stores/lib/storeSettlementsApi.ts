//app\(cc)\stores\lib\storeSettlementsApi.ts
import { apiFetch } from "@/lib/api";

export type StoreSettlementFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type StoreSettlementStatus = "PENDING" | "PAID" | "CANCELLED";

export type StoreSettlementCourierOrder = {
  id: string;
  shortId: string;
  createdAt: string;
  status: string;
  flowStatus: string;
  totalCOP: number;
  dropoffAddress: string;
  receiverName?: string | null;
  receiverPhone?: string | null;
};

export type StoreSettlementRow = {
  settlementId?: string | null;
  storeId: string;
  storeCode: string;
  storeName: string;
  legalName?: string | null;
  nit?: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
  } | null;
  frequency: StoreSettlementFrequency;
  periodStart: string;
  periodEnd: string;
  status: StoreSettlementStatus;
  paidAt?: string | null;
  paidMethod?: string | null;
  paidReference?: string | null;
  notes?: string | null;
  storeOrdersCount: number;
  storeSalesCOP: number;
  platformCommissionCOP: number;
  storePayoutCOP: number;
  courierServicesCount: number;
  courierServicesCOP: number;
  netToStoreCOP: number;
  amountDueToKronixCOP: number;
  courierOrders?: StoreSettlementCourierOrder[];
  payoutInfo?: {
    method?: string | null;
    bankName?: string | null;
    accountType?: string | null;
    accountNumber?: string | null;
    holder?: string | null;
    nequiPhone?: string | null;
    daviplataPhone?: string | null;
  } | null;
};

export type StoreSettlementsResponse = {
  ok: true;
  frequency: StoreSettlementFrequency;
  range: {
    from: string;
    to: string;
  };
  summary: {
    stores: number;
    storesWithMovement: number;
    pendingSettlements: number;
    paidSettlements: number;
    storeSalesCOP: number;
    platformCommissionCOP: number;
    storePayoutCOP: number;
    courierServicesCount: number;
    courierServicesCOP: number;
    netToStoreCOP: number;
    amountDueToKronixCOP: number;
  };
  rows: StoreSettlementRow[];
};

export async function adminListStoreSettlements(params: {
  frequency: StoreSettlementFrequency;
  citySlug?: string;
}): Promise<StoreSettlementsResponse> {
  const sp = new URLSearchParams();
  sp.set("frequency", params.frequency);
  if (params.citySlug) sp.set("citySlug", params.citySlug);

  return apiFetch(`/admin/finance/store-settlements?${sp.toString()}`);
}

export async function adminMarkStoreSettlementPaid(input: {
  storeId: string;
  frequency: StoreSettlementFrequency;
  periodStart: string;
  periodEnd: string;
  paidMethod?: string | null;
  paidReference?: string | null;
  notes?: string | null;
}): Promise<{ ok: true; settlementId: string; status: StoreSettlementStatus; paidAt: string | null }> {
  return apiFetch(`/admin/finance/store-settlements/pay`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
