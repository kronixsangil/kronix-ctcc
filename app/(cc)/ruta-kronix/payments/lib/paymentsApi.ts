import { apiFetch } from "@/lib/api";
export type PaymentMethod = { id: "KEY" | "NEQUI" | "DAVIPLATA"; label: string; value: string; holder: string; enabled: boolean };
export type PaymentSettings = { methods: PaymentMethod[]; instructions: string };
export function listPendingPayments() { return apiFetch<any[]>("/admin/carpool/payments"); }
export function listPendingRefunds() { return apiFetch<any[]>("/admin/carpool/payments/refunds"); }
export function getPaymentSettings() { return apiFetch<PaymentSettings>("/admin/carpool/payments/settings"); }
export function savePaymentSettings(value: PaymentSettings) { return apiFetch("/admin/carpool/payments/settings", { method: "PATCH", body: JSON.stringify(value) }); }
export function reviewPayment(id: string, decision: "APPROVE" | "REJECT", notes?: string) { return apiFetch(`/admin/carpool/payments/${id}/review`, { method: "PATCH", body: JSON.stringify({ decision, notes }) }); }
export function reviewRefund(id: string, decision: "COMPLETE" | "REJECT", notes?: string) { return apiFetch(`/admin/carpool/payments/${id}/refund`, { method: "PATCH", body: JSON.stringify({ decision, notes }) }); }
