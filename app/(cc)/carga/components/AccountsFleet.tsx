"use client";
import { useEffect, useState, type FormEvent } from "react";

type Carrier = { id: string; name: string; approved: boolean; phone?:string; identification?:string; fixture?:boolean; documents?:any[]; provider_name?:string; provider_identification?:string; provider_address?:string; provider_phone?:string; transport_authorization?:string };
type Vehicle = { id: string; carrier_id: string; label: string; type: string; weightKg: number; floorM2: number; active: boolean; color?:string; bodyLengthM?:number; otherType?:string; plate?:string; review_status?:string; documents?:{type:string;reference:string;expiresOn:string;photoId?:string;noExpiry?:boolean;declaredValid?:boolean}[] };
const types = ["Camión","Furgón","Camioneta","Tractocamión","Otro"];
const endpoint = "/api/ctcc/admin/carga-kronix/fleet";

export default function FleetPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter,setFilter]=useState("");
  const [selectedCarrier,setSelectedCarrier]=useState("");
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
      providerName:form.get("providerName"),providerIdentification:form.get("providerIdentification"),providerAddress:form.get("providerAddress"),providerPhone:form.get("providerPhone"),transportAuthorization:form.get("transportAuthorization"),
      id: editing?.id, carrierId: editing?.carrier_id ?? form.get("carrierId"),
      label: form.get("label"), plate:form.get("plate"), documents: Array.from({length:Math.max(4,editing?.documents?.length ?? 0)},(_,i)=>({
        ...editing?.documents?.[i],noExpiry:form.has("noExpiry"+i),type:form.get("type"+i),reference:form.get("ref"+i),expiresOn:form.get("expiry"+i),
      })).filter(doc=>doc.type || doc.reference || doc.expiresOn), type: form.get("type"), active: form.has("active"),
      color:form.get("color"),bodyLengthM:Number(form.get("bodyLengthM"))||null,otherType:form.get("otherType"),weightKg: Number(form.get("weightKg")), floorM2: Number(form.get("floorM2")),
    }).then(ok => { if (ok) element.reset(); });
  }
  return <section className="carga-account-view">
    <div className="carga-actions" style={{justifyContent:"space-between"}}><label>Buscar transportador o placa<input value={filter} onChange={e=>setFilter(e.target.value)}/></label><button onClick={()=>{setEditing(undefined);setSelectedCarrier("");setFormOpen(true);}}>Añadir vehículo</button><button disabled={busy} onClick={()=>void run()}>Actualizar</button></div>
    {error && <p role="alert">{error}</p>}
    {formOpen && <form key={editing?.id ?? "new"} onSubmit={save}>
      <h2>{editing ? "Editar vehículo" : "Añadir vehículo"}</h2>
      <label>Transportador <select name="carrierId" required value={editing?.carrier_id ?? selectedCarrier} onChange={e=>setSelectedCarrier(e.target.value)} disabled={!!editing}>
        <option value="">Seleccionar…</option>
        {carriers.map(carrier =>
          <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}
      </select></label>
      <fieldset className="carga-wide" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,padding:12,border:"1px solid #c6d7e5",borderRadius:12}}><legend>Prestador del servicio · revisión única</legend><p style={{gridColumn:"1/-1"}}>Estos datos y la licencia se revisan aquí junto con el vehículo. Al aprobar se habilita también el transportador.</p>
      {([["providerName","Nombre o razón social","provider_name","name"],["providerIdentification","Identificación","provider_identification","identification"],["providerAddress","Dirección de notificaciones","provider_address",""],["providerPhone","Teléfono","provider_phone","phone"],["transportAuthorization","Verificación de habilitación / modelo de transporte","transport_authorization",""]] as const).map(([key,label,stored,fallback])=>{const c=carriers.find(c=>c.id===(editing?.carrier_id??selectedCarrier));return <label key={key}>{label}<input key={(c?.id??"")+key} name={key} maxLength={500} defaultValue={(c as any)?.[stored]||(c as any)?.[fallback]||""}/></label>;})}
      </fieldset>
      <label>Alias privado <input name="label" required maxLength={80} defaultValue={editing?.label} placeholder="Camión 1" /></label>
      <label>Placa privada <input name="plate" maxLength={12} defaultValue={editing?.plate} /></label>
      <label>Color <input name="color" maxLength={40} defaultValue={editing?.color}/></label>
      <label>Largo carrocería · m <input name="bodyLengthM" type="number" min="0.01" max="40" step="0.01" defaultValue={editing?.bodyLengthM}/></label>
      <label>Otro tipo <input name="otherType" maxLength={60} defaultValue={editing?.otherType}/></label>
      <label>Tipo público <select name="type" defaultValue={editing?.type}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
      {([["weightKg","Peso · kg"],["floorM2","Piso · m²"]] as const).map(([key,label]) =>
        <label key={key}>{label}<input name={key} type="number" min="0.000001" max="1000000" step="any" required defaultValue={editing?.[key]??""} /></label>)}
      {Array.from({length:Math.max(4,editing?.documents?.length ?? 0)},(_,index)=>index).map(index=><div key={index} className="carga-wide carga-actions">
        <label>Documento {index+1}<input name={"type"+index} defaultValue={editing?.documents?.[index]?.type??["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"][index]} /></label>
        <label>Referencia<input name={"ref"+index} defaultValue={editing?.documents?.[index]?.reference} /></label>
        <label>Vence<input name={"expiry"+index} type="date" defaultValue={editing?.documents?.[index]?.expiresOn} /></label>
        {(editing?.documents?.[index]?.type??["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"][index])==="Tarjeta de propiedad"&&<label><input name={"noExpiry"+index} type="checkbox" defaultChecked={editing?.documents?.[index]?.noExpiry}/> Sin vencimiento</label>}
        {editing?.documents?.[index]?.photoId&&<a href={"/api/ctcc/admin/carga-kronix/documents/"+editing.documents[index].photoId} target="_blank" rel="noreferrer">📷 Ver documento</a>}
      </div>)}
      <label><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Aprobar vehículo y habilitar transportador</label>
      <button disabled={busy}>Guardar revisión</button>
      <button type="button" onClick={() => {setEditing(undefined);setFormOpen(false);}}>Cancelar</button>
    </form>}
    {carriers.filter(c=>!vehicles.some(v=>v.carrier_id===c.id)).filter(c=>c.name.toLowerCase().includes(filter.toLowerCase())).map(c=><article key={c.id}><div><strong>{c.name}</strong><p>{c.phone} · Sin vehículos asociados</p></div><button onClick={()=>{setSelectedCarrier(c.id);setEditing(undefined);setFormOpen(true);}}>Añadir vehículo</button></article>)}
    {vehicles.filter(v=>((carriers.find(c=>c.id===v.carrier_id)?.name??"")+" "+(v.plate??"")).toLowerCase().includes(filter.toLowerCase())).map(vehicle => <article key={vehicle.id}>
      <div><strong>{vehicle.label} · {vehicle.type}{vehicle.plate ? " · "+vehicle.plate : ""}</strong>
        <p>{carriers.find(carrier => carrier.id === vehicle.carrier_id)?.name} · {vehicle.weightKg} kg · {vehicle.floorM2??"Pendiente de verificar"} m²{vehicle.bodyLengthM?" · "+vehicle.bodyLengthM+" m de largo":""}{vehicle.color?" · "+vehicle.color:""}</p>
      </div>
      <div className="carga-actions">
        <span className="carga-status" data-active={carriers.find(c=>c.id===vehicle.carrier_id)?.approved}>Transportador {carriers.find(c=>c.id===vehicle.carrier_id)?.approved?"habilitado":"pendiente"}</span><span className="carga-status" data-active={vehicle.active}>{vehicle.review_status === "pending" ? "Pendiente" : vehicle.active ? "Aprobado" : "Rechazado"}</span>
        <button disabled={busy} onClick={() => {setEditing({...vehicle,documents:[...(vehicle.documents??[]).filter(d=>d.type!=="Licencia"),...(carriers.find(c=>c.id===vehicle.carrier_id)?.documents??[]).filter(d=>d.type==="Licencia")].sort((a,b)=>["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"].indexOf(a.type)-["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"].indexOf(b.type))});setSelectedCarrier(vehicle.carrier_id);setFormOpen(true);}}>Editar</button>
        <button disabled={busy} onClick={() => {if(vehicle.active){if(window.confirm("¿Rechazar este vehículo? Si no queda otro aprobado se pausará el transportador."))void run({...vehicle,carrierId:vehicle.carrier_id,active:false});}else{setEditing({...vehicle,active:true,documents:[...(vehicle.documents??[]).filter(d=>d.type!=="Licencia"),...(carriers.find(c=>c.id===vehicle.carrier_id)?.documents??[]).filter(d=>d.type==="Licencia")].sort((a,b)=>["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"].indexOf(a.type)-["Licencia","Tarjeta de propiedad","SOAT","Técnico-mecánica"].indexOf(b.type))});setSelectedCarrier(vehicle.carrier_id);setFormOpen(true);}}}>{vehicle.active ? "Rechazar" : "Revisar y aprobar"}</button>
      </div>
      <button disabled={busy} onClick={()=>{if(window.confirm("¿Eliminar este vehículo del catálogo?")) void run({id:vehicle.id},"/remove");}}>Eliminar</button>
      {!!vehicle.documents?.length && <details><summary>Documentos y vencimientos</summary><ul>{vehicle.documents.map(doc=><li key={doc.type}>{doc.type} · {doc.reference} · vence {doc.expiresOn}{doc.expiresOn < new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Bogota"}).format(new Date()) ? " · Vencido" : ""}</li>)}</ul></details>}
    </article>)}
  </section>;
}
