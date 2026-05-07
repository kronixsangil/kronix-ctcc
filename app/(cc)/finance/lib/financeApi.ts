// app/(cc)/finance/lib/financeApi.ts
import { apiFetch } from "@/lib/api";

export type FinanceOverviewResponse = {
  ok: true;
  range: {
    from: string;
    to: string;
  };
  summary: {
    grossSalesCOP: number;
    paidSalesCOP: number;
    platformCommissionCOP: number;
    serviceFeesCOP: number;
    promoCOP: number;
    tipsCOP: number;
    deliveryFeesCOP: number;
    platformNetRevenueCOP: number;
    avgTicketCOP: number;
    marginPct: number;
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
  };
  pending: {
    driverPayoutsCOP: number;
    driverPayoutsCount: number;
    storePayoutsCOP: number;
  };
  charts: {
    salesByDay: Array<{
      date: string;
      grossSalesCOP: number;
      paidSalesCOP: number;
      netRevenueCOP: number;
      orders: number;
    }>;
    statusBreakdown: Array<{
      status: string;
      label: string;
      count: number;
    }>;
  };
  topStores: Array<{
    storeId: string;
    storeCode: string;
    name: string;
    orders: number;
    salesCOP: number;
    commissionCOP: number;
  }>;
  recentOrders: Array<{
    id: string;
    createdAt: string;
    status: string;
    flowStatus: string;
    paymentStatus: string | null;
    totalCOP: number;
    netRevenueCOP: number;
    customerName: string;
    customerPhone: string;
    storeSummary: string;
    hasFinancialSnapshot: boolean;
  }>;
  alerts: Array<{
    kind: string;
    title: string;
    description: string;
    tone: "emerald" | "amber" | "rose" | "blue";
  }>;
};

export async function getFinanceOverview(params: { from?: string; to?: string; citySlug?: string }) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.citySlug) qs.set("citySlug", params.citySlug);

  return apiFetch<FinanceOverviewResponse>(`/admin/finance/overview?${qs.toString()}`);
}