"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Carrier = { id: string; name: string; approved: boolean };
type Vehicle = { id: string; carrier_id: string; label: string; type: string; weightKg: number; floorM2: number; active: boolean; plate?:string; review_status?:string; documents?:{type:string;reference:string;expiresOn:string}[] };
const types = ["Camión","Furgón","Camioneta","Tractocamión","Otro"];
const endpoint = "/api/ctcc/admin/carga-kronix/fleet";

export default function FleetPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formOpen,setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(body?: object,path = "") {
    const response = await fetch(endpoint+path, { cache: "no-store", ...(body && {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }) });
    const data = await response.json();
    if (!response.ok) throw new Error(response.status === 404 ? "La API de vehículos de Carga está pendiente de activar." : data.message || "No se pudo consultar la flota.");
    return data;
  }
  async function run(body?: object,path = "") {
    setError(""); setBusy(true);
    try {
      if (body) await request(body,path);
      const data = await request();
      setCarriers(data.carriers); setVehicles(data.vehicles);
      if (body) {setEditing(undefined);setFormOpen(false);}
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
      label: form.get("label"), plate:form.get("plate"), documents: Array.from({length:Math.max(4,editing?.documents?.length ?? 0)},(_,i)=>({
        type:form.get("type"+i),reference:form.get("ref"+i),expiresOn:form.get("expiry"+i),
      })).filter(doc=>doc.type || doc.reference || doc.expiresOn), type: form.get("type"), active: form.has("active"),
      weightKg: Number(form.get("weightKg")), floorM2: Number(form.get("floorM2")),
    }).then(ok => { if (ok) element.reset(); });
  }
  return <main>
    <header className="carga-titlebar"><div><p>Carga KroniX</p><h1>Vehículos</h1><p>Revisa la flota y sus vencimientos. El alias y la placa son privados.</p></div>
      <button onClick={()=>{setEditing(undefined);setFormOpen(true);}}>Añadir vehículo</button></header>
    <Link href="/carga/transportadores">Volver a transportadores</Link>
    {error && <p role="alert">{error}</p>}
    {formOpen && <form key={editing?.id ?? "new"} onSubmit={save}>
      <h2>{editing ? "Editar vehículo" : "Añadir vehículo"}</h2>
      <label>Transportador <select name="carrierId" required defaultValue={editing?.carrier_id ?? ""} disabled={!!editing}>
        <option value="">Seleccionar…</option>
        {carriers.map(carrier =>
          <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}
      </select></label>
      <label>Alias privado <input name="label" required maxLength={80} defaultValue={editing?.label} placeholder="Camión 1" /></label>
      <label>Placa privada <input name="plate" maxLength={12} defaultValue={editing?.plate} /></label>
      <label>Tipo público <select name="type" defaultValue={editing?.type}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
      {([["weightKg","Peso · kg"],["floorM2","Piso · m²"]] as const).map(([key,label]) =>
        <label key={key}>{label}<input name={key} type="number" min="0.000001" max="1000000" step="any" required defaultValue={editing?.[key]} /></label>)}
      {Array.from({length:Math.max(4,editing?.documents?.length ?? 0)},(_,index)=>index).map(index=><div key={index} className="carga-wide carga-actions">
        <label>Documento {index+1}<input name={"type"+index} defaultValue={editing?.documents?.[index]?.type} /></label>
        <label>Referencia<input name={"ref"+index} defaultValue={editing?.documents?.[index]?.reference} /></label>
        <label>Vence<input name={"expiry"+index} type="date" defaultValue={editing?.documents?.[index]?.expiresOn} /></label>
      </div>)}
      <label><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Habilitado</label>
      <button disabled={busy}>Guardar vehículo</button>
      <button type="button" onClick={() => {setEditing(undefined);setFormOpen(false);}}>Cancelar</button>
    </form>}
    {vehicles.map(vehicle => <article key={vehicle.id}>
      <div><strong>{vehicle.label} · {vehicle.type}{vehicle.plate ? " · "+vehicle.plate : ""}</strong>
        <p>{carriers.find(carrier => carrier.id === vehicle.carrier_id)?.name} · {vehicle.weightKg} kg · {vehicle.floorM2} m²</p>
      </div>
      <div className="carga-actions">
        <span className="carga-status" data-active={vehicle.active}>{vehicle.review_status === "pending" ? "Pendiente" : vehicle.active ? "Aprobado" : "Rechazado"}</span>
        <button disabled={busy} onClick={() => {setEditing(vehicle);setFormOpen(true);}}>Editar</button>
        <button disabled={busy} onClick={() => void run({ ...vehicle, carrierId: vehicle.carrier_id, active: !vehicle.active })}>{vehicle.active ? "Rechazar" : "Aprobar"}</button>
      </div>
      <button disabled={busy} onClick={()=>{if(window.confirm("¿Eliminar este vehículo del catálogo?")) void run({id:vehicle.id},"/remove");}}>Eliminar</button>
      {!!vehicle.documents?.length && <details><summary>Documentos y vencimientos</summary><ul>{vehicle.documents.map(doc=><li key={doc.type}>{doc.type} · {doc.reference} · vence {doc.expiresOn}{doc.expiresOn < new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Bogota"}).format(new Date()) ? " · Vencido" : ""}</li>)}</ul></details>}
    </article>)}
  </main>;
}
