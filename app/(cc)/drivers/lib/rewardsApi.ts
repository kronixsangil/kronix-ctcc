//app\(cc)\drivers\lib\rewardsApi.ts
import { apiFetch } from "@/lib/api";

function qs(cityId?: string) {
  return cityId ? `?cityId=${encodeURIComponent(cityId)}` : "";
}

export async function getRewardSettings(cityId?: string) {
  return apiFetch(`/drivers/rewards/settings${qs(cityId)}`);
}

export async function updateRewardSettings(body: any) {
  return apiFetch("/drivers/rewards/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getRewardTiers(cityId?: string) {
  return apiFetch(`/drivers/rewards/tiers${qs(cityId)}`);
}

export async function updateRewardTier(id: string, body: any) {
  return apiFetch(`/drivers/rewards/tiers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function updateRewardTierRequirements(id: string, body: any) {
  return apiFetch(`/drivers/rewards/tiers/${id}/requirements`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getRewardRules(cityId?: string) {
  return apiFetch(`/drivers/rewards/rules${qs(cityId)}`);
}

export async function updateRewardRule(id: string, body: any) {
  return apiFetch(`/drivers/rewards/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getRewardSchedules(cityId?: string) {
  return apiFetch(`/drivers/rewards/schedules${qs(cityId)}`);
}

export async function updateRewardSchedule(id: string, body: any) {
  return apiFetch(`/drivers/rewards/schedules/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getRewardProfiles(cityId?: string) {
  return apiFetch(`/drivers/rewards/profiles${qs(cityId)}`);
}

export async function setRewardPioneer(driverId: string, isPioneer: boolean) {
  return apiFetch(`/drivers/rewards/profiles/${driverId}/pioneer`, {
    method: "PATCH",
    body: JSON.stringify({ isPioneer }),
  });
}

export async function addManualRewardPoints(
  driverId: string,
  body: { points: number; notes?: string | null }
) {
  return apiFetch(`/drivers/rewards/profiles/${driverId}/manual-points`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRewardTransactions(driverId: string, take = 80) {
  return apiFetch(`/drivers/rewards/profiles/${driverId}/transactions?take=${take}`);
}
