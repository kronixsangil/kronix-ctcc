"use client";
import { useEffect, useState, type FormEvent } from "react";

type Carrier = { id:string; name:string; phone:string; identification:string; approved:boolean;
  vehicle?: {label:string; plate:string; weightKg:number; volumeM3:number; floorM2:number};
  documents: {type:string; reference:string; expiresOn:string}[] };
type Ticket = { id:string; name:string; message:string; state:string; reply?:string };
const base = "/api/ctcc/admin/carga-kronix/accounts/";
async function api(path:string, body?:object) {
  const response = await fetch(base+path,{ cache:"no-store", ...(body && {
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
  }) });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 404 ? "Actualiza primero la API de Carga." : data.message || "No se pudo completar la operación.");
  return data;
}

export default function Accounts() {
  const [carriers,setCarriers] = useState<Carrier[]>([]);
  const [tickets,setTickets] = useState<Ticket[]>([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function load(action?: () => Promise<unknown>) {
    setBusy(true); setError("");
    try {
      if (action) await action();
      const [accounts,support] = await Promise.all([api("carriers"),api("support")]);
      setCarriers(accounts); setTickets(support);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Error de conexión."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); },[]);
  function answer(event:FormEvent<HTMLFormElement>, id:string) {
    event.preventDefault();
    const reply = new FormData(event.currentTarget).get("reply");
    void load(() => api("support",{ id,reply }));
  }

  return <main>
    <header><p>Carga KroniX</p><h1>Cuentas y soporte</h1><p>Revisa solicitudes de publicación y responde a los casos de soporte.</p></header>
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} onClick={() => void load()}>Actualizar</button>
    <h2>Solicitudes de transportador</h2>
    {!carriers.length && <p>Sin cuentas registradas.</p>}
    {carriers.map(carrier => <article key={carrier.id}>
      <div><strong>{carrier.name}</strong><p>{carrier.phone} · ID {carrier.identification}</p>
      {carrier.vehicle && <p>{carrier.vehicle.label} · {carrier.vehicle.plate} · {carrier.vehicle.weightKg} kg · {carrier.vehicle.volumeM3} m³ · {carrier.vehicle.floorM2} m²</p>}</div>
      <div className="carga-actions">
        <span className="carga-status" data-active={carrier.approved}>{carrier.approved ? "Aprobada" : "Pendiente"}</span>
        <button disabled={busy} onClick={() => void load(() => api("approve",{id:carrier.id,approved:!carrier.approved}))}>
          {carrier.approved ? "Pausar publicación" : "Aprobar publicación"}
        </button>
      </div>
      <details><summary>Referencias documentales</summary>
        <ul>{carrier.documents.map(doc => <li key={doc.type}>{doc.type} · {doc.reference} · {doc.expiresOn}</li>)}</ul>
      </details>
    </article>)}
    <h2>Soporte</h2>
    {!tickets.length && <p>Sin casos de soporte.</p>}
    {tickets.map(ticket => <article key={ticket.id}>
      <div><strong>{ticket.name} · {ticket.state === "open" ? "Abierto" : "Respondido"}</strong><p>{ticket.message}</p>
        {ticket.reply && <p>Respuesta: {ticket.reply}</p>}</div>
      {ticket.state === "open" && <form onSubmit={event => answer(event,ticket.id)}>
        <label>Respuesta <textarea name="reply" required maxLength={2000} /></label>
        <button disabled={busy}>Responder</button>
      </form>}
    </article>)}
  </main>;
}
