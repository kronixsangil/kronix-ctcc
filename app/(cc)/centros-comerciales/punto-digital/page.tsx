"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./point.module.css";

type Point = { id: string; cityId: string; name: string; enabled: boolean; assignedVisibleSeconds: number };
type Service = { id: string; label: string; channel: string; visual?: string; enabled: boolean; definitionId?: string; maxPending: number; timeoutSeconds: number; sortOrder: number };
type Company = { id: string; name: string; enabled: boolean };
type Access = { id: string; label: string; companyId: string | null; lastSeen: string | null; sessionUntil: string | null; revokedAt: string | null };
type Ticket = { id: string; alias: string; sequence: number | null; label: string; status: string; taxiNumber: string | null; archivedAt: string | null; completedAt: string | null; orderId: string | null; winnerCompanyId: string | null };
type Total = { localDate: string; serviceId: string; channel: string; status: string; count: number; attended: number; orders: number; archived: number };
type Overview = {
  point: Point; services: Service[]; companies: Company[]; accesses: Access[]; tickets: Ticket[]; totals: Total[];
  catalog: { id: string; shortName: string }[];
  audit: { id: string; action: string; subject: string | null; createdAt: string }[];
};
const route = "/api/ctcc/mall-point/admin/points";
const labels: Record<string, string> = { PENDING: "Pendiente", ASSIGNED: "Asignado", EXPIRED: "Expirado", CANCELLED: "Cancelado" };
const views = ["Resumen", "Servicios", "Centrales", "Dispositivos", "Seguridad", "Reportes"];

async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "La operación no se pudo completar.");
  return result;
}

function ServiceForm({ existing, catalog, save, busy }: {
  existing?: Service; catalog: Overview["catalog"]; save: (body: object) => Promise<void>; busy: boolean;
}) {
  const [channel, setChannel] = useState(existing?.channel ?? "TAXI");
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void save({
      action: "service", channel, id: existing?.id ?? values.get("id"),
      definitionId: existing?.definitionId ?? values.get("definitionId"),
      label: values.get("label"), visual: values.get("visual"), enabled: values.has("enabled"),
      maxPending: Number(values.get("maxPending")), timeoutSeconds: Number(values.get("timeoutSeconds")),
      sortOrder: Number(values.get("sortOrder")),
    });
  }}>
    {!existing && <>
      <label>Identificador<input name="id" required pattern="[a-z0-9][a-z0-9\-]{0,63}" placeholder="taxi" /></label>
      <label>Canal<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="TAXI">Taxi</option><option value="KRONIX">KroniX · atención presencial</option></select></label>
      {channel === "KRONIX" && <label>Definición publicada<select name="definitionId" required><option value="">Selecciona un servicio</option>{catalog.map((entry) => <option key={entry.id} value={entry.id}>{entry.shortName}</option>)}</select></label>}
    </>}
    <label>Nombre visible<input name="label" defaultValue={existing?.label ?? ""} maxLength={60} required /></label>
    <label>Fotografía<select name="visual" defaultValue={existing?.visual ?? (channel === "TAXI" ? "TAXI" : "")}><option value="">Sin fotografía</option><option value="DELIVERY">Domicilio</option><option value="TAXI">Taxi</option><option value="CARGO">Motocarro</option></select></label>
    <label>Cupo pendiente<input type="number" name="maxPending" min="0" max="100" defaultValue={existing?.maxPending ?? 3} required /></label>
    <label>Vencimiento en segundos<input type="number" name="timeoutSeconds" min="1" max="3600" defaultValue={existing?.timeoutSeconds ?? 180} required /></label>
    <label>Orden en pantalla<input type="number" name="sortOrder" min="0" max="1000" defaultValue={existing?.sortOrder ?? 100} required /></label>
    <label className={styles.check}><input type="checkbox" name="enabled" defaultChecked={existing?.enabled ?? false} /> Habilitado</label>
    <button disabled={busy}>{existing ? "Guardar servicio" : "Agregar servicio"}</button>
  </form>;
}

