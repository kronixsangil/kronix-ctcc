// app/(cc)/cities/components/CitiesTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAdminCity,
  listAdminCities,
  type CtccCity,
  updateAdminCity,
} from "../lib/citiesApi";

type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

type FormState = {
  name: string;
  department: string;
  country: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  department: "",
  country: "Colombia",
  slug: "",
  isActive: true,
  isFeatured: false,
};

function slugify(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO");
}

function StatCard({
  title,
  value,
  subtitle,
  tone = "slate",
}: {
  title: string;
  value: string;
  subtitle: string;
  tone?: "blue" | "emerald" | "amber" | "rose" | "slate";
}) {
  const toneMap: Record<string, string> = {
    blue: "from-blue-50 to-white text-blue-700",
    emerald: "from-emerald-50 to-white text-emerald-700",
    amber: "from-amber-50 to-white text-amber-700",
    rose: "from-rose-50 to-white text-rose-700",
    slate: "from-slate-50 to-white text-slate-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-br ${toneMap[tone]} p-4`}>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
        <div className="mt-3 text-4xl font-semibold">{value}</div>
        <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export default function CitiesTab() {
  const [items, setItems] = useState<CtccCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CtccCity | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await listAdminCities({
        q,
        status,
        page: 1,
        limit: 200,
      });

      setItems(Array.isArray(res?.items) ? res.items : []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(String(e?.message ?? "No se pudo cargar el módulo de ciudades."));
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.isActive).length;
    const inactive = items.filter((x) => !x.isActive).length;
    const featured = items.filter((x) => x.isFeatured).length;
    const stores = items.reduce((acc, x) => acc + Number(x.storesCount || 0), 0);

    return { total, active, inactive, featured, stores };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(city: CtccCity) {
    setEditing(city);
    setForm({
      name: city.name,
      department: city.department,
      country: city.country,
      slug: city.slug,
      isActive: city.isActive,
      isFeatured: city.isFeatured,
    });
    setOpen(true);
  }

  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        department: form.department.trim(),
        country: form.country.trim() || "Colombia",
        slug: form.slug.trim(),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (!payload.name) {
        throw new Error("Debes ingresar el nombre de la ciudad.");
      }
      if (!payload.department) {
        throw new Error("Debes ingresar el departamento.");
      }

      if (editing?.id) {
        await updateAdminCity(editing.id, payload);
      } else {
        await createAdminCity(payload);
      }

      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? "No se pudo guardar la ciudad."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Gestión de ciudades</h2>
            <p className="mt-1 text-sm text-slate-600">
              Crea y administra ciudades sin tocar la base de datos manualmente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {lastUpdated ? `Actualizado: ${formatDateTime(lastUpdated.toISOString())}` : "Sin actualización"}
            </span>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Refrescar"}
            </button>

            <button
              onClick={openCreate}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Nueva ciudad
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Ciudades" value={String(summary.total)} subtitle="Cobertura registrada" tone="blue" />
        <StatCard title="Activas" value={String(summary.active)} subtitle="Disponibles para operar" tone="emerald" />
        <StatCard title="Inactivas" value={String(summary.inactive)} subtitle="Sin operación pública" tone="slate" />
        <StatCard title="Destacadas" value={String(summary.featured)} subtitle="Prioridad visual" tone="amber" />
        <StatCard title="Tiendas asociadas" value={String(summary.stores)} subtitle="Suma total enlazada" tone="rose" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Directorio de ciudades</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Usa este panel para controlar expansión, slugs y estado operativo.
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por ciudad, departamento, país o slug..."
                className="w-full sm:w-[320px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
              >
                <option value="ALL">Todas</option>
                <option value="ACTIVE">Activas</option>
                <option value="INACTIVE">Inactivas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Departamento</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Tiendas</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Actualizada</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Cargando ciudades...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No hay ciudades para mostrar.
                  </td>
                </tr>
              ) : (
                items.map((city) => (
                  <tr key={city.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{city.name}</div>
                      {city.isFeatured ? (
                        <div className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                          Destacada
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-slate-700">{city.department}</td>
                    <td className="px-4 py-3 text-slate-700">{city.country}</td>
                    <td className="px-4 py-3">
                      <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">{city.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{city.storesCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                          city.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200",
                        ].join(" ")}
                      >
                        {city.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(city.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(city)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="text-xl font-semibold text-slate-900">
                {editing ? "Editar ciudad" : "Nueva ciudad"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Define nombre, departamento, slug y estado operativo.
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    const nextSlug =
                      editing?.slug && form.slug === editing.slug
                        ? slugify(`${nextName}-${form.department}`)
                        : !form.slug
                        ? slugify(`${nextName}-${form.department}`)
                        : form.slug;

                    setForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: nextSlug,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
                  placeholder="Ej: Granada"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Departamento</label>
                <input
                  value={form.department}
                  onChange={(e) => {
                    const nextDepartment = e.target.value;
                    const nextSlug =
                      editing?.slug && form.slug === editing.slug
                        ? slugify(`${form.name}-${nextDepartment}`)
                        : !form.slug
                        ? slugify(`${form.name}-${nextDepartment}`)
                        : form.slug;

                    setForm((prev) => ({
                      ...prev,
                      department: nextDepartment,
                      slug: nextSlug,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
                  placeholder="Ej: Meta"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">País</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
                  placeholder="Colombia"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-300"
                  placeholder="granada-meta"
                />
                <div className="mt-1 text-xs text-slate-500">
                  Recomendado: ciudad-departamento
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">Ciudad activa</div>
                    <div className="text-xs text-slate-500">Disponible para ser usada por Buyer y tiendas.</div>
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">Ciudad destacada</div>
                    <div className="text-xs text-slate-500">Se puede priorizar en selectores y cobertura inicial.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                  setForm(EMPTY_FORM);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={onSubmit}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear ciudad"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}