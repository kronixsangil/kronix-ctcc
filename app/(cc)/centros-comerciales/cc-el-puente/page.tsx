"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./plaza-panel.module.css";

const url = "/api/ctcc/cc-el-puente/admin/content";
const kinds = {
  PUBLICACION: "Publicación", COMERCIO: "Establecimiento", EVENTO: "Evento",
  PROMOCION: "Promoción", CUPON: "Cupón", WEB: "Web oficial", SERVICIO: "Servicio", ENCABEZADO: "Carrusel del encabezado",
};
const carouselDefaults = { theme: "promenade" as "classic" | "promenade", slides: [] as string[], intervalMs: 10000, durationMs: 450,
  transition: "fade", autoplay: true, indicators: true };
type Draft = {
  header?: typeof carouselDefaults;
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
  category?: string;
  eventDate?: string;
  eventWeekday?: number;
};
type Row = { id: string; revision: number; draft: Draft; publishAt?: string; scheduledAt?: string; planKey?: string; expiresAt?: string };
type Plan = { key: string; title: string; price: number; format: 1 | 2; catalog: boolean; kronix: boolean; notifications: "NONE" | "MONTHLY" | "WEEKLY"; coupon: boolean };
const plansUrl = "/api/ctcc/cc-el-puente/admin/plans";
const initial: Draft = { kind: "PUBLICACION", title: "", description: "" };
type FieldName = "bannerImageUrl" | "cardImageUrl" | "imageUrl" | "linkUrl" | "catalogUrl" | "floor" | "schedule";

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

