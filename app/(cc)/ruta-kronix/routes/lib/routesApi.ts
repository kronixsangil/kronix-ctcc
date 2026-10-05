import { apiFetch } from "@/lib/api";

export type CarpoolCity = {
  id: string;
  slug: string;
  name: string;
  department: string;
  country: string;
  isActive: boolean;
};

export type CarpoolRoutePoint = {
  id?: string;
  type: "DEPARTURE" | "ARRIVAL";
  name: string;
  address: string;
  reference?: string;
  lat: number;
  lng: number;
  sortOrder: number;
  offsetMinutes?: number;
  isActive?: boolean;
};

export type CarpoolRoutePolicy = {
  id?: string;
  version?: number;
  passengerPriceCOP: number;
  kronixFeeCOP: number;
  maxAdvanceMinutes?: number;
  paymentWindowMinutes?: number;
  refundCutoffMinutes?: number;
  driverResponseMinutes?: number;
  minBookingCutoffMinutes?: number;
  maxBookingCutoffMinutes?: number;
  minWaitToleranceMinutes?: number;
  maxWaitToleranceMinutes?: number;
  maxSeatsPerBooking?: number;
};

export type CarpoolRoute = {
  id: string;
  slug: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  originCity: { id: string; name: string; department: string };
  destinationCity: { id: string; name: string; department: string };
  points: CarpoolRoutePoint[];
  policies: CarpoolRoutePolicy[];
  updatedAt: string;
};

export type CreateCarpoolRouteInput = {
  slug: string;
  name: string;
  originCityId: string;
  destinationCityId: string;
  distanceKm: number;
  estimatedMinutes: number;
  status: "DRAFT" | "ACTIVE";
  points: CarpoolRoutePoint[];
  policy: CarpoolRoutePolicy;
};

export function listCarpoolRoutes() {
  return apiFetch<CarpoolRoute[]>("/admin/carpool/routes");
}

export function listCarpoolCities() {
  return apiFetch<CarpoolCity[]>("/admin/carpool/cities");
}

export function createCarpoolCity(input: {
  name: string;
  department: string;
  country?: string;
}) {
  return apiFetch<CarpoolCity>("/admin/carpool/cities", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCarpoolCity(
  id: string,
  input: Partial<
    Pick<CarpoolCity, "name" | "department" | "country" | "isActive">
  >,
) {
  return apiFetch<CarpoolCity>(
    `/admin/carpool/cities/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function createCarpoolRoute(input: CreateCarpoolRouteInput) {
  return apiFetch<CarpoolRoute>("/admin/carpool/routes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCarpoolRoute(
  id: string,
  input: Partial<Pick<CarpoolRoute, "name" | "distanceKm" | "estimatedMinutes" | "status">> & { points?: CarpoolRoutePoint[]; policy?: CarpoolRoutePolicy },
) {
  return apiFetch<CarpoolRoute>(
    `/admin/carpool/routes/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function addCarpoolRoutePolicy(id: string, policy: CarpoolRoutePolicy) {
  return apiFetch<CarpoolRoutePolicy>(
    `/admin/carpool/routes/${encodeURIComponent(id)}/policies`,
    {
      method: "POST",
      body: JSON.stringify({ policy }),
    },
  );
}
