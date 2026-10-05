import { apiFetch } from "@/lib/api";

export type NotificationTemplate = {
  id: string;
  eventKey: string;
  name: string;
  audience: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  priority: "NORMAL" | "HIGH" | "CRITICAL";
  isActive: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  recurringEnabled: boolean;
};

export type NotificationCampaign = {
  id: string;
  title: string;
  body: string;
  audience: string;
  targetPhone?: string | null;
  pushEnabled: boolean;
  soundEnabled: boolean;
  recipientCount: number;
  sentAt: string;
};

export function listNotificationTemplates() {
  return apiFetch<NotificationTemplate[]>("/admin/carpool/operations/notification-center/templates");
}

export function updateNotificationTemplate(id: string, value: Omit<NotificationTemplate, "id" | "eventKey" | "audience">) {
  return apiFetch(`/admin/carpool/operations/notification-center/templates/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(value) });
}

export function listNotificationCampaigns() {
  return apiFetch<NotificationCampaign[]>("/admin/carpool/operations/notification-center/campaigns");
}

export function sendNotification(value: { title: string; body: string; audience: "ALL" | "PASSENGERS" | "DRIVERS" | "USER"; targetPhone?: string; actionUrl?: string; pushEnabled: boolean; soundEnabled: boolean }) {
  return apiFetch<NotificationCampaign>("/admin/carpool/operations/notification-center/send", { method: "POST", body: JSON.stringify(value) });
}
