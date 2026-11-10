"use client";
import Link from "next/link";
import { useEffect,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { admin,type Route } from "../operations";
type City={key:string;name:string;department:string;active:boolean};
type Carrier={id:string;name:string;approved:boolean};
type Vehicle={id:string;carrier_id:string;label:string;plate?:string;active:boolean;review_status:string};

export default function RouteForm() {
  const router=useRouter();
  const [route,setRoute]=useState<Route>();
  const [cities,setCities]=useState<City[]>([]);
  const [carriers,setCarriers]=useState<Carrier[]>([]);
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [carrier,setCarrier]=useState("");
  const [vehicle,setVehicle]=useState("");
  const [origin,setOrigin]=useState("");
  const [destination,setDestination]=useState("");
  const [stops,setStops]=useState<string[]>([]);
  const [destinations,setDestinations]=useState<string[]>([]);
  const [full,setFull]=useState(false);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get("id");
    void Promise.all([admin("coverage"),admin("fleet"),id ? admin("routes") : Promise.resolve([])]).then(([coverage,fleet,rows])=>{
      setCities(coverage.cities.filter((city:City)=>city.active));setCarriers(fleet.carriers.filter((item:Carrier)=>item.approved));
      setVehicles(fleet.vehicles.filter((item:Vehicle)=>item.active && item.review_status==="approved"));
      const row:Route|undefined=rows.find((item:Route)=>item.id===id);
      if (id && !row) throw new Error("Ruta no encontrada.");
      if (row) {
        setRoute(row);setCarrier(row.carrier_id??"");setVehicle(row.vehicle_id??"");setOrigin(row.stops[0]);
        setDestination(row.stops.length>1 ? row.stops.at(-1)??"" : "");setStops(row.stops.slice(1,-1));
        setFull(row.load_mode==="full");setDestinations(row.destinations??[]);
      }
      setReady(true);
    }).catch(failure=>setError(failure.message));
  },[]);
  const citySelect=(value:string,change:(key:string)=>void)=><select required value={value} onChange={event=>change(event.target.value)}>
    <option value="">Seleccionar…</option>{cities.map(city=><option key={city.key} value={city.key}>{city.name}, {city.department}</option>)}
  </select>;
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (route && !window.confirm("Guardar cambios cerrará las solicitudes y ofertas que sigan pendientes. ¿Continuar?")) return;
    setBusy(true);setError("");
    const form=new FormData(event.currentTarget);
    try {
      await admin(route ? "routes/"+route.id+"/manage" : "routes",{
        ...(route ? {action:"edit"} : {}),carrierId:carrier,vehicleId:vehicle || undefined,
        mode:full ? "full" : "partial",stops:full ? [origin] : [origin,...stops,destination],destinations,
        date:form.get("date"),dateTo:form.get("dateTo"),loadingStart:form.get("loadingStart"),loadingEnd:form.get("loadingEnd"),
        weightKg:String(form.get("weightKg")??""),floorM2:String(form.get("floorM2")??""),
        intermediatePickup:form.has("intermediate"),description:form.get("description"),
      });
      router.push("/carga");
    } catch (failure) {setError(failure instanceof Error ? failure.message : "Error al guardar.");}
    finally {setBusy(false);}
  }
  const fleet=vehicles.filter(item=>item.carrier_id===carrier);
  return <main>
    <header><p>Carga KroniX</p><h1>{route ? "Editar ruta" : "Crear ruta"}</h1><p>La placa y el transportador son datos internos.</p></header>
    <Link href="/carga">‹ Volver a rutas</Link>
    {error && <p role="alert">{error}</p>}
    {ready && <form onSubmit={save}>
      <label>Transportador <select required value={carrier} onChange={event=>{setCarrier(event.target.value);setVehicle("");}}>
        <option value="">Seleccionar…</option>{carriers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <label>Vehículo y placa <select required value={vehicle || (fleet.length===1 ? fleet[0].id : "")} onChange={event=>setVehicle(event.target.value)}>
        <option value="">Seleccionar…</option>{fleet.map(item=><option key={item.id} value={item.id}>{item.label}{item.plate ? " · "+item.plate : ""}</option>)}
      </select></label>
      <label>Tipo <select value={full?"full":"partial"} onChange={event=>setFull(event.target.value==="full")}><option value="partial">Carga parcial</option><option value="full">Full carga</option></select></label>
      <label>Origen {citySelect(origin,setOrigin)}</label>
      {!full && <label>Destino {citySelect(destination,setDestination)}</label>}
      {full && <label>Destinos opcionales<select multiple value={destinations} onChange={event=>setDestinations(Array.from(event.target.selectedOptions,option=>option.value))}>
        {cities.filter(city=>city.key!==origin).map(city=><option key={city.key} value={city.key}>{city.name}, {city.department}</option>)}</select></label>}
      <label>{full?"Desde":"Fecha"} <input name="date" type="date" required defaultValue={route?.expired ? "" : route?.travel_date} /></label>
      {full ? <label>Hasta <input name="dateTo" type="date" required defaultValue={route?.expired ? "" : route?.available_until} /></label> : <>
        <label>Inicio de cargue <input name="loadingStart" type="time" required defaultValue={route?.loading_start} /></label>
        <label>Fin de cargue <input name="loadingEnd" type="time" required defaultValue={route?.loading_end} /></label>
        <label>Peso · kg <input name="weightKg" type="number" step="any" min="0.01" required defaultValue={route?.weight_kg} /></label>
        <label>Piso · m² <input name="floorM2" type="number" step="any" min="0.01" required defaultValue={route?.floor_m2} /></label>
        {stops.map((key,index)=><label key={index}>Parada {index+1} {citySelect(key,value=>setStops(previous=>previous.map((item,i)=>i===index?value:item)))}
          <button type="button" onClick={()=>setStops(previous=>previous.filter((_,i)=>i!==index))}>Quitar</button></label>)}
        <button type="button" onClick={()=>setStops(previous=>[...previous,""])}>Añadir parada</button>
        <label><input name="intermediate" type="checkbox" defaultChecked={route?.intermediate_pickup} /> Permitir recogidas en paradas</label>
      </>}
      <label className="carga-wide">Observaciones públicas <textarea name="description" maxLength={500} defaultValue={route?.description} /></label>
      <button disabled={busy || !carrier || !fleet.length}>Guardar disponibilidad</button>
    </form>}
  </main>;
}
