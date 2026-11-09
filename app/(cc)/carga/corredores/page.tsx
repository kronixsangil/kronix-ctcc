"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type City = { key: string; name: string; department: string; active: boolean };
type Corridor = { id: string; name: string; stops: string[]; active: boolean };
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
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [cityEdit, setCityEdit] = useState<City>();
  const [corridorEdit, setCorridorEdit] = useState<Corridor>();
  const [stops, setStops] = useState<string[]>([]);
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(change?: () => Promise<unknown>) {
    setError(""); setBusy(true);
    try {
      await change?.();
      const data = await api();
      setCities(data.cities); setCorridors(data.corridors);
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
  function saveCorridor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const element = event.currentTarget;
    void run(async () => {
      await api("/corridors", { id: corridorEdit?.id, name: form.get("name"), active: form.has("active"), stops });
      setCorridorEdit(undefined); setStops([]); setNext(""); element.reset();
    });
  }
  function move(index: number, direction: number) {
    setStops(previous => {
      const next = [...previous];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
  }

  return <main>
    <header><p>Carga KroniX</p><h1>Ciudades y corredores</h1>
      <p>Las ciudades habilitadas definen la cobertura. Los corredores son opcionales y ayudan a ordenar paradas.</p></header>
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
    <form key={corridorEdit?.id ?? "corridor-new"} onSubmit={saveCorridor}>
      <h2>{corridorEdit ? "Editar corredor" : "Añadir corredor"}</h2>
      <label>Nombre <input name="name" defaultValue={corridorEdit?.name} required maxLength={80} placeholder="Bogotá – Granada" /></label>
      <label>Agregar ciudad
        <select value={next} onChange={event => setNext(event.target.value)}>
          <option value="">Seleccionar…</option>
          {cities.filter(city => !stops.includes(city.key)).map(city => <option key={city.key} value={city.key}>{label(city.key)}</option>)}
        </select>
      </label>
      <button type="button" disabled={!next || stops.length >= 50} onClick={() => { setStops(previous => [...previous,next]); setNext(""); }}>Añadir al corredor</button>
      <label><input name="active" type="checkbox" defaultChecked={corridorEdit?.active ?? true} /> Habilitado</label>
      <ol className="carga-wide">
        {stops.map((key,index) => <li key={key} className="carga-actions">
          <span>{index + 1}. {label(key)}</span>
          <button type="button" aria-label={"Subir " + label(key)} disabled={index === 0} onClick={() => move(index,-1)}>↑</button>
          <button type="button" aria-label={"Bajar " + label(key)} disabled={index === stops.length-1} onClick={() => move(index,1)}>↓</button>
          <button type="button" onClick={() => setStops(previous => previous.filter(item => item !== key))}>Quitar</button>
        </li>)}
      </ol>
      <button disabled={busy || stops.length < 2}>Guardar corredor</button>
      {corridorEdit && <button type="button" onClick={() => { setCorridorEdit(undefined); setStops([]); setNext(""); }}>Cancelar</button>}
    </form>
    {corridors.map(corridor => <article key={corridor.id}>
      <div><strong>{corridor.name}</strong><p>{corridor.stops.map(label).join(" → ")}</p></div>
      <div className="carga-actions"><span className="carga-status" data-active={corridor.active}>{corridor.active ? "Habilitado" : "Pausado"}</span>
        <button disabled={busy} onClick={() => { setCorridorEdit(corridor); setStops(corridor.stops); setNext(""); }}>Editar</button>
        <button disabled={busy} onClick={() => void run(() => api("/corridors", { ...corridor, active: !corridor.active }))}>{corridor.active ? "Pausar" : "Habilitar"}</button>
      </div>
    </article>)}
  </main>;
}