function PanelIcon({ name }: { name: "plus" | "store" | "calendar" | "tag" | "grid" | "search" | "edit" | "image" | "link" }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    store: "M3 10l2-6h14l2 6M4 10v10h16V10M3 10c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0M9 20v-6h6v6",
    calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2",
    tag: "M3 3h8l10 10-8 8L3 11V3zm4 4h.01",
    grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    edit: "M14 5l5 5M4 15L16 3l5 5L9 20l-6 1z",
    image: "M3 3h18v18H3zM3 17l5-5 4 4 4-6 5 7M8 7h.01",
    link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function CcElPuentePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [selected, setSelected] = useState<Row>();
  const [draft, setDraft] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [slideText, setSlideText] = useState("");
  const [preview, setPreview] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [expiry, setExpiry] = useState("");
  const [assignmentPlanKey, setAssignmentPlanKey] = useState("");
  const [view, setView] = useState<"content" | "plans">("content");
  const [kindFilter, setKindFilter] = useState<"ALL" | Draft["kind"]>("COMERCIO");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planDirty, setPlanDirty] = useState(false);
  const [editorTab, setEditorTab] = useState<"info" | "images" | "publish" | "assignment">("info");
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty || planDirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, planDirty]);

  const refresh = useCallback(async () => {
    const all = await request<Row[]>(url);
    setRows(all);
    setLoadedAt(Date.now());
    return all;
  }, []);
  useEffect(() => {
    Promise.all([Promise.resolve().then(refresh), request<Plan[]>(plansUrl).then(setPlans)]).catch((error: Error) => setMessage(error.message)).finally(() => setLoading(false));
  }, [refresh]);

  function select(row?: Row, force = false) {
    if (!force && dirty && !window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos y cambiar de contenido?")) return false;
    setCreating(false);
    setEditorTab("info");
    setAssignmentPlanKey(row?.planKey ?? "");
    setMessage("");
    setSelected(row);
    setDraft(row?.draft ?? initial);
    setSlideText(row?.draft.header?.slides.join("\n") ?? "");
    setDirty(false);
    setDate("");
    setPreview(false);
    setExpiry("");
    return true;
  }

  function change(fields: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...fields }));
    setDirty(true);
  }

  async function mutate(action: "save" | "publish" | "withdraw") {
    setBusy(true);
    setMessage("");
    try {
      const payload = draft.kind === "ENCABEZADO"
        ? { ...draft, header: { ...carousel, slides: slideText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } }
        : draft;
      const result = selected
        ? await request<{ id: string }>(url + "/" + selected.id, {
            action, revision: selected.revision, draft: payload,
            publishAt: action === "publish" && date ? date + ":00-05:00" : undefined,
          })
        : await request<{ id: string }>(url, payload);
      const updated = (await refresh()).find((row) => row.id === result.id);
      select(updated, true);
      setEditorTab(editorTab);
      if (updated) { setKindFilter(updated.draft.kind); setListPage(0); }
      setMessage(action === "save" ? "Borrador guardado." : action === "withdraw" ? "Contenido retirado." : "Publicación guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación falló.");
    } finally {
      setBusy(false);
    }
  }

  const input = styles.input;
  const carousel = { ...carouselDefaults, ...draft.header };
  const setCarousel = (fields: Partial<typeof carouselDefaults>) => change({ header: { ...carousel, ...fields } });

  async function savePlan(assign: boolean) {
    const target = assign ? plans.find((item) => item.key === assignmentPlanKey) : plan;
    if (!target) return;
    setBusy(true);
    setMessage("");
    try {
      if (assign && selected) {
        await request(plansUrl + "/assign", { id: selected.id, planKey: target.key, expiresAt: expiry + ":00-05:00" });
        setSelected((await refresh()).find((row) => row.id === selected.id));
      } else if (!assign) {
        await request(plansUrl, target);
        setPlans(await request<Plan[]>(plansUrl));
        setPlanDirty(false);
      }
      setMessage(assign ? "Plan asignado al establecimiento." : "Configuración del plan guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación falló.");
    } finally {
      setBusy(false);
    }
  }

  const statusOf = (row: Row) => row.scheduledAt && new Date(row.scheduledAt).getTime() > loadedAt ? "Programado" : row.publishAt || row.scheduledAt ? "Publicado" : "Borrador";
  const normalizedQuery = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = rows.filter((row) => (kindFilter === "ALL" || row.draft.kind === kindFilter) &&
    (statusFilter === "ALL" || statusOf(row) === statusFilter) &&
    [row.draft.title, row.draft.floor, kinds[row.draft.kind]].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.draft.title.localeCompare(b.draft.title, "es"));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 7));
  const currentPage = Math.min(listPage, pageCount - 1);
  const pageRows = filtered.slice(currentPage * 7, currentPage * 7 + 7);
  const publishedCount = rows.filter((row) => statusOf(row) === "Publicado").length;
  const editorVisible = creating || !!selected;
  const imageFallback = draft.imageUrl;
  const pluralKinds = { COMERCIO: "Establecimientos", EVENTO: "Eventos", PROMOCION: "Promociones", CUPON: "Cupones", PUBLICACION: "Publicaciones", WEB: "Web oficial", SERVICIO: "Servicios", ENCABEZADO: "Encabezado" };
  const iconByKind = { COMERCIO: "store", EVENTO: "calendar", PROMOCION: "tag", CUPON: "tag", PUBLICACION: "grid", WEB: "link", SERVICIO: "grid", ENCABEZADO: "image" } as const;
  const tabLabels = { info: "Información", images: "Imágenes", publish: "Publicación", assignment: "Plan comercial" };

  function newContent() {
    if (!select()) return;
    setCreating(true);
    setSlideText("");
    setDraft({ ...initial, kind: kindFilter === "ALL" ? "COMERCIO" : kindFilter });
    setView("content");
  }
  function field(name: FieldName | "category", label: string, placeholder?: string, full = false) {
    return <label className={styles.field + (full ? " " + styles.full : "")} key={name}>{label}
      <input className={input} type={name.endsWith("Url") ? "url" : "text"} value={draft[name] ?? ""} placeholder={placeholder}
        maxLength={name.endsWith("Url") ? 2000 : name === "schedule" ? 160 : 80} onChange={(event) => change({ [name]: event.target.value })} />
    </label>;
  }
  const assignment = <div className={styles.assignment}>
    <h3>Plan del establecimiento</h3>
    {selected?.draft.kind === "COMERCIO" ? <>
      <p className={styles.hint}>{selected.planKey ? "Actual: " + (plans.find((item) => item.key === selected.planKey)?.title ?? selected.planKey) + (selected.expiresAt ? " · Vence " + new Date(selected.expiresAt).toLocaleDateString("es-CO", { timeZone: "America/Bogota" }) : "") : "Este establecimiento todavía no tiene un plan asignado."}</p>
      <label className={styles.field}>Seleccionar plan<select className={input} value={assignmentPlanKey} onChange={(event) => setAssignmentPlanKey(event.target.value)}>
        <option value="">Selecciona un plan</option>
        {plans.map((item) => <option key={item.key} value={item.key}>{item.title} · ${item.price.toLocaleString("es-CO")}</option>)}
      </select></label>
      <label className={styles.field}>Vencimiento · hora de Colombia<input className={input} type="datetime-local" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
      <button type="button" className={styles.primary} disabled={busy || !expiry || !assignmentPlanKey} onClick={() => void savePlan(true)}>Asignar plan a {selected.draft.title}</button>
    </> : <p className={styles.hint}>Guarda primero el establecimiento para asignarle un plan.</p>}
  </div>;

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div><div className={styles.eyebrow}>KroniX · Administración comercial</div><h1>CC El Puente</h1><p>Tu contenido, organizado y listo para destacar en la app.</p></div>
      <div className={styles.heroActions}><span className={styles.live}>● Centro de contenido</span><button type="button" className={styles.primary} disabled={busy} onClick={newContent}><PanelIcon name="plus" />Nuevo contenido</button></div>
    </header>
    <div className={styles.toolbar}>
      <div className={styles.switcher} aria-label="Área de trabajo">
        <button className={view === "content" ? styles.current : ""} aria-pressed={view === "content"} onClick={() => setView("content")}>Contenido de la app</button>
        <button className={view === "plans" ? styles.current : ""} aria-pressed={view === "plans"} onClick={() => setView("plans")}>Planes comerciales</button>
      </div>
      <div className={styles.summary}><span><strong>{rows.length}</strong> contenidos</span><span><strong>{publishedCount}</strong> publicados</span><span><strong>{rows.length - publishedCount}</strong> borradores / programados</span></div>
    </div>
    {message && <div className={styles.message} role="status"><span>{message}</span><button aria-label="Cerrar mensaje" onClick={() => setMessage("")}>×</button></div>}
    {view === "content" ? <>
      <nav className={styles.categories} aria-label="Filtrar contenido por tipo">
        {(["ALL", "COMERCIO", "EVENTO", "PROMOCION", "CUPON", "PUBLICACION", "WEB", "SERVICIO", "ENCABEZADO"] as const).map((kind) => <button key={kind} aria-pressed={kindFilter === kind}
          className={styles.category + (kindFilter === kind ? " " + styles.selectedCategory : "")} onClick={() => { setKindFilter(kind); setListPage(0); }}>
          <PanelIcon name={kind === "ALL" ? "grid" : iconByKind[kind]} />{kind === "ALL" ? "Todos" : pluralKinds[kind]}<span>{kind === "ALL" ? rows.length : rows.filter((row) => row.draft.kind === kind).length}</span>
        </button>)}
      </nav>
      <div className={styles.workspace}>
        <section className={styles.panel} aria-label="Biblioteca de contenido">
          <div className={styles.panelHead}><div><h2>{kindFilter === "ALL" ? "Biblioteca" : pluralKinds[kindFilter]}</h2><p>{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} · orden alfabético</p></div><PanelIcon name="grid" /></div>
          <div className={styles.searchTools}>
            <label className={styles.search}><span className="sr-only">Buscar contenido</span><PanelIcon name="search" /><input className={input} type="search" placeholder="Buscar nombre o local…" value={search} onChange={(event) => { setSearch(event.target.value); setListPage(0); }} /></label>
            <select className={input} aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setListPage(0); }}><option value="ALL">Todo estado</option><option>Publicado</option><option>Borrador</option><option>Programado</option></select>
          </div>
          <div className={styles.list}>
            {loading ? <p className={styles.loading}>Cargando contenido…</p> : pageRows.length ? pageRows.map((row) => <button key={row.id} disabled={busy} aria-pressed={selected?.id === row.id} className={styles.row + (selected?.id === row.id ? " " + styles.activeRow : "")} onClick={() => select(row)}>
              <span className={styles.thumb}><PanelIcon name={iconByKind[row.draft.kind]} /></span>
              <span className={styles.rowText}><strong title={row.draft.title}>{row.draft.title}</strong><small>{kinds[row.draft.kind]}{row.draft.floor ? " · " + row.draft.floor : ""}</small></span>
              <span className={styles.status} data-state={statusOf(row)}><i className={styles.dot} />{statusOf(row)}</span>
            </button>) : <div className={styles.noResults}><h3>No hay resultados</h3><p>Prueba otro nombre, tipo o estado.</p></div>}
          </div>
          <footer className={styles.pager}><span>{filtered.length ? currentPage * 7 + 1 : 0}–{Math.min((currentPage + 1) * 7, filtered.length)} de {filtered.length}</span><div className={styles.pagerControls}>
            <button aria-label="Página anterior" disabled={currentPage === 0} onClick={() => setListPage(currentPage - 1)}>‹</button><span>{currentPage + 1} / {pageCount}</span><button aria-label="Página siguiente" disabled={currentPage + 1 >= pageCount} onClick={() => setListPage(currentPage + 1)}>›</button>
          </div></footer>
        </section>
        <section className={styles.panel} aria-label="Editor de contenido">
          {!editorVisible ? <div className={styles.empty}><span><PanelIcon name="edit" /></span><h2>Cada publicación, en su lugar</h2><p>Selecciona un contenido de la biblioteca para editarlo o crea uno nuevo. Las imágenes, la publicación y el plan están organizados por secciones.</p><button className={styles.primary} disabled={busy || loading} onClick={newContent}><PanelIcon name="plus" />Crear contenido</button></div> : <form onSubmit={(event: FormEvent) => { event.preventDefault(); void mutate("save"); }}>
            <div className={styles.panelHead}><div className={styles.editorTitle}><h2>{draft.title || "Nuevo contenido"}</h2><p>{kinds[draft.kind]} · {selected ? "Editar publicación" : "Crear publicación"}</p></div><span className={styles.status} data-state={selected ? statusOf(selected) : "Borrador"}>{selected ? statusOf(selected) : "Nuevo"}</span></div>
            <nav className={styles.editorTabs} aria-label="Secciones del editor">
              {(["info", "images", "publish", ...(draft.kind === "COMERCIO" ? ["assignment" as const] : [])] as const).map((tab) => <button key={tab} type="button" className={editorTab === tab ? styles.activeTab : ""} aria-pressed={editorTab === tab} onClick={() => setEditorTab(tab)}>{tabLabels[tab]}</button>)}
            </nav>
            <div className={styles.editorBody}>
              {editorTab === "info" && <>
                <div className={styles.sectionIntro}><span><PanelIcon name="edit" /></span><div><h3>Información del contenido</h3><p>Lo que tus visitantes necesitan conocer.</p></div></div>
                <div className={styles.formGrid}>
                  <label className={styles.field}>Tipo de contenido<select className={input} value={draft.kind} disabled={busy} onChange={(event) => change({ kind: event.target.value as Draft["kind"] })}>{Object.entries(kinds).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
                  {field("category", "Categoría", "Ej. Moda, gastronomía, bienestar")}
                  <label className={styles.field + " " + styles.full}>Nombre o título<input className={input} required maxLength={120} placeholder="Nombre visible en la app" value={draft.title} onChange={(event) => change({ title: event.target.value })} /></label>
                  <label className={styles.field + " " + styles.full}>Descripción<textarea className={input} rows={3} maxLength={4000} placeholder="Describe el establecimiento, evento o promoción…" value={draft.description} onChange={(event) => change({ description: event.target.value })} /></label>
                {draft.kind === "ENCABEZADO" && <fieldset className="grid gap-3 rounded-xl border border-slate-200 p-4">
                  <legend className="px-2 font-semibold">Tema y rotación de fotos</legend>
                  <label>Tema de la app
                    <select className={input} value={carousel.theme} onChange={(event) => setCarousel({ theme: event.target.value as typeof carousel.theme })}>
                      <option value="promenade">Paseo</option><option value="classic">Clásico</option>
                    </select>
                  </label>
                  <label>URLs HTTPS en orden, una por línea (máximo 12)
                    <textarea className={input} rows={5} value={slideText} onChange={(event) => { setSlideText(event.target.value); setDirty(true); }} />
                  </label>
                  <label>Transición
                    <select className={input} value={carousel.transition} onChange={(event) => setCarousel({ transition: event.target.value })}>
                      <option value="fade">Fundido</option><option value="slide">Deslizar</option><option value="none">Cambio directo</option>
                    </select>
                  </label>
                  <label>Tiempo entre fotos (milisegundos)
                    <input className={input} type="number" min={2000} max={120000} value={carousel.intervalMs} onChange={(event) => setCarousel({ intervalMs: event.target.valueAsNumber })} />
                  </label>
                  <label>Duración de la transición (milisegundos)
                    <input className={input} type="number" min={0} max={2000} value={carousel.durationMs} onChange={(event) => setCarousel({ durationMs: event.target.valueAsNumber })} />
                  </label>
                  <label><input type="checkbox" checked={carousel.autoplay} onChange={(event) => setCarousel({ autoplay: event.target.checked })} /> Rotar automáticamente</label>
                  <label><input type="checkbox" checked={carousel.indicators} onChange={(event) => setCarousel({ indicators: event.target.checked })} /> Mostrar indicadores</label>
                </fieldset>}

                  {field("floor", "Piso o local", "Ej. Piso 2 · Local 218")}{field("schedule", "Horario", "Ej. Lunes a sábado · 9:00–18:00")}
                  {draft.kind === "EVENTO" && <><label className={styles.field}>Fecha del evento<input className={input} type="date" value={draft.eventDate ?? ""} onChange={(event) => change({ eventDate: event.target.value })} /></label><label className={styles.field}>Repetición semanal<select className={input} value={draft.eventWeekday ?? ""} onChange={(event) => change({ eventWeekday: event.target.value === "" ? undefined : Number(event.target.value) })}><option value="">Sin repetición</option>{["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label></>}
                  {field("linkUrl", "Enlace de destino", "https://…", true)}
                  {draft.kind === "COMERCIO" && field("catalogUrl", "Public_link o Dine_in · opcional", "https://…", true)}
                </div>
              </>}
              {editorTab === "images" && <>
                <div className={styles.sectionIntro}><span><PanelIcon name="image" /></span><div><h3>Una imagen para cada espacio</h3><p>Pega el vínculo público del archivo de Drive y revisa el resultado.</p></div></div>
                <div className={styles.imageColumns}>
                  <div className={styles.imageField}><h3>Imagen Banner<span>Panorámica · 3:1</span></h3><ImagePreview src={draft.bannerImageUrl || imageFallback || draft.cardImageUrl} title="Vista previa Banner" ratio="3 / 1" />{field("bannerImageUrl", "Vínculo del Banner", "https://drive.google.com/file/d/…")}<p className={styles.hint}>Para destacados y carruseles.</p></div>
                  <div className={styles.imageField}><h3>Imagen Tarjeta<span>{draft.kind === "COMERCIO" ? "Horizontal · 2:1" : "Vertical · 4:5"}</span></h3><ImagePreview src={draft.cardImageUrl || imageFallback || draft.bannerImageUrl} title="Vista previa Tarjeta" ratio={draft.kind === "COMERCIO" ? "2 / 1" : "4 / 5"} />{field("cardImageUrl", "Vínculo de la Tarjeta", "https://drive.google.com/file/d/…")}<p className={styles.hint}>Para la cuadrícula y el detalle.</p></div>
                </div>
                <details className={styles.legacy}><summary>Imagen anterior · respaldo opcional</summary>{field("imageUrl", "Vínculo de respaldo", "https://…")}<p className={styles.hint}>Se usa cuando falta una imagen del formato correspondiente.</p></details>
                <p className={styles.note}>En Drive, el archivo debe permitir acceso a cualquier persona con el enlace. Guarda el borrador y publica para actualizar la app.</p>
              </>}
              {editorTab === "publish" && <>
                <div className={styles.sectionIntro}><span><PanelIcon name="calendar" /></span><div><h3>Publicación y visibilidad</h3><p>Decide cuándo se muestra este contenido en la app.</p></div></div>
                <div className={styles.note}>{dirty ? "Tienes cambios sin guardar. Guarda el borrador antes de publicar." : selected ? "El borrador está guardado. Puedes publicarlo ahora o programar su salida." : "Guarda este contenido para habilitar la publicación."}</div>
                <label className={styles.field}>Programar publicación · hora de Colombia<input className={input} type="datetime-local" disabled={!selected} value={date} onChange={(event) => setDate(event.target.value)} /><span className={styles.hint}>Déjalo vacío para publicar ahora.</span></label>
                {selected && <div className={styles.assignment}><h3>Retirar de la app</h3><p className={styles.hint}>Oculta la publicación y cancela su programación. El borrador se conserva para editarlo después.</p><button className={styles.danger} type="button" disabled={busy} onClick={() => void mutate("withdraw")}>Retirar publicación</button></div>}
              </>}
              {editorTab === "assignment" && assignment}
              {preview && <div className={styles.preview}><ImagePreview src={draft.bannerImageUrl || imageFallback || draft.cardImageUrl} title="Banner · 3:1" ratio="3 / 1" /><ImagePreview src={draft.cardImageUrl || imageFallback || draft.bannerImageUrl} title="Tarjeta" ratio={draft.kind === "COMERCIO" ? "2 / 1" : "4 / 5"} /></div>}
            </div>
            <footer className={styles.actions}><span className={styles.saveState + (dirty ? " " + styles.dirty : "")}>{busy ? "Procesando…" : dirty ? "● Cambios sin guardar" : selected ? "✓ Borrador guardado" : "Nuevo borrador"}</span><div>
              <button className={styles.ghost} type="button" onClick={() => setPreview(!preview)}>{preview ? "Cerrar vista previa" : "Vista previa"}</button>
              <button className={styles.button} type="submit" disabled={busy || !draft.title.trim()}>Guardar borrador</button>
              <button className={styles.primary} type="button" disabled={busy || dirty || !selected} title={dirty ? "Guarda el borrador antes de publicar" : undefined} onClick={() => void mutate("publish")}>{date ? "Programar" : "Publicar ahora"}</button>
            </div></footer>
          </form>}
        </section>
      </div>
    </> : <div className={styles.planLayout}>
      <section className={styles.panel} aria-label="Catálogo de planes"><div className={styles.panelHead}><div><h2>Planes comerciales</h2><p>Selecciona un plan para configurar sus beneficios.</p></div></div><div className={styles.planList}>
        {plans.map((item) => <button key={item.key} disabled={busy} aria-pressed={plan?.key === item.key} className={styles.planCard + (plan?.key === item.key ? " " + styles.activePlan : "")} onClick={() => { if (planDirty && !window.confirm("Hay cambios sin guardar en este plan. ¿Descartarlos?")) return; setPlan(item); setPlanDirty(false); }}><small>CATÁLOGO {item.key.split("-")[0]} · {item.format === 1 ? "Banner" : "Tarjeta"}</small><strong>{item.title}</strong><b>${item.price.toLocaleString("es-CO")} <small>/ mes</small></b></button>)}
      </div></section>
      <section className={styles.panel} aria-label="Configuración del plan">{!plan ? <div className={styles.empty}><span><PanelIcon name="tag" /></span><h2>Configura tus planes</h2><p>Precios, formatos y beneficios en un solo lugar. La asignación se realiza dentro de cada establecimiento.</p></div> : <>
        <div className={styles.panelHead}><div><h2>{plan.title}</h2><p>Configuración del plan · no modifica la publicación</p></div><span className={styles.status}>${plan.price.toLocaleString("es-CO")} / mes</span></div>
        <div className={styles.editorBody}><div className={styles.formGrid}>
          <label className={styles.field + " " + styles.full}>Nombre del plan<input className={input} value={plan.title} maxLength={160} onChange={(event) => { setPlan({ ...plan, title: event.target.value }); setPlanDirty(true); }} /></label>
          <label className={styles.field}>Precio mensual · COP<input className={input} type="number" min={50000} max={150000} value={plan.price} onChange={(event) => { setPlan({ ...plan, price: Number(event.target.value) }); setPlanDirty(true); }} /></label>
          <label className={styles.field}>Formato<select className={input} value={plan.format} onChange={(event) => { setPlan({ ...plan, format: event.target.value === "1" ? 1 : 2 }); setPlanDirty(true); }}><option value={1}>Banner</option><option value={2}>Tarjeta</option></select></label>
          <label className={styles.field + " " + styles.full}>Frecuencia de notificaciones<select className={input} value={plan.notifications} onChange={(event) => { setPlan({ ...plan, notifications: event.target.value as Plan["notifications"] }); setPlanDirty(true); }}><option value="NONE">Sin campañas</option><option value="MONTHLY">Mensual</option><option value="WEEKLY">Semanal</option></select></label>
        </div><h3>Beneficios incluidos</h3><div className={styles.checks}>{([{ key: "catalog", label: "Public_link + Dine_in" }, { key: "kronix", label: "Presencia en KroniX" }, { key: "coupon", label: "Cupón" }] as const).map(({ key, label }) => <label key={key} className={styles.check}><input type="checkbox" checked={plan[key]} onChange={(event) => { setPlan({ ...plan, [key]: event.target.checked }); setPlanDirty(true); }} />{label}</label>)}</div></div>
        <footer className={styles.actions}><span className={styles.saveState}>{planDirty ? "● Cambios sin guardar" : "Configuración guardada"}</span><button className={styles.primary} disabled={busy || !plan.title.trim() || !planDirty} onClick={() => void savePlan(false)}>Guardar configuración del plan</button></footer>
      </>}</section>
    </div>}
  </main>;
}
