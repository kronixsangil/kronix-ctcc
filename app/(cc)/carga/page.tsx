"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { admin,type Route } from "./operations";
export default function Routes() {
  const [rows,setRows]=useState<Route[]>();
  const [names,setNames]=useState<Record<string,string>>({});
  const [filter,setFilter]=useState("all");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function refresh(id?:string,action?:string) {
    setBusy(true);setError("");
    try {
      if (id && action) await admin("routes/"+id+"/manage",{action});
      setRows(await admin("routes"));
    } catch (failure) {setError(failure instanceof Error ? failure.message : "Error de conexión.");}
    finally {setBusy(false);}
  }
  useEffect(() => {
    void refresh();
    void admin("coverage").then(data=>setNames(Object.fromEntries(data.cities.map((city:{key:string;name:string})=>[city.key,city.name])))).catch(()=>{});
  },[]);
  return <main>
    <header className="carga-titlebar"><div><p>Carga KroniX</p><h1>Rutas de Carga</h1><p>Disponibilidades, viajes en ruta e historial.</p></div>
      <Link className="carga-primary" href="/carga/publicacion">Crear ruta</Link></header>
    <div className="carga-actions">{[["all","Todas"],["active","Disponibles"],["transit","En ruta"],["history","Historial"]].map(([key,label])=>
      <button key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}
      <button disabled={busy} onClick={()=>void refresh()}>Actualizar</button></div>
    {error && <p role="alert">{error}</p>}
    {!rows && !error && <p>Cargando rutas…</p>}
    {rows?.filter(row=>filter==="all" || (filter==="transit" ? row.in_transit : filter==="active" ? row.active&&!row.expired&&!row.in_transit : !row.in_transit&&(!row.active||row.expired))).map(row=><article key={row.id}>
      <div><strong>{row.stops.map(key=>names[key]??key).join(" → ")}{row.load_mode==="full" ? " · Disponibilidad total" : ""}</strong>
        <p>{row.travel_date}{row.available_until ? " al "+row.available_until : ""} · {row.carrier_name ?? "Sin transportador asignado"}{row.plate ? " · "+row.plate : ""} · {row.weight_kg} kg · {row.floor_m2} m²</p></div>
      <div className="carga-actions">
        <span className="carga-status" data-active={row.active&&!row.expired}>{row.in_transit ? "En ruta" : row.cancelled_at ? "Cancelada" : row.expired ? "Vencida" : row.active ? "Disponible" : "Pausada"}</span>
        {!row.cancelled_at && !row.has_requests && <Link className="carga-primary" href={"/carga/publicacion?id="+row.id}>{row.expired ? "Reprogramar" : "Editar"}</Link>}
        {!row.cancelled_at && row.active && !row.expired && <button disabled={busy} onClick={()=>void refresh(row.id,"pause")}>Pausar</button>}
        {!row.cancelled_at && !row.active && !row.expired && <button disabled={busy} onClick={()=>void refresh(row.id,"activate")}>Activar</button>}
        <button disabled={busy} onClick={()=>{if(window.confirm("¿Retirar esta ruta del panel? Las reservas activas impiden eliminarla.")) void refresh(row.id,"delete");}}>Eliminar</button>
      </div>
    </article>)}
  </main>;
}
