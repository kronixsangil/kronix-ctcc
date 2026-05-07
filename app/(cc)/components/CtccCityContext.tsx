//app\(cc)\components\CtccCityContext.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { listAdminCities, type CtccCity } from "../cities/lib/citiesApi";

export type CtccScopeMode = "GLOBAL" | "CITY";

export type CtccSelectedCity = {
  id: string;
  slug: string;
  name: string;
  department: string;
  country: string;
};

type PersistedCtccCityContext =
  | {
      mode: "GLOBAL";
      citySlug?: string;
    }
  | {
      mode: "CITY";
      citySlug: string;
    };

type CtccCityProviderProps = {
  children: React.ReactNode;
  canUseGlobal?: boolean;
  lockedCityId?: string | null;
};

type CtccCityContextValue = {
  mode: CtccScopeMode;
  selectedCity: CtccSelectedCity | null;
  cities: CtccSelectedCity[];
  citiesLoading: boolean;
  citiesError: string | null;

  setGlobalMode: () => void;
  setCityBySlug: (slug: string) => void;
  reloadCities: () => Promise<void>;

  citySlug: string;
  cityLabel: string;
  cityGeoLabel: string;
  isGlobal: boolean;

  canUseGlobal: boolean;
  isLockedToCity: boolean;
};

const STORAGE_KEY = "ctcc_city_context_v1";

const CtccCityContext = createContext<CtccCityContextValue | null>(null);

function mapCity(city: CtccCity): CtccSelectedCity {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    department: city.department,
    country: city.country,
  };
}

function readPersistedValue(): PersistedCtccCityContext {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { mode: "GLOBAL" };
    }

    const parsed = JSON.parse(raw) as PersistedCtccCityContext;

    if (parsed?.mode === "CITY" && String(parsed.citySlug || "").trim()) {
      return {
        mode: "CITY",
        citySlug: String(parsed.citySlug).trim().toLowerCase(),
      };
    }

    return { mode: "GLOBAL" };
  } catch {
    return { mode: "GLOBAL" };
  }
}

function persistValue(value: PersistedCtccCityContext) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

export function CtccCityProvider({
  children,
  canUseGlobal = true,
  lockedCityId = null,
}: CtccCityProviderProps) {
  const [cities, setCities] = useState<CtccSelectedCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const [mode, setMode] = useState<CtccScopeMode>("GLOBAL");
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>("");

  const isLockedToCity = !canUseGlobal && !!String(lockedCityId ?? "").trim();

  async function loadCities() {
    setCitiesLoading(true);
    setCitiesError(null);

    try {
      const res = await listAdminCities({
        status: "ACTIVE",
        page: 1,
        limit: 100,
      });

      const rows = Array.isArray(res?.items) ? res.items : [];
      const mapped = rows
        .filter((x) => x.isActive)
        .map(mapCity)
        .sort((a, b) => {
          const byDepartment = a.department.localeCompare(b.department, "es");
          if (byDepartment !== 0) return byDepartment;
          return a.name.localeCompare(b.name, "es");
        });

      setCities(mapped);
    } catch (e: any) {
      setCities([]);
      setCitiesError(e?.message || "No se pudieron cargar las ciudades activas.");
    } finally {
      setCitiesLoading(false);
    }
  }

  useEffect(() => {
    const persisted = readPersistedValue();

    if (isLockedToCity) {
      setMode("CITY");
      setSelectedCitySlug("");
    } else {
      setMode(persisted.mode);
      setSelectedCitySlug(String(persisted.citySlug ?? "").trim().toLowerCase());
    }

    loadCities();
  }, [isLockedToCity]);

  useEffect(() => {
    if (citiesLoading) return;

    if (isLockedToCity) {
      const forcedCity = cities.find(
        (city) => String(city.id) === String(lockedCityId ?? "").trim()
      );

      if (forcedCity) {
        if (mode !== "CITY") setMode("CITY");
        if (selectedCitySlug !== forcedCity.slug) {
          setSelectedCitySlug(forcedCity.slug);
        }
        persistValue({
          mode: "CITY",
          citySlug: forcedCity.slug,
        });
        return;
      }

      setMode("CITY");
      setSelectedCitySlug("");
      return;
    }

    if (mode === "GLOBAL") {
      persistValue({ mode: "GLOBAL" });
      return;
    }

    if (mode === "CITY") {
      const current = cities.find((city) => city.slug === selectedCitySlug) ?? null;

      if (current) {
        persistValue({
          mode: "CITY",
          citySlug: current.slug,
        });
        return;
      }

      if (cities.length > 0) {
        const fallback = cities[0];
        setSelectedCitySlug(fallback.slug);
        persistValue({
          mode: "CITY",
          citySlug: fallback.slug,
        });
        return;
      }

      setMode("GLOBAL");
      setSelectedCitySlug("");
      persistValue({ mode: "GLOBAL" });
    }
  }, [cities, citiesLoading, isLockedToCity, lockedCityId, mode, selectedCitySlug]);

  const selectedCity = useMemo(() => {
    if (mode !== "CITY") return null;
    if (!selectedCitySlug) return null;
    return cities.find((city) => city.slug === selectedCitySlug) ?? null;
  }, [cities, mode, selectedCitySlug]);

  const setGlobalMode = () => {
    if (!canUseGlobal) return;
    setMode("GLOBAL");
    setSelectedCitySlug("");
    persistValue({ mode: "GLOBAL" });
  };

  const setCityBySlug = (slug: string) => {
    const normalized = String(slug || "").trim().toLowerCase();

    if (isLockedToCity) {
      const forcedCity = cities.find(
        (city) => String(city.id) === String(lockedCityId ?? "").trim()
      );
      if (forcedCity) {
        setMode("CITY");
        setSelectedCitySlug(forcedCity.slug);
        persistValue({
          mode: "CITY",
          citySlug: forcedCity.slug,
        });
      }
      return;
    }

    if (!normalized) {
      setGlobalMode();
      return;
    }

    setMode("CITY");
    setSelectedCitySlug(normalized);
    persistValue({
      mode: "CITY",
      citySlug: normalized,
    });
  };

  const value = useMemo<CtccCityContextValue>(() => {
    const citySlug = selectedCity?.slug ?? "";
    const cityLabel =
      mode === "GLOBAL"
        ? "Vista Global"
        : selectedCity
          ? `${selectedCity.name}, ${selectedCity.department}`
          : "Ciudad";

    const cityGeoLabel =
      mode === "GLOBAL"
        ? "Todas las ciudades"
        : selectedCity
          ? `${selectedCity.name}, ${selectedCity.department}, ${selectedCity.country}`
          : "Ciudad no disponible";

    return {
      mode,
      selectedCity,
      cities,
      citiesLoading,
      citiesError,
      setGlobalMode,
      setCityBySlug,
      reloadCities: loadCities,
      citySlug,
      cityLabel,
      cityGeoLabel,
      isGlobal: mode === "GLOBAL",
      canUseGlobal,
      isLockedToCity,
    };
  }, [
    mode,
    selectedCity,
    cities,
    citiesLoading,
    citiesError,
    canUseGlobal,
    isLockedToCity,
  ]);

  return <CtccCityContext.Provider value={value}>{children}</CtccCityContext.Provider>;
}

export function useCtccCity() {
  const ctx = useContext(CtccCityContext);
  if (!ctx) {
    throw new Error("useCtccCity must be used within <CtccCityProvider />");
  }
  return ctx;
}