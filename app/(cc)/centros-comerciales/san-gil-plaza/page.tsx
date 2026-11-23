"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

const url = "/api/ctcc/san-gil-plaza/admin/content";
const kinds = {
  PUBLICACION: "Publicación", COMERCIO: "Establecimiento", EVENTO: "Evento",
  PROMOCION: "Promoción", CUPON: "Cupón", WEB: "Web oficial",
};
type Draft = {
  kind: keyof typeof kinds;
  title: string;
  description: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  cardImageUrl?: string;
  linkUrl?: string;
  catalogUrl?: string;
  floor?: string;
  schedule?: string;
};
type Row = { id: string; revision: number; draft: Draft; publishAt?: string; scheduledAt?: string; planKey?: string; expiresAt?: string };
type Plan = { key: string; title: string; price: number; format: 1 | 2; catalog: boolean; kronix: boolean; notifications: "NONE" | "MONTHLY" | "WEEKLY"; coupon: boolean };
const plansUrl = "/api/ctcc/san-gil-plaza/admin/plans";
const initial: Draft = { kind: "PUBLICACION", title: "", description: "" };
const fields = { bannerImageUrl: "URL de imagen Banner (panorámica 3:1)", cardImageUrl: "URL de imagen Tarjeta (2:1 establecimientos · 4:5 eventos y promociones)", imageUrl: "Imagen anterior (respaldo opcional)", linkUrl: "URL de destino", catalogUrl: "Enlace de Public_link o Dine_in", floor: "Piso o local", schedule: "Horario" } as const;

function previewImage(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.hostname === "drive.google.com") {
      const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get("id");
      if (id && /^[\w-]+$/.test(id)) return "https://lh3.googleusercontent.com/d/" + id;
    }
  } catch { return undefined; }
  return value;
}

function ImagePreview({ src, title, ratio }: { src?: string; title: string; ratio: string }) {
  const [failed, setFailed] = useState<string>();
  const image = previewImage(src);
  return <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <figcaption className="px-3 py-2 text-sm font-semibold">{title}</figcaption>
    <div className="flex items-center justify-center bg-slate-100" style={{ aspectRatio: ratio }}>
      {image && image !== failed
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={image} alt={title} className="h-full w-full object-contain" onError={() => setFailed(image)} />
        : <p className="p-3 text-center text-sm text-slate-500">{image ? "No se pudo cargar. Revisa el vínculo y el acceso público del archivo." : "Sin imagen"}</p>}
    </div>
  </figure>;
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "La operación no se pudo completar.");
  }
  return response.json();
}

