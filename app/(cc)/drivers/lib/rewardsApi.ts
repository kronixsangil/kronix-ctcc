//app\(cc)\drivers\lib\rewardsApi.ts
import { apiFetch } from "@/lib/api";

export async function getRewardSettings(cityId?: string) {
  return apiFetch("/drivers/rewards/settings" + (cityId ? `?cityId=${cityId}` : ""));
}

export async function getRewardTiers(cityId?: string) {
  return apiFetch("/drivers/rewards/tiers" + (cityId ? `?cityId=${cityId}` : ""));
}

export async function getRewardRules(cityId?: string) {
  return apiFetch("/drivers/rewards/rules" + (cityId ? `?cityId=${cityId}` : ""));
}

export async function getRewardSchedules(cityId?: string) {
  return apiFetch("/drivers/rewards/schedules" + (cityId ? `?cityId=${cityId}` : ""));
}

export async function getRewardProfiles(cityId?: string) {
  return apiFetch("/drivers/rewards/profiles" + (cityId ? `?cityId=${cityId}` : ""));
}