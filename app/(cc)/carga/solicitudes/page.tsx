"use client";

import { useEffect, useState } from "react";

const endpoint = "/api/ctcc/admin/carga-kronix/demo/shipments";
type Shipment = { id: string; origin: string; destination: string; cargo: string; status: string; price?: number; proof?: string; commission_cop?: number };
const status: Record<string, string> = {
  requested: "Solicitud enviada", offered: "Oferta recibida", reserved: "Pago pendiente",
  review: "Pago en revisión", confirmed: "Reserva confirmada", picked_up: "Recogida", delivered: "Entregada",
};

export default function CargaShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<{ rate_bps: number; breb_key: string; beneficiary?: string }>();
  const [saved, setSaved] = useState(false);

  async function request(path = "", method = "GET", body?: object) {
    const response = await fetch(endpoint + path, {
      method, cache: "no-store", body: body && JSON.stringify(body),
      headers: body ? { "Content-Type": "application/json" } : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No se pudo consultar el envío.");
    return data;
  }

  async function refresh(path = "") {
    setBusy(true);
    setError("");
    try {
      if (path) await request(path, "POST");
      setSettings(await request("/settings"));
      setShipments(await request());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error de conexión.");
    } finally { setBusy(false); }
  }

  useEffect(() => { void refresh(); }, []);

  return <main>
    <header><p>Carga KroniX</p><h1>Solicitudes y reservas de muestra</h1><p>Configura la comisión Bre-B y revisa las referencias de pago.</p></header>
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
    {shipments.map(item => <article key={item.id}>
      <div><strong>{item.origin} → {item.destination}</strong>
      <p>{item.cargo}{item.price ? " · COP " + item.price : ""}</p></div><span className="carga-status">{status[item.status] ?? item.status}</span>
      {item.status === "review" && <div className="carga-actions">
        <div>Comisión COP {item.commission_cop} · Referencia de muestra {item.proof}</div>
        <button disabled={busy} onClick={() => void refresh("/" + item.id + "/confirm")}>Confirmar pago de muestra</button>
        <button disabled={busy} onClick={() => void refresh("/" + item.id + "/reject")}>Rechazar</button>
      </div>}
    </article>)}
  </main>;
}
