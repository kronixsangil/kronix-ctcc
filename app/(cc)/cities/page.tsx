// app/(cc)/cities/page.tsx
"use client";

import CitiesTab from "./components/CitiesTab";

export default function CitiesPage() {
  return (
    <main className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ciudades</h1>
            <p className="mt-1 text-sm text-slate-600">
              Administra cobertura geográfica, expansión por ciudad y disponibilidad operativa de KroniX .
            </p>
          </div>
        </div>
      </div>

      <CitiesTab />
    </main>
  );
}