import { apiFetch } from "@/lib/api";

export type DynamicServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type DynamicServiceDefinition = {
  id: string;
  serviceKey: string;
  slug: string;
  name: string;
  shortName: string;
  description: string | null;
  workerTypeKey: string;
  workerLabel: string;
  workerPluralLabel: string;
  icon: string | null;
  assetSlug: string | null;
  buyerPath: string | null;
  cardImageLeft: string | null;
  cardImageRight: string | null;
  primaryColor: string;
  accentColor: string;
  requestSchema: Record<string, any>;
  workerFlowSchema: Record<string, any>;
  trackingSchema: Record<string, any>;
  status: DynamicServiceStatus;
  version: number;
  workerCommissionCOP: number;
  isActive: boolean;
  sortOrder: number;
  cityOverrides: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type DynamicServiceWriteInput = {
  serviceKey?: string;
  slug: string;
  name: string;
  shortName: string;
  description?: string;
  workerTypeKey: string;
  workerLabel: string;
  workerPluralLabel: string;
  icon?: string;
  assetSlug?: string;
  buyerPath?: string;
  cardImageLeft?: string;
  cardImageRight?: string;
  primaryColor: string;
  accentColor: string;
  requestSchema: Record<string, any>;
  workerFlowSchema: Record<string, any>;
  trackingSchema: Record<string, any>;
  status: DynamicServiceStatus;
  version: number;
  workerCommissionCOP: number;
  isActive: boolean;
  sortOrder: number;
  cityOverrides?: Record<string, any>;
};

export async function adminListDynamicServices(citySlug: string) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{
    ok: true;
    city: any;
    items: DynamicServiceDefinition[];
  }>(`/admin/services?${sp.toString()}`);
}

export async function adminCreateDynamicService(
  citySlug: string,
  input: DynamicServiceWriteInput & { serviceKey: string }
) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{
    ok: true;
    city: any;
    item: DynamicServiceDefinition;
  }>(`/admin/services?${sp.toString()}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateDynamicService(
  citySlug: string,
  serviceId: string,
  input: Partial<DynamicServiceWriteInput>
) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{
    ok: true;
    city: any;
    item: DynamicServiceDefinition;
  }>(`/admin/services/${encodeURIComponent(serviceId)}?${sp.toString()}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminArchiveDynamicService(
  citySlug: string,
  serviceId: string
) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{ ok: true; city: any; item: any }>(
    `/admin/services/${encodeURIComponent(serviceId)}?${sp.toString()}`,
    { method: "DELETE" }
  );
}

export async function adminSeedDynamicServices() {
  return apiFetch<{ ok: true; seeded: number }>("/admin/services/seed", {
    method: "POST",
  });
}
