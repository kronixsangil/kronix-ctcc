import { apiFetch } from "@/lib/api";
export type NotificationAudience = { buyer: boolean; driver: boolean; store: boolean };
export type NotificationDraft = { title: string; body: string; url: string; sound: string; audience: NotificationAudience; citySlug?: string };
export function previewNotification(input: NotificationDraft) { return apiFetch<any>("/admin/notifications/preview", { method: "POST", body: JSON.stringify(input) }); }
export function sendNotification(input: NotificationDraft) { return apiFetch<any>("/admin/notifications/send", { method: "POST", body: JSON.stringify(input) }); }
export function listNotificationHistory(citySlug?: string) { const q = citySlug ? `?citySlug=${encodeURIComponent(citySlug)}` : ""; return apiFetch<any[]>(`/admin/notifications/history${q}`); }
