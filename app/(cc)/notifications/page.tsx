"use client";
import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../components/CtccCityContext";
import { listNotificationHistory, previewNotification, sendNotification, type NotificationAudience } from "./lib/notificationsApi";

type AudienceKey = "buyer" | "driver" | "store";
type SmartDestination = { label: string; value: string; hint: string };

const destinationsByAudience: Record<AudienceKey, SmartDestination[]> = {
  buyer: [
    { label: "Inicio", value: "/", hint: "Inicio de Buyer App" },
    { label: "Pide un Almuerzo", value: "/almuerzos", hint: "Servicio de Almuerzos" },
    { label: "Pedidos", value: "/orders", hint: "Pedidos del cliente" },
    { label: "Saldo", value: "/wallet", hint: "Wallet / saldo del cliente" },
  ],
  driver: [
    { label: "Inicio", value: "/", hint: "Inicio de Trabajadores" },
    { label: "Historial", value: "/history", hint: "Historial de servicios" },
    { label: "Saldo", value: "/wallet", hint: "Wallet / saldo del trabajador" },
  ],
  store: [
    { label: "Inicio", value: "/", hint: "Inicio de Store App" },
  ],
};

function audienceLabel(row:any){ return [row.audienceBuyer&&"Clientes",row.audienceDriver&&"Trabajadores",row.audienceStore&&"Negocios"].filter(Boolean).join(" + "); }
export default function NotificationsPage(){
  const { citySlug, cityLabel, isGlobal } = useCtccCity();
  const [title,setTitle]=useState(""); const [body,setBody]=useState(""); const [url,setUrl]=useState("/almuerzos");
  const [audience,setAudience]=useState<NotificationAudience>({buyer:true,driver:false,store:false});
  const [preview,setPreview]=useState<any>(null); const [history,setHistory]=useState<any[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [ok,setOk]=useState("");
  const payload=useMemo(()=>({title,body,url,sound:"kronix-campaign",audience,...(!isGlobal&&citySlug?{citySlug}:{})}),[title,body,url,audience,isGlobal,citySlug]);
  const selectedAudienceKeys = useMemo(() =>
    (["buyer", "driver", "store"] as AudienceKey[]).filter((key) => audience[key]),
    [audience]
  );
  const smartDestinations = useMemo<SmartDestination[]>(() => {
    if (selectedAudienceKeys.length === 1) {
      return destinationsByAudience[selectedAudienceKeys[0]];
    }
    // Una misma URL debe funcionar en todas las apps seleccionadas.
    // Inicio es el único destino universal y seguro cuando mezclamos públicos.
    return [{ label: "Inicio", value: "/", hint: "Inicio de cada app seleccionada" }];
  }, [selectedAudienceKeys]);
  useEffect(() => {
    if (!smartDestinations.some((item) => item.value === url)) {
      setUrl(smartDestinations[0]?.value ?? "/");
    }
  }, [smartDestinations, url]);
  async function load(){ try{setHistory(await listNotificationHistory(!isGlobal&&citySlug?citySlug:undefined));}catch(e:any){setError(e?.message||"No se pudo cargar el historial");} }
  useEffect(()=>{load();},[isGlobal,citySlug]);
  useEffect(()=>{const t=setTimeout(async()=>{if(!audience.buyer&&!audience.driver&&!audience.store){setPreview(null);return;} try{setPreview(await previewNotification(payload));}catch{setPreview(null);}},350); return()=>clearTimeout(t);},[payload]);
  async function send(){ if(!confirm(`¿Enviar esta notificación a ${preview?.targetDevices??0} dispositivo(s)?`))return; setBusy(true);setError("");setOk(""); try{const r=await sendNotification(payload);setOk(`Notificación enviada. ${r?.campaign?.targetDevices??0} dispositivo(s) objetivo.`);setTitle("");setBody("");await load();}catch(e:any){setError(e?.message||"No se pudo enviar");}finally{setBusy(false);} }
  return (
    <main className="space-y-4">
      {/* Encabezado alineado con el lenguaje visual del CTCC */}
      <section className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.22em] text-slate-400">
              Comunicación KRONIX
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Centro de Notificaciones
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Crea campañas Push para clientes, trabajadores y negocios con acceso directo a cada app.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Alcance actual
              </div>
              <div className="mt-0.5 text-sm font-black text-emerald-950">
                {isGlobal ? "Todas las ciudades" : cityLabel}
              </div>
            </div>
            <button
              onClick={load}
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              ↻ Actualizar
            </button>
          </div>
        </div>
      </section>

      {/* KPIs estilo Panel General / Órdenes */}
      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-[20px] border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dispositivos objetivo</div>
          <div className="mt-2 text-3xl font-black text-blue-700">{preview?.targetDevices ?? "—"}</div>
          <div className="mt-1 text-xs text-slate-500">Suscripciones Push activas</div>
        </div>
        <div className="rounded-[20px] border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Usuarios incluidos</div>
          <div className="mt-2 text-3xl font-black text-emerald-700">{preview?.targetUsers ?? "—"}</div>
          <div className="mt-1 text-xs text-slate-500">{isGlobal ? "Alcance global" : cityLabel}</div>
        </div>
        <div className="rounded-[20px] border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Públicos seleccionados</div>
          <div className="mt-2 text-3xl font-black text-amber-700">
            {[audience.buyer, audience.driver, audience.store].filter(Boolean).length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Clientes · Trabajadores · Negocios</div>
        </div>
        <div className="rounded-[20px] border border-violet-200 bg-gradient-to-b from-violet-50 to-white p-4 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Campañas registradas</div>
          <div className="mt-2 text-3xl font-black text-violet-700">{history.length}</div>
          <div className="mt-1 text-xs text-slate-500">En el alcance seleccionado</div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Crear notificación</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Selecciona uno o varios públicos y prepara el mensaje.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                🔊 Push + sonido cuando el dispositivo lo permita
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">
              1. Destinatarios
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {([
                ["buyer", "👤", "Clientes", "Buyer App"],
                ["driver", "🛵", "Trabajadores", "Driver App"],
                ["store", "🏪", "Negocios", "Store App"],
              ] as const).map(([k, icon, label, app]) => (
                <button
                  key={k}
                  onClick={() => setAudience((a) => ({ ...a, [k]: !a[k] }))}
                  className={`group relative overflow-hidden rounded-[18px] border p-4 text-left transition ${
                    audience[k]
                      ? "border-slate-900 bg-slate-950 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${
                      audience[k] ? "bg-white/10" : "bg-slate-100"
                    }`}>
                      {icon}
                    </div>
                    <div className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-black ${
                      audience[k]
                        ? "border-emerald-300 bg-emerald-400 text-emerald-950"
                        : "border-slate-300 text-transparent"
                    }`}>
                      ✓
                    </div>
                  </div>
                  <div className="mt-3 font-black">{label}</div>
                  <div className={`mt-0.5 text-xs ${audience[k] ? "text-slate-300" : "text-slate-500"}`}>
                    {app} · {audience[k] ? "Seleccionado" : "No seleccionado"}
                  </div>
                </button>
              ))}
            </div>

            <div className="my-5 h-px bg-slate-100" />

            <div className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">
              2. Contenido del mensaje
            </div>

            <div className="mt-3 grid gap-4">
              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Título
                <div className="relative">
                  <input
                    value={title}
                    maxLength={90}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="🍽️ Plato del día: Bandeja Paisa"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-16 font-medium outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                    {title.length}/90
                  </span>
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Mensaje
                <div className="relative">
                  <textarea
                    value={body}
                    maxLength={240}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    placeholder="Hoy en La Fortuna del Sabor. Toca aquí para ver el menú y pedir tu almuerzo."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 pb-8 font-medium outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  />
                  <span className="absolute bottom-3 right-3 text-[11px] font-bold text-slate-400">
                    {body.length}/240
                  </span>
                </div>
              </label>
            </div>

            <div className="my-5 h-px bg-slate-100" />

            <div className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">
              3. Acción al tocar
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Destino
                <select
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  {smartDestinations.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-bold text-slate-800">
                Ruta interna
                <select
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-slate-900"
                >
                  {smartDestinations.map((x) => (
                    <option key={x.value} value={x.value}>{x.value}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {selectedAudienceKeys.length === 0
                ? "Selecciona primero el público para ver los destinos disponibles."
                : selectedAudienceKeys.length > 1
                  ? "Al seleccionar varios públicos, Inicio es el destino seguro común: cada persona abrirá su propia app."
                  : smartDestinations.find((item) => item.value === url)?.hint}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}
            {ok && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                {ok}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Envío estimado
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950">
                    {preview?.targetDevices ?? "—"}
                  </span>
                  <span className="font-bold text-slate-600">dispositivos</span>
                </div>
                <div className="text-xs text-slate-500">
                  {preview?.targetUsers ?? "—"} usuarios registrados · {isGlobal ? "Global" : cityLabel}
                </div>
              </div>

              <button
                disabled={busy || !title.trim() || !body.trim() || (!audience.buyer && !audience.driver && !audience.store)}
                onClick={send}
                className="min-w-[170px] rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {busy ? "Enviando…" : "Enviar ahora"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">
              Vista previa
            </div>
            <h3 className="mt-1 font-black text-slate-950">Así lo verá el usuario</h3>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-100 p-4">
              <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-lg">
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">
                    KX
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">KRONIX</div>
                    <div className="mt-0.5 break-words font-black text-slate-950">
                      {title || "Título de la notificación"}
                    </div>
                    <div className="mt-1 break-words text-sm leading-5 text-slate-600">
                      {body || "Aquí aparecerá el mensaje que recibirán tus usuarios."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                <div className="font-black text-slate-900">🔊 Sonido</div>
                Solicitado
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                <div className="font-black text-slate-900">🔗 Destino</div>
                <span className="break-all">{url}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">i</div>
              <div>
                <h3 className="font-black text-blue-950">¿Qué significa “dispositivos”?</h3>
                <p className="mt-1 text-sm leading-5 text-blue-900/75">
                  Un usuario puede tener más de una suscripción Push activa: por ejemplo celular + computador,
                  o dos navegadores. Por eso dispositivos y usuarios no necesariamente coinciden.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Historial de notificaciones</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Últimos 100 envíos del alcance seleccionado.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            ↻ Actualizar historial
          </button>
        </div>

        <div className="overflow-x-auto px-5 pb-3">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="py-3">Fecha</th>
                <th>Mensaje</th>
                <th>Público</th>
                <th>Ciudad</th>
                <th>Dispositivos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap py-4 text-slate-600">
                    {new Date(r.createdAt).toLocaleString("es-CO")}
                  </td>
                  <td className="py-4">
                    <div className="font-black text-slate-900">{r.title}</div>
                    <div className="max-w-[390px] truncate text-xs text-slate-500">{r.body}</div>
                  </td>
                  <td className="font-bold text-slate-700">{audienceLabel(r)}</td>
                  <td className="text-slate-600">{r.cityLabel || "Global"}</td>
                  <td>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-black text-blue-700">
                      {r.targetDevices}
                    </span>
                  </td>
                  <td>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Todavía no hay notificaciones enviadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
