"use client";
import { useEffect, useState, type FormEvent } from "react";

type Carrier = { id:string; name:string; phone:string; identification:string; approved:boolean;
  vehicle?: {label:string; plate:string; weightKg:number; volumeM3:number; floorM2:number; color?:string; bodyLengthM?:number; otherType?:string};
  documents: {type:string; reference:string; expiresOn:string; photoId?:string; noExpiry?:boolean; declaredValid?:boolean}[] };
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
  function review(event:FormEvent<HTMLFormElement>,carrier:Carrier) {
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const documents=carrier.documents.map((doc,index)=>({
      type:doc.type,reference:String(form.get("reference"+index)??""),
      expiresOn:String(form.get("expiry"+index)??""),noExpiry:form.get("noExpiry"+index)==="on",
    }));
    void load(()=>api("review",{id:carrier.id,documents,floorM2:Number(form.get("floorM2"))}));
  }
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
      {carrier.vehicle && <p>{carrier.vehicle.label} · {carrier.vehicle.plate} · {carrier.vehicle.weightKg} kg · {carrier.vehicle.bodyLengthM ? carrier.vehicle.bodyLengthM+' m de largo' : carrier.vehicle.floorM2+' m²'} · {carrier.vehicle.color}</p>}</div>
      <div className="carga-actions">
        <span className="carga-status" data-active={carrier.approved}>{carrier.approved ? "Aprobada" : "Pendiente"}</span>
        <button disabled={busy} onClick={() => void load(() => api("approve",{id:carrier.id,approved:!carrier.approved}))}>
          {carrier.approved ? "Pausar publicación" : "Aprobar publicación"}
        </button>
      </div>
      <details><summary>Revisar documentos y completar datos</summary>
        <p>Comprueba las fotos, transcribe los números y vencimientos, guarda la revisión y después aprueba la publicación.</p>
        <form onSubmit={event=>review(event,carrier)}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
            {carrier.documents.map((doc,index)=><fieldset key={doc.type} style={{padding:16,border:"1px solid #cbd5e1",borderRadius:12}}>
              <legend>{doc.type}</legend>
              {doc.photoId ? <a href={"/api/ctcc/admin/carga-kronix/documents/"+doc.photoId} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={"/api/ctcc/admin/carga-kronix/documents/"+doc.photoId} alt={"Documento privado: "+doc.type}
                  style={{width:"100%",height:180,objectFit:"contain",background:"#eef2f6"}}/>
                Abrir foto completa
              </a> : <p>Registro anterior sin foto.</p>}
              {doc.declaredValid&&<p>✓ El transportador declaró que está vigente.</p>}
              <label>Número <input name={"reference"+index} defaultValue={doc.reference??""} required maxLength={80}/></label>
              <label>Vencimiento <input name={"expiry"+index} type="date" defaultValue={doc.expiresOn??""}/></label>
              {doc.type==="Tarjeta de propiedad"&&<label><input type="checkbox" name={"noExpiry"+index} defaultChecked={doc.noExpiry}/> Documento sin vencimiento</label>}
            </fieldset>)}
          </div>
          <label>Área útil verificada · m² <input name="floorM2" type="number" step="0.01" min="0.01" required defaultValue={carrier.vehicle?.floorM2??""}/></label>
          <p>El largo de la carrocería se conserva en metros. El área útil es una medida independiente.</p>
          <button disabled={busy}>Guardar revisión documental</button>
        </form>
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
