// app/(cc)/stores/components/store-details/StoreOnboardingTab.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
import { AdminCityItem } from "../../lib/storesApi";

type Props = {
  mode: "create" | "edit";
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  cities: AdminCityItem[];
  citiesLoading: boolean;
};

export default function StoreOnboardingTab({
  mode,
  form,
  setForm,
  cities,
  citiesLoading,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Onboarding / Información de tienda</div>
        <div className="mt-1 text-xs text-slate-500">
          Datos base de afiliación. Los documentos físicos, geopuntos y validación presencial se gestionan desde KroniX.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Ciudad</label>
          <select
            value={String(form?.citySlug ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, citySlug: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={citiesLoading}
          >
            <option value="">Selecciona una ciudad</option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Código tienda</label>
          <input
            value={form?.storeCode ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, storeCode: e.target.value }))}
            disabled={mode === "edit"}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Nombre</label>
          <input
            value={form?.name ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Categoría</label>
          <input
            value={form?.category ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, category: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Dirección</label>
          <input
            value={form?.address ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, address: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Latitud comercio</label>
          <input
            value={String(form?.lat ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, lat: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Longitud comercio</label>
          <input
            value={String(form?.lng ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, lng: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">ETA min</label>
          <input
            value={String(form?.etaMin ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, etaMin: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">ETA max</label>
          <input
            value={String(form?.etaMax ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, etaMax: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Cel 1</label>
          <input
            value={form?.cel1 ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, cel1: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Cel 2</label>
          <input
            value={form?.cel2 ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, cel2: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Horario apertura</label>
          <input
            value={form?.hrOp ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, hrOp: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Horario cierre</label>
          <input
            value={form?.hrCl ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, hrCl: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Imagen principal</label>
          <input
            value={form?.image ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, image: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Imagen 2</label>
          <input
            value={form?.image2 ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, image2: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Imagen 3</label>
          <input
            value={form?.image3 ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, image3: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Imagen 4</label>
          <input
            value={form?.image4 ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, image4: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Descripción</label>
          <textarea
            rows={3}
            value={form?.description ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          <b>Nota operativa:</b> la revisión documental física, entrada principal, punto pickup drivers,
          zona y geopuntos adicionales se validan durante la visita KroniX y se gestionarán desde CTCC.
        </div>
      </div>
    </div>
  );
}
