"use client";

import { useEffect, useRef, useState } from "react";

const endpoint = "/api/ctcc/admin/carga-kronix/demo/shipments";
type Shipment = { id: string; origin: string; destination: string; cargo: string; status: string; price?: number; proof?: string; commission_cop?: number; pickup_date?:string; kg?:number; m2?:number; length_m?:number; width_m?:number; height_m?:number };
const status: Record<string, string> = {
  requested: "Solicitud enviada", offered: "Oferta recibida", reserved: "Pago pendiente",
  review: "Pago en revisión", confirmed: "Reserva confirmada", picked_up: "Recogida", delivered: "Entregada",
};

export default function CargaShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<{ rate_bps: number; breb_key: string; beneficiary?: string }>();
  const refreshing=useRef(false),[loaded,setLoaded]=useState(false);
  const [saved, setSaved] = useState(false);

  async function request(path = "", method = "GET", body?: object) {
    const response = await fetch(endpoint + path, {
      method, cache: "no-store", body: body && JSON.stringify(body),
      signal:AbortSignal.timeout(20000),
      headers: body ? { "Content-Type": "application/json" } : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No se pudo consultar el envío.");
    return data;
  }

  async function refresh(path = "") {
    if(refreshing.current)return;refreshing.current=true;
    setBusy(true);
    setError("");
    try {
      if (path) await request(path, "POST");
      const [config,rows]=await Promise.allSettled([request("/settings"),request()]);
      if(config.status==="fulfilled")setSettings(previous=>JSON.stringify(previous)===JSON.stringify(config.value)?previous:config.value);
      if(rows.status==="fulfilled"){setShipments(rows.value);setLoaded(true);}else throw rows.reason;
      if(config.status==="rejected")throw config.reason;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error de conexión.");
    } finally { refreshing.current=false;setBusy(false); }
  }

  useEffect(() => { void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);return()=>clearInterval(timer); }, []);

  return <main>
    <header><p>Carga KroniX</p><h1>Solicitudes y reservas</h1><p>Configura la comisión Bre-B y revisa las referencias de pago.</p></header>
    {settings && <form key={JSON.stringify(settings)} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setBusy(true);
      setSaved(false);
      setError("");
      void request("/settings", "POST", Object.fromEntries(form)).then(data => {
        setSettings(data);
        setSaved(true);
      }).catch(error => setError(error.message)).finally(() => setBusy(false));
    }}>
      <h2>Comisión y llave Bre-B</h2>
      <label>Comisión (%) <input name="percent" type="number" min="0.01" max="100" step="0.01" defaultValue={settings.rate_bps / 100} required /></label>
      <label>Llave <input name="key" defaultValue={settings.breb_key} required maxLength={80} /></label>
      <label>Titular <input name="beneficiary" defaultValue={settings.beneficiary ?? ""} maxLength={120} /></label>
      <button disabled={busy}>Guardar configuración</button>
      {saved && <span role="status">Configuración guardada.</span>}
    </form>}
    <button disabled={busy} onClick={() => void refresh()}>Actualizar</button>
    {error && <p role="alert">{error}</p>}
    {!loaded&&!error&&<p role="status">Cargando solicitudes…</p>}
    {loaded&&!shipments.length&&!error&&<p>Aún no hay solicitudes. Se actualiza automáticamente cada 30 segundos.</p>}
    {shipments.map(item => <article key={item.id}>
      <div><strong>{item.origin} → {item.destination}</strong>
      <p>{item.pickup_date ? "Cargue: "+item.pickup_date.split("-").reverse().join("/")+" · " : ""}{item.cargo}{item.price ? " · COP " + item.price : ""}</p>
      <p>Peso: {item.kg??"—"} kg · {item.length_m&&item.width_m&&item.height_m?`Largo ${item.length_m} × ancho ${item.width_m} × alto ${item.height_m} mts`:`Piso ${item.m2??"—"} m² · Solicitud anterior sin medidas`}</p></div><span className="carga-status">{status[item.status] ?? item.status}</span>
      {item.status === "review" && <div className="carga-actions">
        <div>Comisión COP {item.commission_cop} · Referencia de transferencia {item.proof}</div>
        <button disabled={busy} onClick={() => void refresh("/" + item.id + "/confirm")}>Confirmar comisión</button>
        <button disabled={busy} onClick={() => void refresh("/" + item.id + "/reject")}>Rechazar</button>
      </div>}
    </article>)}
  </main>;
}

