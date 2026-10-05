"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCarpoolCity,
  createCarpoolRoute,
  listCarpoolCities,
  listCarpoolRoutes,
  updateCarpoolCity,
  type CarpoolCity,
  updateCarpoolRoute,
  type CarpoolRoute,
  type CarpoolRoutePoint,
  type CreateCarpoolRouteInput,
} from "./lib/routesApi";

const emptyPoint = (
  type: "DEPARTURE" | "ARRIVAL",
  sortOrder: number,
): CarpoolRoutePoint => ({
  type,
  name: "",
  address: "",
  reference: "",
  lat: 0,
  lng: 0,
  sortOrder,
  offsetMinutes: 0,
  isActive: true,
});

const initialForm = (): CreateCarpoolRouteInput => ({
  slug: "",
  name: "",
  originCityId: "",
  destinationCityId: "",
  distanceKm: 1,
  estimatedMinutes: 1,
  status: "DRAFT",
  points: [emptyPoint("DEPARTURE", 1), emptyPoint("ARRIVAL", 1)],
  policy: {
    passengerPriceCOP: 23000,
    kronixFeeCOP: 2000,
    maxAdvanceMinutes: 4320,
    paymentWindowMinutes: 10,
    refundCutoffMinutes: 120,
    driverResponseMinutes: 30,
    minBookingCutoffMinutes: 0,
    maxBookingCutoffMinutes: 1440,
    minWaitToleranceMinutes: 0,
    maxWaitToleranceMinutes: 60,
    maxSeatsPerBooking: 3,
  },
});

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RutaKronixRoutesPage() {
  const [routes, setRoutes] = useState<CarpoolRoute[]>([]);
  const [cities, setCities] = useState<CarpoolCity[]>([]);
  const [cityForm, setCityForm] = useState({
    name: "",
    department: "",
    country: "Colombia",
  });
  const [savingCity, setSavingCity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateCarpoolRouteInput>(initialForm);

  const activeCities = useMemo(
    () => cities.filter((city) => city.isActive),
    [cities],
  );

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [routeRows, cityRows] = await Promise.all([
        listCarpoolRoutes(),
        listCarpoolCities(),
      ]);
      setRoutes(Array.isArray(routeRows) ? routeRows : []);
      setCities(Array.isArray(cityRows) ? cityRows : []);
    } catch (e: any) {
      setError(e?.message || "No fue posible cargar el motor de rutas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submitCity(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSavingCity(true);
      setError("");
      await createCarpoolCity(cityForm);
      setCityForm({ name: "", department: "", country: "Colombia" });
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible crear la ciudad de Ruta KroniX.");
    } finally {
      setSavingCity(false);
    }
  }

  async function toggleCity(city: CarpoolCity) {
    try {
      setError("");
      await updateCarpoolCity(city.id, { isActive: !city.isActive });
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible cambiar el estado de la ciudad.");
    }
  }

  function patchPoint(index: number, patch: Partial<CarpoolRoutePoint>) {
    setForm((current) => ({
      ...current,
      points: current.points.map((point, i) =>
        i === index ? { ...point, ...patch } : point,
      ),
    }));
  }

  function addPoint(type: "DEPARTURE" | "ARRIVAL") {
    setForm((current) => {
      const count = current.points.filter(
        (point) => point.type === type,
      ).length;
      if (count >= 3) return current;
      return {
        ...current,
        points: [...current.points, emptyPoint(type, count + 1)],
      };
    });
  }

  function removePoint(index: number) {
    setForm((current) => {
      const target = current.points[index];
      const sameType = current.points.filter(
        (point) => point.type === target.type,
      );
      if (sameType.length <= 1) return current;
      const remaining = current.points.filter((_, i) => i !== index);
      let order = 0;
      return {
        ...current,
        points: remaining.map((point) =>
          point.type === target.type ? { ...point, sortOrder: ++order } : point,
        ),
      };
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (editingId) await updateCarpoolRoute(editingId, { name: form.name, distanceKm: form.distanceKm, estimatedMinutes: form.estimatedMinutes, points: form.points, policy: form.policy });
      else await createCarpoolRoute(form);
      setOpen(false);
      setEditingId(null);
      setForm(initialForm());
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible crear el trayecto.");
    } finally {
      setSaving(false);
    }
  }

  function edit(route: CarpoolRoute) {
    setEditingId(route.id);
    setForm({ slug: route.slug, name: route.name, originCityId: route.originCity.id, destinationCityId: route.destinationCity.id, distanceKm: route.distanceKm, estimatedMinutes: route.estimatedMinutes, status: route.status === "ACTIVE" ? "ACTIVE" : "DRAFT", points: route.points.map((point) => ({ ...point })), policy: { ...initialForm().policy, ...(route.policies[0] || {}) } });
    setOpen(true);
  }

  async function toggle(route: CarpoolRoute) {
    try {
      const next = route.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateCarpoolRoute(route.id, { status: next });
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible cambiar el estado.");
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">Ruta KroniX</p>
          <h1 className="text-3xl font-bold text-slate-950">
            Motor de trayectos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cada sentido se administra como un trayecto independiente.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(initialForm()); setOpen(true); }}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Crear trayecto
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-950">
            Ciudades de Ruta KroniX
          </h2>
          <p className="text-sm text-slate-500">
            Catálogo independiente: no habilita ciudades en KroniX Servicios.
          </p>
        </div>
        <form
          onSubmit={submitCity}
          className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            required
            value={cityForm.name}
            onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
            className="rounded-xl border border-slate-200 p-3"
            placeholder="Ciudad"
          />
          <input
            required
            value={cityForm.department}
            onChange={(e) =>
              setCityForm({ ...cityForm, department: e.target.value })
            }
            className="rounded-xl border border-slate-200 p-3"
            placeholder="Departamento"
          />
          <input
            required
            value={cityForm.country}
            onChange={(e) =>
              setCityForm({ ...cityForm, country: e.target.value })
            }
            className="rounded-xl border border-slate-200 p-3"
            placeholder="País"
          />
          <button
            disabled={savingCity}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingCity ? "Guardando..." : "Agregar ciudad"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => void toggleCity(city)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${city.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
            >
              {city.name}, {city.department} ·{" "}
              {city.isActive ? "Activa" : "Inactiva"}
            </button>
          ))}
          {!loading && cities.length === 0 ? (
            <p className="text-sm text-slate-500">
              Agrega la primera ciudad para crear trayectos.
            </p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-left text-white">
              <tr>
                <th className="px-5 py-4">Trayecto</th>
                <th className="px-5 py-4">Distancia y tiempo</th>
                <th className="px-5 py-4">Valores actuales</th>
                <th className="px-5 py-4">Puntos</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routes.map((route) => {
                const policy = route.policies?.[0];
                const departures = route.points.filter(
                  (point) => point.type === "DEPARTURE",
                ).length;
                const arrivals = route.points.filter(
                  (point) => point.type === "ARRIVAL",
                ).length;
                return (
                  <tr key={route.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {route.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {route.originCity.name} → {route.destinationCity.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {route.distanceKm} km
                      <br />
                      {route.estimatedMinutes} min
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      Pasajero: {money(policy?.passengerPriceCOP ?? 0)}
                      <br />
                      KroniX: {money(policy?.kronixFeeCOP ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {departures} salida{departures === 1 ? "" : "s"}
                      <br />
                      {arrivals} llegada{arrivals === 1 ? "" : "s"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${route.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                      <button onClick={() => edit(route)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Editar</button>
                      <button
                        onClick={() => void toggle(route)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {route.status === "ACTIVE" ? "Suspender" : "Activar"}
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && routes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Aún no existen trayectos.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Cargando trayectos...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
          <form
            onSubmit={submit}
            className="mx-auto my-6 w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {editingId ? "Editar trayecto" : "Crear trayecto"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingId ? "Corrige distancia, duración, valores y puntos autorizados." : "Configura el sentido, los puntos y la primera política."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Ciudad de origen
                <select
                  required
                  value={form.originCityId}
                  onChange={(e) =>
                    setForm({ ...form, originCityId: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Seleccionar</option>
                  {activeCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Ciudad de destino
                <select
                  required
                  value={form.destinationCityId}
                  onChange={(e) =>
                    setForm({ ...form, destinationCityId: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                >
                  <option value="">Seleccionar</option>
                  {activeCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Nombre
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  placeholder="San Gil a Bucaramanga"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  placeholder="san-gil-bucaramanga"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Distancia en km
                <input
                  type="number"
                  min={1}
                  required
                  value={form.distanceKm}
                  onChange={(e) =>
                    setForm({ ...form, distanceKm: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Duración estimada en minutos
                <input
                  type="number"
                  min={1}
                  required
                  value={form.estimatedMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedMinutes: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>
            </div>

            {(["DEPARTURE", "ARRIVAL"] as const).map((type) => {
              const title =
                type === "DEPARTURE" ? "Puntos de salida" : "Puntos de llegada";
              const indexes = form.points
                .map((point, index) => ({ point, index }))
                .filter(({ point }) => point.type === type);
              return (
                <section
                  key={type}
                  className="mt-7 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <button
                      type="button"
                      onClick={() => addPoint(type)}
                      disabled={indexes.length >= 3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                    >
                      Agregar punto
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {indexes.map(({ point, index }) => (
                      <div
                        key={`${type}-${index}`}
                        className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2"
                      >
                        <input
                          required
                          value={point.name}
                          onChange={(e) =>
                            patchPoint(index, { name: e.target.value })
                          }
                          className="rounded-xl border border-slate-200 p-3"
                          placeholder="Nombre del punto"
                        />
                        <input
                          required
                          value={point.address}
                          onChange={(e) =>
                            patchPoint(index, { address: e.target.value })
                          }
                          className="rounded-xl border border-slate-200 p-3"
                          placeholder="Dirección"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          value={point.lat}
                          onChange={(e) =>
                            patchPoint(index, { lat: Number(e.target.value) })
                          }
                          className="rounded-xl border border-slate-200 p-3"
                          placeholder="Latitud"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          value={point.lng}
                          onChange={(e) =>
                            patchPoint(index, { lng: Number(e.target.value) })
                          }
                          className="rounded-xl border border-slate-200 p-3"
                          placeholder="Longitud"
                        />
                        <input
                          value={point.reference || ""}
                          onChange={(e) =>
                            patchPoint(index, { reference: e.target.value })
                          }
                          className="rounded-xl border border-slate-200 p-3"
                          placeholder="Referencia opcional"
                        />
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min={0}
                            value={point.offsetMinutes || 0}
                            onChange={(e) =>
                              patchPoint(index, {
                                offsetMinutes: Number(e.target.value),
                              })
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3"
                            placeholder="Minutos"
                          />
                          <button
                            type="button"
                            onClick={() => removePoint(index)}
                            className="rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-600"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="mt-7 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900">
                Valores y tiempos iniciales
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="text-sm text-slate-600">
                  Precio por pasajero
                  <input
                    type="number"
                    min={0}
                    value={form.policy.passengerPriceCOP}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          passengerPriceCOP: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Aporte KroniX
                  <input
                    type="number"
                    min={0}
                    value={form.policy.kronixFeeCOP}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          kronixFeeCOP: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Anticipación máxima en minutos
                  <input
                    type="number"
                    min={1}
                    value={form.policy.maxAdvanceMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          maxAdvanceMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Ventana de pago
                  <input
                    type="number"
                    min={1}
                    value={form.policy.paymentWindowMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          paymentWindowMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Cancelación con devolución
                  <input
                    type="number"
                    min={0}
                    value={form.policy.refundCutoffMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          refundCutoffMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Tiempo respuesta conductor
                  <input
                    type="number"
                    min={1}
                    value={form.policy.driverResponseMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        policy: {
                          ...form.policy,
                          driverResponseMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                  />
                </label>
              </div>
            </section>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear trayecto"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