export default function MallPointPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [id, setId] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [view, setView] = useState("Resumen");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cities, setCities] = useState<{id: string; name: string}[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const loadPoints = useCallback(async () => {
    try {
      const rows = await api<Point[]>(route);
      setPoints(rows);
      setId((previous) => rows.some((row) => row.id === previous) ? previous : rows[0]?.id ?? "");
    } catch (failure) { setError((failure as Error).message); }
    finally { setLoaded(true); }
  }, []);

  const refresh = useCallback(async (pointId: string) => {
    try { setData(await api<Overview>(route + "/" + encodeURIComponent(pointId))); }
    catch (failure) { setError((failure as Error).message); }
  }, []);

  useEffect(() => { void loadPoints(); }, [loadPoints]);
  useEffect(() => {
    if (!id) return;
    void refresh(id);
    const timer = setInterval(() => void refresh(id), 12000);
    return () => clearInterval(timer);
  }, [id, refresh]);

  async function openCreate() {
    setShowCreate(true);
    try {
      const result = await api<{items: {id: string; name: string}[]}>("/api/ctcc/public/cities");
      setCities(result.items);
    } catch { /* The scoped city identifier may be entered by a global administrator. */ }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const created = await api<{id: string}>(route, { id: values.get("id"), name: values.get("name"), cityId: values.get("cityId") });
      await loadPoints();
      setId(created.id);
      setShowCreate(false);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  async function save(body: object) {
    if (busy || !id) return;
    setBusy(true);
    setError("");
    setCode("");
    try {
      const result = await api<{ code?: string }>(route + "/" + encodeURIComponent(id), body);
      if (result.code) setCode(result.code);
      await refresh(id);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  function report() {
    if (!data) return;
    const csv = ["fecha,servicio,canal,estado,total,atendidos,ordenes,avisos_archivados", ...data.totals.map((row) => [row.localDate,row.serviceId,row.channel,row.status,row.count,row.attended,row.orders,row.archived].join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "punto-digital-indicadores.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const current = data?.point.id === id ? data : null;
  const online = (access: Access) => !access.revokedAt && !!access.sessionUntil && Date.parse(access.sessionUntil) > Date.now() &&
    !!access.lastSeen && Date.now() - Date.parse(access.lastSeen) < 45000;
  return <main className={styles.page}>
    <header className={styles.heading}><div><p>Centros Comerciales</p><h1>{current?.point.name ?? "San Gil Plaza"} · Punto Digital</h1></div>
      {points.length > 0 && <select aria-label="Punto digital" value={id} onChange={(event) => { setCode(""); setId(event.target.value); }}>{points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}</select>}
    </header>
    {error && <p className={styles.alert} role="alert">{error}</p>}
    {loaded && !points.length && <section className={styles.panel}><p>Aún no hay puntos en tu alcance.</p><button onClick={openCreate}>Registrar punto</button></section>}
    {showCreate && <section className={styles.panel}><h2>Registrar punto</h2>
      <form className={styles.form} onSubmit={create}>
        <label>Identificador<input name="id" defaultValue="san-gil-plaza" required /></label>
        <label>Nombre<input name="name" defaultValue="CC San Gil Plaza" required /></label>
        <label>Ciudad{cities.length ? <select name="cityId" required><option value="">Selecciona la ciudad</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select> : <input name="cityId" required />}</label>
        <button disabled={busy}>Crear punto</button>
      </form>
    </section>}
    {current && <>
      <nav aria-label="Módulo Punto Digital" className={styles.tabs}>{views.map((item) => <button key={item} aria-pressed={item === view} onClick={() => { setView(item); setCode(""); }}>{item}</button>)}</nav>
      {view === "Resumen" && <>
        <div className={styles.metrics}>
          <div><small>Solicitudes pendientes</small><strong>{current.tickets.filter((ticket) => ticket.status === "PENDING").length}</strong></div>
          <div><small>Servicios habilitados</small><strong>{current.services.filter((service) => service.enabled).length}</strong></div>
          <div><small>Centrales en línea</small><strong>{new Set(current.accesses.filter((access) => access.companyId && online(access)).map((access) => access.companyId)).size}</strong></div>
          <div><small>Estado del punto</small><strong>{current.point.enabled ? "Activo" : "Pausado"}</strong></div>
        </div>
        <section className={styles.panel}><div className={styles.row}><h2>Solicitudes y llamados</h2><button disabled={busy} onClick={() => {
          if (!current.point.enabled || window.confirm("¿Pausar nuevas solicitudes de este punto?")) void save({action:"enabled", enabled:!current.point.enabled});
        }}>{current.point.enabled ? "Pausar punto" : "Activar punto"}</button></div>
          <div className={styles.scroll}><table><thead><tr><th>Turno o taxi</th><th>Alias</th><th>Servicio</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>{current.tickets.map((ticket) => <tr key={ticket.id}><td>{ticket.sequence != null ? String(ticket.sequence).padStart(3,"0") : ticket.taxiNumber ?? "—"}</td><td>{ticket.alias}</td><td>{ticket.label}</td><td>{ticket.completedAt ? (ticket.orderId ? "Atendido · Orden vinculada" : "Atendido en el punto") : labels[ticket.status] ?? ticket.status}</td>
              <td>{ticket.status === "PENDING" && <button disabled={busy} onClick={() => {
                if (window.confirm("¿Cancelar esta solicitud pendiente?")) void save({action:"cancel",id:ticket.id});
              }}>Cancelar</button>}{!ticket.archivedAt && ["ASSIGNED","EXPIRED"].includes(ticket.status) && <button disabled={busy} onClick={() => void save({action:"archive",id:ticket.id})}>Archivar aviso</button>}</td></tr>)}</tbody></table></div>
          {!current.tickets.length && <p>Sin solicitudes registradas.</p>}
        </section>
      </>}
      {view === "Servicios" && <div className={styles.cards}>
        <section className={styles.panel}><h2>Llamados en el tablero</h2>
          <form className={styles.form} key={current.point.id} onSubmit={(event) => {
            event.preventDefault();
            void save({action:"display", seconds:Number(new FormData(event.currentTarget).get("seconds"))});
          }}><label>Visibilidad en segundos<input name="seconds" type="number" min="15" max="3600" defaultValue={current.point.assignedVisibleSeconds} required /></label>
          <button disabled={busy}>Guardar duración</button></form>
        </section>
        {current.services.map((service) => <section className={styles.panel} key={service.id}><h2>{service.label}</h2><ServiceForm existing={service} catalog={current.catalog} save={save} busy={busy} /></section>)}
        <section className={styles.panel}><h2>Agregar servicio</h2><ServiceForm catalog={current.catalog} save={save} busy={busy} /></section>
      </div>}
      {view === "Centrales" && <section className={styles.panel}><h2>Centrales de taxi</h2>
        {current.companies.map((company) => <div className={styles.row} key={company.id}><span>{company.name} · {company.enabled ? "Habilitada" : "Pausada"}</span><button disabled={busy} onClick={() => void save({action:"company", ...company, enabled:!company.enabled})}>{company.enabled ? "Pausar" : "Habilitar"}</button></div>)}
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void save({action:"company",id:form.get("id"),name:form.get("name"),enabled:form.has("enabled")});
        }}><label>Identificador<input name="id" required /></label><label>Nombre<input name="name" required /></label>
        <label className={styles.check}><input name="enabled" type="checkbox" /> Convenio validado, habilitar central</label><button disabled={busy}>Guardar central</button></form>
      </section>}
      {view === "Dispositivos" && <section className={styles.panel}><h2>Dispositivos y accesos de central</h2>
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void save({action:"enroll",label:form.get("label"),companyId:form.get("companyId")});
        }}><label>Nombre del equipo u operador<input name="label" required /></label><label>Tipo de acceso<select name="companyId"><option value="">Tablet del punto</option>{current.companies.filter((company) => company.enabled).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><button disabled={busy}>Emitir código de 10 min</button></form>
        {code && <div className={styles.alert}><strong>Código de un solo uso</strong><code>{code}</code><button onClick={() => setCode("")}>Ocultar código</button></div>}
        {current.accesses.map((access) => <div className={styles.row} key={access.id}><span>{access.label} · {access.revokedAt ? "Revocado" : online(access) ? "En línea" : "Sin conexión"}</span>
          {!access.revokedAt && <button disabled={busy} onClick={() => {
            if (window.confirm("¿Revocar el acceso de " + access.label + "?")) void save({action:"revoke",id:access.id});
          }}>Revocar</button>}</div>)}
      </section>}
      {view === "Seguridad" && <section className={styles.panel}><h2>Clave de salida</h2>
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          form.reset();
          void save({action:"pin",pin:values.get("pin")});
        }}><label>Nueva clave de 8 a 16 dígitos<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{8,16}" autoComplete="new-password" required /></label><button disabled={busy}>Rotar clave</button></form>
        <h2>Auditoría reciente</h2>
        {current.audit.map((entry) => <div className={styles.row} key={entry.id}><span>{entry.action}</span><time>{new Date(entry.createdAt).toLocaleString("es-CO",{timeZone:"America/Bogota"})}</time></div>)}
      </section>}
      {view === "Reportes" && <section className={styles.panel}><div className={styles.row}><h2>Indicadores agregados de los últimos 30 días</h2><button onClick={report}>Exportar CSV</button></div>
        <div className={styles.scroll}><table><thead><tr><th>Fecha</th><th>Servicio</th><th>Canal</th><th>Estado</th><th>Total</th><th>Atendidos</th><th>Órdenes</th><th>Avisos archivados</th></tr></thead>
          <tbody>{current.totals.map((total) => <tr key={[total.localDate,total.serviceId,total.channel,total.status].join("|")}><td>{total.localDate}</td><td>{total.serviceId}</td><td>{total.channel}</td><td>{labels[total.status] ?? total.status}</td><td>{total.count}</td><td>{total.attended}</td><td>{total.orders}</td><td>{total.archived}</td></tr>)}</tbody></table></div>
      </section>}
    </>}
  </main>;
}



