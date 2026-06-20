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