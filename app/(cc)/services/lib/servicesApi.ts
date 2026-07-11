//app\(cc)\services\lib\servicesApi.ts
import { apiFetch } from "@/lib/api";

export type WorkerType = "MOTORCYCLE" | "TAXI" | "MOTORCARGO";
export type ServiceType = "DELIVERY" | "PACKAGE" | "TAXI" | "MOTORCARGO";

export type AdminServiceConfig = {
  id: string;
  cityId: string;
  serviceType: ServiceType;
  name: string;
  description: string | null;
  workerType: WorkerType;
  workerCommissionCOP: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function adminListServiceConfigs(citySlug: string) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{ ok: true; city: any; items: AdminServiceConfig[] }>(
    `/admin/service-configs?${sp.toString()}`
  );
}

export async function adminUpdateServiceConfig(
  citySlug: string,
  serviceType: ServiceType,
  input: Partial<Pick<AdminServiceConfig, "name" | "description" | "workerType" | "workerCommissionCOP" | "isActive" | "sortOrder">>
) {
  const sp = new URLSearchParams({ citySlug });
  return apiFetch<{ ok: true; city: any; item: AdminServiceConfig }>(
    `/admin/service-configs/${encodeURIComponent(serviceType)}?${sp.toString()}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}
