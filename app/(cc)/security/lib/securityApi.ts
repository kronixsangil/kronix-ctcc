//app\(cc)\security\lib\securityApi.ts
import { apiFetch } from "@/lib/api";

export type SecurityOverviewResponse = {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    ctccUsers: number;
    activeSessions: number;
    revokedSessions: number;
    audits24h: number;
    passwordResetOpen: number;
  };
  roleBreakdown: Array<{
    role: string;
    count: number;
  }>;
  recentAudits: Array<{
    id: string;
    actorId: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
};

export type SecurityUserRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: string;
  deletedAt: string | null;
  storeId: string | null;
  city: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
};

export type SecurityUsersResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  items: SecurityUserRow[];
};

export type SecuritySessionRow = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string | null;
  userRole: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
};

export type SecuritySessionsResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  items: SecuritySessionRow[];
};

export type SecurityAuditRow = {
  id: string;
  actorId: string;
  actorName: string;
  actorPhone: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  meta: any;
};

export type SecurityAuditResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  items: SecurityAuditRow[];
};

export async function getSecurityOverview(params?: { citySlug?: string }) {
  const qs = new URLSearchParams();
  if (params?.citySlug?.trim()) qs.set("citySlug", params.citySlug.trim());
  const query = qs.toString();
  return apiFetch<SecurityOverviewResponse>(`/admin/security/overview${query ? `?${query}` : ""}`);
}

export async function listSecurityUsers(params: {
  q?: string;
  role?: string;
  status?: "ALL" | "ACTIVE" | "DELETED";
  page?: number;
  limit?: number;
  citySlug?: string;
}) {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.role?.trim()) qs.set("role", params.role.trim());
  if (params.status?.trim()) qs.set("status", params.status.trim());
  if (params.citySlug?.trim()) qs.set("citySlug", params.citySlug.trim());
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));

  return apiFetch<SecurityUsersResponse>(`/admin/security/users?${qs.toString()}`);
}

export async function createSecurityUser(body: {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  role: string;
  storeId?: string | null;
  citySlug?: string | null;
}) {
  return apiFetch<any>("/admin/security/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSecurityUser(
  userId: string,
  body: {
    name?: string;
    phone?: string;
    email?: string | null;
    password?: string;
    role?: string;
    storeId?: string | null;
    citySlug?: string | null;
  }
) {
  return apiFetch<any>(`/admin/security/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteSecurityUser(userId: string) {
  return apiFetch<any>(`/admin/security/users/${userId}`, {
    method: "DELETE",
  });
}

export async function listSecuritySessions(params: {
  q?: string;
  status?: "ALL" | "ACTIVE" | "REVOKED" | "EXPIRED";
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.status?.trim()) qs.set("status", params.status.trim());
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));

  return apiFetch<SecuritySessionsResponse>(`/admin/security/sessions?${qs.toString()}`);
}

export async function revokeSecuritySession(sessionId: string) {
  return apiFetch<any>(`/admin/security/sessions/${sessionId}/revoke`, {
    method: "POST",
  });
}

export async function revokeAllUserSessions(userId: string) {
  return apiFetch<any>(`/admin/security/sessions/revoke-user/${userId}`, {
    method: "POST",
  });
}

export async function listSecurityAudit(params: {
  q?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.action?.trim()) qs.set("action", params.action.trim());
  if (params.entityType?.trim()) qs.set("entityType", params.entityType.trim());
  if (params.actorId?.trim()) qs.set("actorId", params.actorId.trim());
  if (params.from?.trim()) qs.set("from", params.from.trim());
  if (params.to?.trim()) qs.set("to", params.to.trim());
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));

  return apiFetch<SecurityAuditResponse>(`/admin/security/audit?${qs.toString()}`);
}