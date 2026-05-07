// app/(cc)/stores/components/StoresFilters.tsx
"use client";

import { AdminCityItem, StoreStatusFilter } from "../lib/storesApi";

type Props = {
  value: {
    q: string;
    status: StoreStatusFilter;
    citySlug: string;
    page: number;
    limit: number;
  };
  cities: AdminCityItem[];
  citiesLoading?: boolean;
  contextCityLocked?: boolean;
  onChange: (v: Props["value"]) => void;
  onClear: () => void;
};

export default function StoresFilters({
  value,
  cities,
  citiesLoading,
  contextCityLocked = false,
  onChange,
  onClear,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Buscar
          </label>
          <input
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
            placeholder="Código, nombre, dirección o categoría"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
          <div className="mt-2 text-[11px] text-slate-500">
            Los filtros se aplican automáticamente.
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ciudad
          </label>
          <select
            value={value.citySlug}
            onChange={(e) => onChange({ ...value, citySlug: e.target.value, page: 1 })}
            disabled={citiesLoading || contextCityLocked}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.department}
              </option>
            ))}
          </select>

          <div className="mt-2 text-[11px] text-slate-500">
            {contextCityLocked
              ? "La ciudad está siendo controlada desde el selector global del CTCC."
              : "Puedes filtrar por ciudad o ver todas las ciudades."}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </label>
          <select
            value={value.status}
            onChange={(e) =>
              onChange({ ...value, status: e.target.value as StoreStatusFilter, page: 1 })
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activas</option>
            <option value="PAUSED">Pausadas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            En vista
          </label>
          <select
            value={value.limit}
            onChange={(e) => onChange({ ...value, limit: Number(e.target.value), page: 1 })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="md:col-span-1 flex md:justify-end">
          <button
            onClick={onClear}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}