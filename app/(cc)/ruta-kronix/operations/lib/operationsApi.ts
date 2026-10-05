import { apiFetch } from "@/lib/api";

export type OperationsSettings = {
  reminderEveryMinutes: number;
  maxReminders: number;
  escalateAfterReminders: number;
  locationStaleMinutes: number;
  maxActiveTripsPerDriver: number;
  maxActiveTripsPerVehicle: number;
  driverNoShowReportAfterMinutes: number;
  maxReportedDelayMinutes: number;
  driverTurnaroundMinutes: number;
};

export function listOperationalTrips() {
  return apiFetch<any[]>("/admin/carpool/operations/trips");
}
export function listOperationalAlerts() {
  return apiFetch<any[]>("/admin/carpool/operations/notifications");
}
export function resolveOperationalAlert(id: string) {
  return apiFetch(`/admin/carpool/operations/notifications/${id}/resolve`, {
    method: "PATCH",
  });
}
export function resolveDriverNoShow(
  tripId: string,
  decision: "CONFIRM" | "DISMISS",
  notes: string,
) {
  return apiFetch(
    `/admin/carpool/operations/trips/${tripId}/driver-no-show/resolve`,
    { method: "PATCH", body: JSON.stringify({ decision, notes }) },
  );
}
export function getOperationsSettings() {
  return apiFetch<OperationsSettings>("/admin/carpool/operations/settings");
}
export function saveOperationsSettings(value: OperationsSettings) {
  return apiFetch("/admin/carpool/operations/settings", {
    method: "PATCH",
    body: JSON.stringify(value),
  });
}
