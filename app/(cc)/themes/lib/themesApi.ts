//app\(cc)\themes\lib\themesApi.ts
import { apiFetch } from "@/lib/api";

export type AdminTheme = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;

  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  pageBg: string;
  textPrimary: string;
  textSecondary: string;

  headerBg: string;
  headerTextColor: string;
  headerLogoUrl?: string | null;

  bottomNavBg: string;
  bottomNavActiveColor: string;
  bottomNavInactiveColor: string;

  cardBg: string;
  cardTextColor: string;
  cardRadius: number;

  buttonBg: string;
  buttonTextColor: string;

  badgeBg: string;
  badgeTextColor: string;

  inputBg: string;
  inputBorder: string;

  gradientFrom?: string | null;
  gradientTo?: string | null;
  splashLogoUrl?: string | null;

  tokens?: any;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminThemeInput = Partial<AdminTheme> & {
  code: string;
  name: string;
};

export async function adminListThemes(): Promise<AdminTheme[]> {
  return apiFetch("/admin/themes");
}

export async function adminGetTheme(id: string): Promise<AdminTheme> {
  return apiFetch(`/admin/themes/${encodeURIComponent(id)}`);
}

export async function adminCreateTheme(input: AdminThemeInput): Promise<AdminTheme> {
  return apiFetch("/admin/themes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateTheme(
  id: string,
  input: Partial<AdminThemeInput>
): Promise<AdminTheme> {
  return apiFetch(`/admin/themes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminDuplicateTheme(id: string): Promise<AdminTheme> {
  return apiFetch(`/admin/themes/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}

export async function adminDeleteTheme(id: string): Promise<{ ok: true }> {
  return apiFetch(`/admin/themes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}