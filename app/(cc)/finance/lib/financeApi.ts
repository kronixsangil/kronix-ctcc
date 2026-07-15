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
    workerServiceCommissionsCOP: number;
    avgTicketCOP: number;
    marginPct: number;
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
  };
  cashFlow: {
    wompiGrossReceivedCOP: number;
    wompiNetRecordedCOP: number;
    recordedWompiFeesCOP: number;
    buyerWalletRechargesCOP: number;
    buyerWalletRechargeCount: number;
    workerWalletRechargesCOP: number;
    workerWalletRechargeCount: number;
    directWompiOrderPaymentsCOP: number;
    directWompiOrderPaymentsCount: number;
    feeDataComplete: boolean;
  };
  income: {
    storeCommissionCOP: number;
    serviceFeesCOP: number;
    workerServiceCommissionsCOP: number;
    platformNetRevenueCOP: number;
    promoCostCOP: number;
  };
  walletActivity: {
    buyerWalletRechargesCOP: number;
    workerWalletRechargesCOP: number;
    buyerWalletOrderPaymentsCOP: number;
    workerWalletOrderPaymentsCOP: number;
    buyerWalletAdminAdjustmentsCOP: number;
    workerWalletAdminAdjustmentsCOP: number;
    walletRefundsCOP: number;
    walletBonusGrantedCOP: number;
  };
  obligations: {
    buyerWalletCashLiabilityCOP: number;
    buyerWalletBonusLiabilityCOP: number;
    workerWalletCashLiabilityCOP: number;
    workerWalletBonusLiabilityCOP: number;
    totalWalletCashLiabilityCOP: number;
    totalWalletBonusLiabilityCOP: number;
    totalWalletLiabilityCOP: number;
    pendingDriverPayoutsCOP: number;
    pendingStorePayoutsCOP: number;
  };
  wompi: {
    grossReceivedCOP: number;
    recordedFeesCOP: number;
    netRecordedCOP: number;
    feeDataComplete: boolean;
    note: string;
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
    serviceLabel: string;
    revenueSource: "WORKER_COMMISSION" | "FINANCIAL_SNAPSHOT" | "NONE" | string;
    workerCommissionCOP: number;
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