export default function SanGilPlazaPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [selected, setSelected] = useState<Row>();
  const [draft, setDraft] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [expiry, setExpiry] = useState("");

  const refresh = useCallback(async () => {
    const all = await request<Row[]>(url);
    setRows(all);
    setLoadedAt(Date.now());
    return all;
  }, []);
  useEffect(() => {
    Promise.all([Promise.resolve().then(refresh), request<Plan[]>(plansUrl).then(setPlans)]).catch((error: Error) => setMessage(error.message));
  }, [refresh]);

  function select(row?: Row) {
    setSelected(row);
    setDraft(row?.draft ?? initial);
    setDirty(false);
    setDate("");
    setPreview(false);
    setExpiry("");
  }

  function change(fields: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...fields }));
    setDirty(true);
  }

  async function mutate(action: "save" | "publish" | "withdraw") {
    setBusy(true);
    setMessage("");
    try {
      const result = selected
        ? await request<{ id: string }>(url + "/" + selected.id, {
            action, revision: selected.revision, draft,
            publishAt: action === "publish" && date ? date + ":00-05:00" : undefined,
          })
        : await request<{ id: string }>(url, draft);
      select((await refresh()).find((row) => row.id === result.id));
      setMessage(action === "save" ? "Borrador guardado." : action === "withdraw" ? "Contenido retirado." : "Publicación guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación falló.");
    } finally {
      setBusy(false);
    }
  }

  const input = "rounded border border-slate-300 bg-white p-2 text-slate-900";
  const button = "rounded border px-3 py-2 disabled:opacity-50";

  async function savePlan(assign: boolean) {
    if (!plan) return;
    setBusy(true);
    try {
      if (assign && selected) {
        await request(plansUrl + "/assign", { id: selected.id, planKey: plan.key, expiresAt: expiry + ":00-05:00" });
        setSelected((await refresh()).find((row) => row.id === selected.id));
      } else if (!assign) {
        await request(plansUrl, plan);
        setPlans(await request<Plan[]>(plansUrl));
      }
      setMessage(assign ? "Plan asignado." : "Configuración del plan guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación falló.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4">
      <h1 className="text-2xl font-bold">San Gil Plaza</h1>
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <section className="space-y-2" aria-label="Contenido">
          <button className={button} disabled={busy} onClick={() => select()}>Nuevo contenido</button>
          {rows.map((row) => (
            <button key={row.id} className={button + " block w-full text-left"} disabled={busy} onClick={() => select(row)}>
              {row.draft.title} · {kinds[row.draft.kind]}<br />
              <small>{row.scheduledAt && new Date(row.scheduledAt).getTime() > loadedAt ? "Programado" : row.publishAt || row.scheduledAt ? "Publicado" : "Borrador"}</small>
            </button>
          ))}
        </section>
        <form onSubmit={(event: FormEvent) => { event.preventDefault(); void mutate("save"); }} className="grid content-start gap-3">
          <label className="grid">Tipo
            <select className={input} value={draft.kind} onChange={(event) => change({ kind: event.target.value as Draft["kind"] })}>
              {Object.entries(kinds).map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
          </label>
          <label className="grid">Título<input className={input} required maxLength={120} value={draft.title} onChange={(event) => change({ title: event.target.value })} /></label>
          <label className="grid">Descripción<textarea className={input} maxLength={4000} value={draft.description} onChange={(event) => change({ description: event.target.value })} /></label>
          {Object.entries(fields).map(([field, label]) => {
            const name = field as keyof typeof fields;
            if (name === "catalogUrl" && draft.kind !== "COMERCIO") return null;
            return <label key={name} className="grid">{label}<input className={input} type={name.endsWith("Url") ? "url" : "text"} value={draft[name] ?? ""} onChange={(event) => change({ [name]: event.target.value })} /></label>;
          })}
          <p className="text-sm text-slate-600">Banner: destacados y carruseles. Tarjeta: cuadrículas y detalle. Puedes pegar el vínculo compartido del archivo de Drive; debe tener acceso de lector para cualquiera con el enlace. Guarda el borrador y publica para aplicar los cambios.</p>
          {selected && <label className="grid">Programar publicación (hora de Colombia)<input className={input} type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></label>}
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={busy}>Guardar borrador</button>
            <button className={button} type="button" onClick={() => setPreview(!preview)}>{preview ? "Cerrar vista previa" : "Vista previa"}</button>
            {selected && <button className={button} type="button" disabled={busy || dirty} onClick={() => void mutate("publish")}>{date ? "Programar" : "Publicar ahora"}</button>}
            {selected && <button className={button} type="button" disabled={busy} onClick={() => void mutate("withdraw")}>Retirar</button>}
          </div>
          {message && <p role="status">{message}</p>}
          {preview && <article className="space-y-3 rounded border p-3">
            <h2 className="text-xl font-bold">{draft.title}</h2>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <ImagePreview src={draft.bannerImageUrl || draft.imageUrl || draft.cardImageUrl} title="Banner · 3:1" ratio="3 / 1" />
              <ImagePreview src={draft.cardImageUrl || draft.imageUrl || draft.bannerImageUrl} title={draft.kind === "COMERCIO" ? "Tarjeta · 2:1" : "Tarjeta · 4:5"} ratio={draft.kind === "COMERCIO" ? "2 / 1" : "4 / 5"} />
            </div>
            <p>{draft.description}</p><p>{draft.floor}</p><p>{draft.schedule}</p>
          </article>}
        </form>
      </div>
      <section className="grid gap-3 rounded border p-4" aria-label="Planes">
        <h2 className="text-xl font-bold">Planes comerciales</h2>
        <label className="grid">Plan
          <select className={input} value={plan?.key ?? ""} onChange={(event) => setPlan(plans.find((item) => item.key === event.target.value))}>
            <option value="">Selecciona un plan</option>
            {[1, 2, 3].map((catalog) => <optgroup key={catalog} label={"Catálogo " + catalog}>
              {plans.filter((item) => item.key.startsWith(catalog + "-")).map((item) => <option key={item.key} value={item.key}>{item.title} · ${item.price.toLocaleString("es-CO")}</option>)}
            </optgroup>)}
          </select>
        </label>
        {plan && <>
          <label className="grid">Nombre<input className={input} value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value })} /></label>
          <label className="grid">Precio mensual (COP)<input className={input} type="number" min={50000} max={150000} value={plan.price} onChange={(event) => setPlan({ ...plan, price: Number(event.target.value) })} /></label>
          <label className="grid">Formato
            <select className={input} value={plan.format} onChange={(event) => setPlan({ ...plan, format: event.target.value === "1" ? 1 : 2 })}><option value={1}>Banner</option><option value={2}>Tarjeta</option></select>
          </label>
          <label className="grid">Notificaciones
            <select className={input} value={plan.notifications} onChange={(event) => setPlan({ ...plan, notifications: event.target.value as Plan["notifications"] })}><option value="NONE">Sin campañas</option><option value="MONTHLY">Mensual</option><option value="WEEKLY">Semanal</option></select>
          </label>
          {([{ key: "catalog", label: "Public_link + Dine_in" }, { key: "kronix", label: "Presencia en KroniX" }, { key: "coupon", label: "Cupón" }] as const).map(({ key, label }) =>
            <label key={key}><input type="checkbox" checked={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: event.target.checked })} /> {label}</label>)}
          <button className={button} disabled={busy} onClick={() => void savePlan(false)}>Guardar configuración del plan</button>
          {selected?.draft.kind === "COMERCIO" && <>
            <p>Establecimiento seleccionado: {selected.draft.title}</p>
            {selected.planKey && <p>Plan asignado: {plans.find((item) => item.key === selected.planKey)?.title} · {selected.expiresAt ? new Date(selected.expiresAt).toLocaleString("es-CO", { timeZone: "America/Bogota" }) : ""}</p>}
            <label className="grid">Vencimiento (hora de Colombia)<input className={input} type="datetime-local" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
            <button className={button} disabled={busy || !expiry} onClick={() => void savePlan(true)}>Asignar plan al establecimiento</button>
          </>}
        </>}
      </section>
    </main>
  );
}
