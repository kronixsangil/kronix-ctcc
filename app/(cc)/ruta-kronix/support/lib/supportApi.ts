import { apiFetch } from "@/lib/api";

export type SupportRequest = {
  id: string;
  category: string;
  message: string;
  status: "OPEN" | "IN_REVIEW" | "WAITING_USER" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  internalNotes?: string | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string; phone: string; email?: string | null };
  assignedAdmin?: { id: string; name: string } | null;
};

export function listSupportRequests(status = "ALL") {
  return apiFetch<SupportRequest[]>(`/admin/carpool/support/requests?status=${encodeURIComponent(status)}`);
}

export function updateSupportRequest(id: string, input: Pick<SupportRequest, "status" | "priority"> & { internalNotes?: string; resolution?: string }) {
  return apiFetch<SupportRequest>(`/admin/carpool/support/requests/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
