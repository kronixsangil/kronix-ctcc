"use client";

import { FormEvent, useEffect, useState } from "react";

const endpoint = "/api/ctcc/admin/carga-kronix/routes";
type Route = { id: string; stops: string[]; travel_date: string; vehicle_type: string; weight_kg: string; active: boolean };

export default function CargaRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path = "", body?: object) {
    const response = await fetch(endpoint + path, body && {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No se pudo consultar Carga KroniX.");
    return data;
  }

  async function run(action?: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action?.();
      setRoutes(await request());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void run(); }, []);

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(() => request("", {
      stops: String(form.get("stops")).split(",").map(stop => stop.trim()),
      travelDate: form.get("date"), vehicleType: form.get("vehicle"),
      weightKg: Number(form.get("weight")), volumeM3: Number(form.get("volume")),
      floorM2: Number(form.get("floor")), description: form.get("description"),
      intermediatePickup: form.has("intermediate"),
    }));
  }

  return <main style={{ display: "grid", gap: 8, maxWidth: 850 }}>
    <h1>Carga KroniX · Rutas</h1>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={publish} style={{ display: "grid", gap: 5 }}>
      <h2>Publicar disponibilidad</h2>
      <label>Paradas separadas por comas <input name="stops" required placeholder="Bogotá, Acacías, Granada" /></label>
      <label>Fecha <input name="date" type="date" required /></label>
      <label>Tipo de vehículo <input name="vehicle" required maxLength={80} /></label>
      <label>Peso disponible (kg) <input name="weight" type="number" step="any" min="0.01" required /></label>
      <label>Volumen disponible (m³) <input name="volume" type="number" step="any" min="0.01" required /></label>
      <label>Área disponible (m²) <input name="floor" type="number" step="any" min="0.01" required /></label>
      <label>Observaciones públicas <textarea name="description" required maxLength={500} /></label>
      <label><input type="checkbox" name="intermediate" /> Admitir recogidas intermedias</label>
      <button disabled={busy}>Publicar disponibilidad</button>
    </form>
    <h2>Publicaciones</h2>
    {busy && <p>Actualizando…</p>}
    {!busy && !error && !routes.length && <p>Aún no hay publicaciones.</p>}
    {routes.map(route => <article key={route.id} style={{ display: "grid", gap: 4, padding: 8, border: "1px solid #dce5ee", borderRadius: 8 }}>
      <strong>{route.stops.join(" → ")}</strong>
      <p>{route.travel_date} · {route.vehicle_type} · {route.weight_kg} kg · {route.active ? "Activa" : "Inactiva"}</p>
      {route.active && <button disabled={busy} onClick={() => void run(() => request("/deactivate", { id: route.id }))}>Desactivar</button>}
    </article>)}
  </main>;
}
