"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type City = { key: string; name: string; department: string; active: boolean };
const prefix = "/api/ctcc/admin/carga-kronix/coverage";
async function api(path = "", body?: object) {
  const response = await fetch(prefix + path, { cache: "no-store", ...(body && {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }) });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 404 ? "La API de cobertura de Carga está pendiente de activar." : data.message || "No se pudo guardar.");
  return data;
}

export default function CargaCoveragePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityEdit, setCityEdit] = useState<City>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(change?: () => Promise<unknown>) {
    setError(""); setBusy(true);
    try {
      await change?.();
      const data = await api();
      setCities(data.cities);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Error de conexión."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void run(); }, []);
  const label = (key: string) => {
    const city = cities.find(item => item.key === key);
    return city ? city.name + ", " + city.department : key;
  };
  function saveCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"), department: form.get("department"), active: form.has("active"),
      ...(cityEdit ? { key: cityEdit.key, existing: true } : form.get("key") ? { key: form.get("key") } : {}),
    };
    const element = event.currentTarget;
    void run(async () => { await api("/cities", body); setCityEdit(undefined); element.reset(); });
  }
  return <main>
    <header><p>Carga KroniX</p><h1>Ciudades de Carga</h1>
      <p>Cada ciudad habilitada puede usarse como origen, destino o parada.</p></header>
    <Link href="/carga">Volver a rutas</Link>
    {error && <p role="alert">{error}</p>}
    <form key={cityEdit?.key ?? "city-new"} onSubmit={saveCity}>
      <h2>{cityEdit ? "Editar ciudad" : "Añadir ciudad"}</h2>
      <label>Ciudad <input name="name" defaultValue={cityEdit?.name} required maxLength={60} /></label>
      {!cityEdit && <label>Código opcional para homónimos <input name="key" maxLength={80} placeholder="granada antioquia" /></label>}
      <label>Departamento <input name="department" defaultValue={cityEdit?.department} required maxLength={60} /></label>
      <label><input name="active" type="checkbox" defaultChecked={cityEdit?.active ?? true} /> Habilitada</label>
      <button disabled={busy}>Guardar ciudad</button>
      {cityEdit && <button type="button" onClick={() => setCityEdit(undefined)}>Cancelar</button>}
    </form>
    {cities.map(city => <article key={city.key}>
      <strong>{label(city.key)}</strong>
      <div className="carga-actions"><span className="carga-status" data-active={city.active}>{city.active ? "Habilitada" : "Pausada"}</span>
        <button disabled={busy} onClick={() => setCityEdit(city)}>Editar</button>
        <button disabled={busy} onClick={() => void run(() => api("/cities", { ...city, existing: true, active: !city.active }))}>{city.active ? "Pausar" : "Habilitar"}</button>
      </div>
    </article>)}
  </main>;
}
