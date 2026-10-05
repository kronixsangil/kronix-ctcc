import { apiFetch } from "@/lib/api";

export type CarpoolDocument = { id: string; type: string; fileUrl: string; status: string; expiresAt?: string | null };
export type CarpoolDriverApplication = {
  id: string;
  driverApprovalStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  driverRejectionReason?: string | null;
  updatedAt: string;
  documents: CarpoolDocument[];
  user: { id: string; name: string; phone: string; email?: string | null; carpoolVehicles: Array<{ id: string; plate: string; brand: string; line?: string | null; color: string; layout: string; status: string; documents: CarpoolDocument[] }> };
};
export function listCarpoolDrivers() { return apiFetch<CarpoolDriverApplication[]>("/admin/carpool/drivers"); }
export function reviewCarpoolDriver(id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED", reason?: string) {
  return apiFetch(`/admin/carpool/drivers/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
}
export function reviewCarpoolVehicle(id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED", reason?: string) {
  return apiFetch(`/admin/carpool/drivers/vehicles/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
}
