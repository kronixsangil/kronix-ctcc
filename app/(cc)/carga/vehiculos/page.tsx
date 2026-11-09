"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Carrier = { id: string; name: string; approved: boolean };
type Vehicle = { id: string; carrier_id: string; label: string; type: string; weightKg: number; volumeM3: number; floorM2: number; active: boolean };
const types = ["Camión","Furgón","Camioneta","Tractocamión","Otro"];
const endpoint = "/api/ctcc/admin/carga-kronix/fleet";

export default function FleetPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editing, setEditing] = useState<Vehicle>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(body?: object) {
    const response = await fetch(endpoint, { cache: "no-store", ...(body && {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }) });
    const data = await response.json();
    if (!response.ok) throw new Error(response.status === 404 ? "La API de vehículos de Carga está pendiente de activar." : data.message || "No se pudo consultar la flota.");
    return data;
  }
  async function run(body?: object) {
    setError(""); setBusy(true);
    try {
      if (body) await request(body);
      const data = await request();
      setCarriers(data.carriers); setVehicles(data.vehicles);
      if (body) setEditing(undefined);
      return true;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Error de conexión.");
      return false;
    } finally { setBusy(false); }
  }
  useEffect(() => { void run(); }, []);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    void run({
      id: editing?.id, carrierId: editing?.carrier_id ?? form.get("carrierId"),
      label: form.get("label"), type: form.get("type"), active: form.has("active"),
      weightKg: Number(form.get("weightKg")), volumeM3: Number(form.get("volumeM3")), floorM2: Number(form.get("floorM2")),
    }).then(ok => { if (ok) element.reset(); });
  }
  return <main>
    <header><p>Carga KroniX</p><h1>Vehículos</h1><p>Asigna vehículos habilitados y sus límites a cada transportador. El alias es privado.</p></header>
    <Link href="/carga/transportadores">Volver a transportadores</Link>
    {error && <p role="alert">{error}</p>}
    <form key={editing?.id ?? "new"} onSubmit={save}>
      <h2>{editing ? "Editar vehículo" : "Añadir vehículo"}</h2>
      <label>Transportador <select name="carrierId" required defaultValue={editing?.carrier_id ?? ""} disabled={!!editing}>
        <option value="">Seleccionar…</option>
        {carriers.filter(carrier => carrier.approved || carrier.id === editing?.carrier_id).map(carrier =>
          <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}
      </select></label>
      <label>Alias privado <input name="label" required maxLength={80} defaultValue={editing?.label} placeholder="Camión 1" /></label>
      <label>Tipo público <select name="type" defaultValue={editing?.type}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
      {([["weightKg","Peso · kg"],["volumeM3","Volumen · m³"],["floorM2","Piso · m²"]] as const).map(([key,label]) =>
        <label key={key}>{label}<input name={key} type="number" min="0.000001" max="1000000" step="any" required defaultValue={editing?.[key]} /></label>)}
      <label><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Habilitado</label>
      <button disabled={busy}>Guardar vehículo</button>
      {editing && <button type="button" onClick={() => setEditing(undefined)}>Cancelar</button>}
    </form>
    {vehicles.map(vehicle => <article key={vehicle.id}>
      <div><strong>{vehicle.label} · {vehicle.type}</strong>
        <p>{carriers.find(carrier => carrier.id === vehicle.carrier_id)?.name} · {vehicle.weightKg} kg · {vehicle.volumeM3} m³ · {vehicle.floorM2} m²</p>
      </div>
      <div className="carga-actions">
        <span className="carga-status" data-active={vehicle.active}>{vehicle.active ? "Habilitado" : "Pausado"}</span>
        <button disabled={busy} onClick={() => setEditing(vehicle)}>Editar</button>
        <button disabled={busy} onClick={() => void run({ ...vehicle, carrierId: vehicle.carrier_id, active: !vehicle.active })}>{vehicle.active ? "Pausar" : "Habilitar"}</button>
      </div>
    </article>)}
  </main>;
}
