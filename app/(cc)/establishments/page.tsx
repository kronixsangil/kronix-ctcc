"use client";
import { useEffect, useState } from "react";
import "./establishments.css";
import EstablishmentSettings from "./components/EstablishmentSettings";
import EstablishmentPresentation from "./components/EstablishmentPresentation";
import EstablishmentOperations from "./components/EstablishmentOperations";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../components/CtccCityContext";
const empty = {
  phone: "",
  createStoreAccess: true,
  name: "",
  category: "Restaurante",
  address: "",
  description: "",
  image: "",
  publicSlug: "",
  cityId: "",
  lat: "",
  lng: "",
  openTime: "07:00",
  closeTime: "22:00",
  isActive: true,
  isPaused: false,
  isPublicVisible: true,
  publicLinkEnabled: true,
  dineInEnabled: true,
  locations: "",
  style: "KRONIX",
  theme: "VIBRANT",
  template: "VISUAL_CATALOG",
  menuMode: "EVERYDAY",
  paymentMode: "DIRECT",
  primaryColor: "#6415C5",
  secondaryColor: "#350071",
  backgroundColor: "#F8EBFF",
  textColor: "#11142D",
  accentColor: "#FDE047",
  delivery: true,
  pickup: true,
};
const blankProduct = {
  name: "",
  category: "General",
  description: "",
  image: "",
  priceCOP: "",
  isActive: true,
};
export default function EstablishmentsPage() {
  const { cities, citySlug, selectedCity, isGlobal } = useCtccCity();
  const [rows, setRows] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [draft, setDraft] = useState<any>(null),
    [product, setProduct] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("catalog"),
    [section, setSection] = useState("identity"),
    [search, setSearch] = useState(""),
    [businessSearch, setBusinessSearch] = useState(""),
    [menuFilter, setMenuFilter] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    try {
      const data = await apiFetch<any[]>(
        `/admin/establishments${!isGlobal && citySlug ? `?citySlug=${encodeURIComponent(citySlug)}` : ""}`,
      );
      setRows(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }
  useEffect(() => {
    load();
    setSelected(null);
  }, [citySlug, isGlobal]);
  function edit(r: any) {
    const p = r.appPresentation ?? {};
    setDraft({
      ...empty,
      ...r.store,
      ...r,
      id: r.id,
      isActive:r.isActive && r.store.isActive,
      cityId: r.store.cityId,
      phone: r.store.cel1 ?? "",
      createStoreAccess: false,
      locations: (r.locations ?? []).map((x: any) => x.label).join("\n"),
      style: p.style ?? "LEGACY",
      theme: p.theme ?? "CUSTOM",
      template: p.template ?? "VISUAL_CATALOG",
      menuMode: p.menuMode ?? "DAILY",
      paymentMode: p.paymentMode ?? "TRANSFER",
      primaryColor: p.primaryColor ?? "#008c99",
      secondaryColor: p.secondaryColor ?? "#0A3566",
      backgroundColor: p.backgroundColor ?? "#F8FAFC",
      textColor: p.textColor ?? "#0F172A",
      accentColor: p.accentColor ?? "#FFFFFF",
      delivery: (p.fulfillments ?? ["DELIVERY", "PICKUP"]).includes("DELIVERY"),
      pickup: (p.fulfillments ?? ["DELIVERY", "PICKUP"]).includes("PICKUP"),
    });
    setSection("identity");
    setError("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const b = {
        ...draft,
        lat: Number(draft.lat),
        lng: Number(draft.lng),
        locations: draft.locations
          .split("\n")
          .map((x: string) => x.trim())
          .filter(Boolean),
        appPresentation: {
          ...rows.find((r: any) => r.id === draft.id)?.appPresentation,
          style: draft.style,
          theme: draft.theme,
          secondaryColor: draft.secondaryColor,
          backgroundColor: draft.backgroundColor,
          textColor: draft.textColor,
          accentColor: draft.accentColor,
          template: draft.template,
          menuMode: draft.menuMode,
          paymentMode: draft.paymentMode,
          primaryColor: draft.primaryColor,
          fulfillments: [
            ...(draft.delivery ? ["DELIVERY"] : []),
            ...(draft.pickup ? ["PICKUP"] : []),
          ],
        },
      };
      if (!String(draft.lat).trim() || !String(draft.lng).trim())
        throw new Error("Indica la ubicación del negocio.");
      const r = await apiFetch<any>(
        `/admin/establishments${draft.id ? `/${draft.id}` : ""}`,
        { method: draft.id ? "PATCH" : "POST", body: JSON.stringify(b) },
      );
      await load();
      setSelected(r);
      setDraft(null);
      setNotice(r.storeAccess ? `Establecimiento guardado. Usuario Store App: ${r.storeAccess.username}. ${r.storeAccess.created ? "Contraseña inicial: el mismo teléfono. Debe cambiarla al ingresar." : "La cuenta ya existía; conserva su contraseña."}` : "Establecimiento guardado.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveProduct() {
    setBusy(true);
    setError("");
    try {
      if (!String(product.priceCOP).trim())
        throw new Error("Indica el precio.");
      await apiFetch(
        `/admin/establishments/${selected.id}/products${product.id ? `/${product.id}` : ""}`,
        {
          method: product.id ? "PATCH" : "POST",
          body: JSON.stringify({
            ...product,
            priceCOP: Number(product.priceCOP),
          }),
        },
      );
      const data = await load();
      setSelected(data.find((x: any) => x.id === selected.id));
      setProduct(null);
      setNotice("Producto guardado.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const input = (key: string, label: string, hint?: string, type = "text") => (
    <label className="est-field">
      {label}
      <input
        type={type}
        value={draft[key] ?? ""}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
  const toggle = (key: string, label: string, hint: string) => (
    <label className="est-toggle">
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <input
        type="checkbox"
        checked={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
      />
    </label>
  );
  const base = (
    process.env.NEXT_PUBLIC_BUYER_URL || (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:3003" : "https://buyer.kronix.co")
  ).replace(/\/$/, "");
  const url = selected ? `${base}/r/${selected.publicSlug}` : "";
  const templates: any = {
    VISUAL_CATALOG: "Catálogo con fotos",
    COMPACT_MENU: "Lista compacta",
    DAILY_MENU: "Menú del día",
    FEATURED_CATEGORIES: "Categorías destacadas",
  };
  const products =
    selected?.menus?.flatMap((m: any) =>
      m.items.map((x: any) => ({ ...x, menuLabel: m.title })),
    ) ?? [];
  const filtered = products.filter(
    (x: any) =>
      (!menuFilter || x.menuId === menuFilter) &&
      `${x.name} ${x.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const shown = rows.filter((r) =>
    `${r.store.name} ${r.store.category} ${r.store.city?.name ?? ""}`
      .toLowerCase()
      .includes(businessSearch.trim().toLowerCase()),
  );
  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Enlace copiado.");
    } catch {
      setError("No pudimos copiarlo. Selecciona y copia el enlace.");
    }
  }
  return (
    <main className="est-workspace">
      <header className="est-toolbar">
        <div className="est-directory-label"><b>Selecciona un establecimiento</b><span className="est-count">{rows.length}</span></div>
        {!draft && <input aria-label="Buscar establecimiento" className="est-search est-business-search" placeholder="Buscar negocio o ciudad…" value={businessSearch} onChange={e=>setBusinessSearch(e.target.value)}/>}
        <button
          className="est-primary"
          disabled={busy}
          onClick={() => {
            setDraft({ ...empty, cityId: selectedCity?.id ?? "" });
            setSection("identity");
            setError("");
            setNotice("");
          }}
        >
          + Nuevo establecimiento
        </button>
      </header>
      {error && (
        <div role="alert" className="est-alert">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="est-notice">
          {notice}
          <button onClick={() => setNotice("")}>Cerrar</button>
        </div>
      )}
      {draft ? (
        <section className="est-panel">
          <div className="est-panel-heading">
            <div>
              <p className="est-eyebrow">
                {draft.id ? "EDITAR ESTABLECIMIENTO" : "NUEVO ESTABLECIMIENTO"}
              </p>
              <h3>{draft.name || "Datos del negocio"}</h3>
            </div>
            <button
              disabled={busy}
              className="est-secondary"
              onClick={() => setDraft(null)}
            >
              Cancelar
            </button>
          </div>
          <nav className="est-tabs" aria-label="Configuración">
            {[
              ["identity", "1. Información"],
              ["operation", "2. Atención"],
              ["channels", "3. Canales y mesas"],
              ["appearance", "4. Apariencia"],
            ].map(([k, l]) => (
              <button
                key={k}
                className={section === k ? "is-active" : ""}
                onClick={() => setSection(k)}
              >
                {l}
              </button>
            ))}
          </nav>
          <div className="est-form-body">
            {section === "identity" && (
              <>
                <h4>Identidad y ubicación</h4>
                <p className="est-help">
                  Estos datos permiten reconocer el negocio y recoger los
                  pedidos.
                </p>
                <div className="est-form-grid">
                  {input("name", "Nombre del establecimiento")}
                  {input(
                    "category",
                    "Tipo de negocio",
                    "Por ejemplo: Restaurante, Café o Panadería.",
                  )}
                  <label className="est-field">
                    Ciudad
                    <select
                      value={draft.cityId}
                      onChange={(e) =>
                        setDraft({ ...draft, cityId: e.target.value })
                      }
                    >
                      <option value="">Seleccionar ciudad</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {input("address", "Dirección")}
                  {input("phone", "Teléfono del negocio", "Celular colombiano de 10 dígitos.")}
                  <label className="est-field">Pago en Customer y enlace público<select value={draft.paymentMode} onChange={e=>setDraft({...draft,paymentMode:e.target.value})}><option value="DIRECT">Pago directo al negocio</option><option value="TRANSFER">Transferencia con revisión (configurar datos de pago del establecimiento)</option></select></label>
                  <label className="est-field"><span><input type="checkbox" checked={!!draft.createStoreAccess} onChange={e=>setDraft({...draft, createStoreAccess:e.target.checked})}/> Crear acceso a Store App</span><small>Usuario y contraseña inicial: teléfono. Se exige cambiarla al ingresar. Si ya tiene cuenta, se conserva.</small></label>
                </div>
                <label className="est-field">
                  Descripción
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    placeholder="Cuenta brevemente qué ofrece el negocio."
                  />
                </label>
                <details className="est-details" open={!draft.id}>
                  <summary>Ubicación para el domiciliario</summary>
                  <p className="est-help">
                    Copia las coordenadas del negocio desde Google Maps. Usa
                    punto decimal.
                  </p>
                  <div className="est-form-grid">
                    {input("lat", "Latitud", "Ejemplo: 6.553649")}
                    {input("lng", "Longitud", "Ejemplo: -73.153297")}
                  </div>
                </details>
              </>
            )}
            {section === "operation" && (
              <>
                <h4>Horario y formas de entrega</h4>
                <p className="est-help">
                  El horario controla cuándo se pueden enviar pedidos.
                </p>
                <div className="est-form-grid">
                  {input("openTime", "Hora de apertura", undefined, "time")}
                  {input("closeTime", "Hora de cierre", undefined, "time")}
                </div>
                <div className="est-form-grid">
                  {toggle(
                    "delivery",
                    "Domicilio",
                    "El cliente recibe el pedido en su dirección.",
                  )}
                  {toggle(
                    "pickup",
                    "Recoger en el negocio",
                    "El cliente pasa a recoger su pedido.",
                  )}
                </div>
                <label className="est-field">
                  ¿Cómo cambia el catálogo?
                  <select
                    value={draft.menuMode}
                    onChange={(e) =>
                      setDraft({ ...draft, menuMode: e.target.value })
                    }
                  >
                    <option value="EVERYDAY">
                      El mismo catálogo todos los días
                    </option>
                    <option value="DAILY">
                      Un menú diferente según el día
                    </option>
                  </select>
                  <small>
                    Administra los menús por día desde el catálogo del establecimiento.
                  </small>
                </label>
                {toggle("isPaused", "Establecimiento en pausa", "Solo cambia al guardar este control o usar el botón de Store App.")}
                {toggle(
                  "isActive",
                  "Establecimiento activo",
                  "Desactívalo para suspender los pedidos en sus canales.",
                )}
              </>
            )}
            {section === "channels" && (
              <>
                <h4>Dónde pueden pedir tus clientes</h4>
                <p className="est-help">
                  Los tres canales utilizan el mismo catálogo y disponibilidad.
                </p>
                <div className="est-channel-grid">
                  {toggle(
                    "isPublicVisible",
                    "App KroniX",
                    "Mostrar el negocio en Customer App.",
                  )}
                  {toggle(
                    "publicLinkEnabled",
                    "Enlace público",
                    "Compartir una página propia del negocio.",
                  )}
                  {toggle(
                    "dineInEnabled",
                    "Pedidos en mesa",
                    "Permitir pedidos mediante el QR de cada mesa.",
                  )}
                </div>
                {input(
                  "publicSlug",
                  "Nombre del enlace",
                  "Solo minúsculas, números y guiones. Conserva el nombre actual para no cambiar los enlaces compartidos.",
                )}
                <div className="est-link-preview">
                  {base}/r/{draft.publicSlug || "nombre-del-negocio"}
                </div>
                <label className="est-field">
                  Mesas o puntos de atención
                  <textarea
                    value={draft.locations}
                    onChange={(e) =>
                      setDraft({ ...draft, locations: e.target.value })
                    }
                    placeholder={"Mesa 1\nMesa 2\nTerraza"}
                  />
                  <small>
                    Una por línea. Cada mesa obtiene su propio QR; mantener su
                    nombre conserva el QR.
                  </small>
                </label>
              </>
            )}
            {section === "appearance" && (
              <>
                <h4>Presentación del catálogo</h4>
                <p className="est-help">
                  Configura la identidad que mostrarán las pantallas
                  compatibles.
                </p>
                {input(
                  "image",
                  "Imagen del negocio",
                  "Enlace de imagen o ruta existente, por ejemplo /images/stores1/Principal.png.",
                )}
                <div className="est-form-grid">
                  <label className="est-field">
                    Diseño del catálogo
                    <select
                      value={draft.template}
                      onChange={(e) =>
                        setDraft({ ...draft, template: e.target.value })
                      }
                    >
                      {Object.entries(templates).map(([k, l]) => (
                        <option key={k} value={k}>
                          {String(l)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="est-field">Estilo<select value={draft.style} onChange={e=>setDraft({...draft,style:e.target.value})}><option value="KRONIX">Kronix</option><option value="LEGACY">Clásico</option></select></label>
                  <label className="est-field">Tema<select value={draft.theme} onChange={e=>setDraft({...draft,theme:e.target.value,...(e.target.value === "VIBRANT" ? {primaryColor:"#6415C5",secondaryColor:"#350071",backgroundColor:"#F8EBFF",textColor:"#11142D",accentColor:"#FDE047"} : {})})}><option value="VIBRANT">Vibrante</option><option value="CUSTOM">Personalizado</option></select></label>
                  {input("primaryColor", "Color principal", undefined, "color")}
                </div>
              </>
            )}
          </div>
          <footer className="est-form-footer">
            <span>Los cambios se aplican al guardar.</span>
            <button className="est-primary" disabled={busy} onClick={save}>
              {busy ? "Guardando…" : "Guardar establecimiento"}
            </button>
          </footer>
        </section>
      ) : (
        <div className="est-layout">
          <aside className="est-directory" aria-label="Seleccionar establecimiento">
            <div className="est-business-list">
            {shown.map((r) => (
              <button
                key={r.id}
                aria-pressed={selected?.id === r.id}
                title={r.store.name}
                className={`est-business ${selected?.id === r.id ? "is-selected" : ""}`}
                onClick={() => {
                  setSelected(r);
                  setSearch("");
                  setMenuFilter("");
                  setTab("catalog");
                  setProduct(null);
                  setError("");
                }}
              >
                <span className="est-avatar">{r.store.name.charAt(0)}</span>
                <span className="est-business-info">
                  <b>{r.store.name}</b>
                  <small>
                    {r.store.city?.name} · {r.store.category}
                  </small>
                  <em
                    className={r.isActive && r.store.isActive && !r.store.isPaused ? "est-status" : "est-status paused"}
                  >
                    {!r.isActive||!r.store.isActive?"Inactivo":r.store.isPaused?"En pausa":"Activo"}
                  </em>
                </span>
              </button>
            ))}
            {!shown.length && (
              <p className="est-help">No hay negocios que coincidan.</p>
            )}
            </div>
          </aside>
          {selected ? (
            <section className="est-panel">
              <div className="est-panel-heading">
                <div>
                  <p className="est-eyebrow">
                    {selected.store.category} · {selected.store.city?.name}
                  </p>
                  <h3>{selected.store.name}</h3>
                  <p className="est-help">{selected.store.address}</p>
                </div>
                <button
                  className="est-secondary"
                  onClick={() => edit(selected)}
                >
                  Editar negocio
                </button>
              </div>
              <div className="est-summary">
                <div>
                  <b>{products.length}</b>
                  <small>Productos</small>
                </div>
                <div>
                  <b>
                    {selected.openTime} – {selected.closeTime}
                  </b>
                  <small>Horario de atención</small>
                </div>
                <div>
                  <b>{selected.locations?.length ?? 0}</b>
                  <small>Mesas configuradas</small>
                </div>
              </div>
              <nav className="est-tabs" aria-label="Administración del negocio">
                {[
                  ["catalog", "Catálogo"],
                  ["channels", "Canales de venta"],
                  ["tables", "Mesas y QR"],
                  ["orders", "Pedidos"],
                  ["reconciliation", "Conciliación"],
                  ["theme", "Tema"],
                  ["promotions", "Promociones"],
                  ["settings", "Pagos y comisiones"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => {
                      setTab(k);
                      setProduct(null);
                    }}
                    className={tab === k ? "is-active" : ""}
                  >
                    {l}
                  </button>
                ))}
              </nav>
              <div className="est-content">
                {tab === "settings" && <EstablishmentSettings key={selected.id} establishment={selected} onSaved={r=>{setSelected(r);load();}}/>}
                {(tab === "theme" || tab === "promotions") && <EstablishmentPresentation key={`${selected.id}:${tab}`} establishment={selected} section={tab} onSaved={r=>{setSelected(r);load();}}/>}
                {(tab === "orders" || tab === "reconciliation") && <EstablishmentOperations key={`${selected.id}:${tab}`} storeId={selected.storeId} initialTab={tab === "orders" ? "ORDERS" : "RECON"}/>}
                {tab === "catalog" && (
                  <>
                    <div className="est-catalog-tools">
                      <button className="est-secondary" onClick={async()=>{const day=prompt("Día: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY o HOLIDAY", "MONDAY");if(!day)return;const title=prompt("Nombre del menú", "Catálogo");if(!title)return;try{await apiFetch(`/admin/establishments/${selected.id}/menus`,{method:"POST",body:JSON.stringify({dayOfWeek:day.toUpperCase().trim(),title})});const data=await load();setSelected(data.find((r:any)=>r.id===selected.id));}catch(e:any){setError(e.message);}}}>Crear o renombrar menú</button>
                      <input
                        className="est-search"
                        aria-label="Buscar producto"
                        placeholder="Buscar producto o categoría…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <select
                        aria-label="Filtrar menú"
                        value={menuFilter}
                        onChange={(e) => setMenuFilter(e.target.value)}
                      >
                        <option value="">Todos los menús</option>
                        {selected.menus?.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                      {menuFilter && <><button className="est-secondary" onClick={async()=>{const menu=selected.menus.find((m:any)=>m.id===menuFilter);try{await apiFetch(`/commerce/admin/menus/${menuFilter}`,{method:"PATCH",body:JSON.stringify({isActive:!menu.isActive})});const data=await load();setSelected(data.find((r:any)=>r.id===selected.id));}catch(e:any){setError(e.message);}}}>{selected.menus.find((m:any)=>m.id===menuFilter)?.isActive ? "Pausar menú" : "Activar menú"}</button><button className="est-secondary" onClick={async()=>{if(!confirm("¿Eliminar este menú y sus productos? Los pedidos anteriores conservarán su historial."))return;try{await apiFetch(`/commerce/admin/menus/${menuFilter}`,{method:"DELETE"});setMenuFilter("");const data=await load();setSelected(data.find((r:any)=>r.id===selected.id));}catch(e:any){setError(e.message);}}}>Eliminar menú</button></>}
                      <button
                        className="est-primary"
                        onClick={() =>
                          setProduct({
                            ...blankProduct,
                            menuId: menuFilter || selected.menus?.[0]?.id || "",
                          })
                        }
                      >
                        ＋ Producto
                      </button>
                    </div>
                    <div className="est-table-wrap">
                      <table className="est-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Categoría / menú</th>
                            <th>Precio</th>
                            <th>Disponibilidad</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((x: any) => (
                            <tr key={x.id}>
                              <td>
                                <b>{x.name}</b>
                                {x.description && (
                                  <small>{x.description}</small>
                                )}
                              </td>
                              <td>
                                {x.category}
                                <small>{x.menuLabel}</small>
                              </td>
                              <td className="est-price">
                                {new Intl.NumberFormat("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  maximumFractionDigits: 0,
                                }).format(x.priceCOP)}
                              </td>
                              <td>
                                <span
                                  className={
                                    x.isActive
                                      ? "est-status"
                                      : "est-status paused"
                                  }
                                >
                                  {x.isActive ? "Disponible" : "Oculto"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="est-text-button"
                                  onClick={() => setProduct({ ...x })}
                                >
                                  Editar
                                </button>
                                <button className="est-text-button" onClick={async()=>{if(!confirm(`¿Eliminar ${x.name}? Los pedidos anteriores conservarán su historial.`))return;try{await apiFetch(`/commerce/admin/items/${x.id}`,{method:"DELETE"});const data=await load();setSelected(data.find((r:any)=>r.id===selected.id));}catch(e:any){setError(e.message);}}}>Eliminar</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!filtered.length && (
                      <div className="est-empty">
                        <h4>Tu catálogo empieza aquí</h4>
                        <p>
                          Agrega un producto o ajusta los filtros de búsqueda.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "channels" && (
                  <>
                    <div className="est-channel-grid">
                      {[
                        [
                          "App KroniX",
                          selected.isActive && selected.isPublicVisible,
                          "Los clientes encuentran el negocio en la ciudad seleccionada.",
                        ],
                        [
                          "Enlace público",
                          selected.isActive && selected.publicLinkEnabled,
                          "Comparte el enlace del negocio por WhatsApp o redes.",
                        ],
                        [
                          "Pedidos en mesa",
                          selected.isActive && selected.dineInEnabled,
                          "Coloca un QR en cada mesa para recibir pedidos.",
                        ],
                      ].map(([title, on, help]) => (
                        <article className="est-channel" key={String(title)}>
                          <span
                            className={on ? "est-status" : "est-status paused"}
                          >
                            {on ? "Habilitado" : "Desactivado"}
                          </span>
                          <h4>{title}</h4>
                          <p>{help}</p>
                        </article>
                      ))}
                    </div>
                    <h4 className="est-subheading">
                      Enlace del establecimiento
                    </h4>
                    <div className="est-link-row">
                      <a href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                      <button
                        className="est-secondary"
                        onClick={() => copy(url)}
                      >
                        Copiar enlace
                      </button>
                    </div>
                    <p className="est-help">
                      Los enlaces abren la web de pedidos configurada para este entorno.
                    </p>
                  </>
                )}
                {tab === "tables" && (
                  <>
                    <div className="est-catalog-tools">
                      <div>
                        <h4>Mesas y puntos de atención</h4>
                        <p className="est-help">
                          Descarga el QR correspondiente y ubícalo en cada mesa.
                        </p>
                      </div>
                      <button
                        className="est-secondary"
                        onClick={() => {
                          edit(selected);
                          setSection("channels");
                        }}
                      >
                        Administrar mesas
                      </button>
                    </div>
                    <div className="est-qr-grid">
                      {selected.locations?.map((l: any) => {
                        const link = `${url}?mode=dine-in&mesa=${l.qrToken}`,
                          qr = `/api/commerce-qr?url=${encodeURIComponent(link)}`;
                        return (
                          <article key={l.id} className="est-qr">
                            <h4>{l.label}</h4>
                            <img
                              alt={`QR para ${l.label}`}
                              src={qr}
                              width={160}
                              height={160}
                            />
                            <a
                              className="est-primary"
                              download={`QR-${l.label}.png`}
                              href={qr}
                            >
                              Descargar QR
                            </a>
                            <button
                              className="est-text-button"
                              onClick={() => copy(link)}
                            >
                              Copiar enlace de mesa
                            </button>
                          </article>
                        );
                      })}
                    </div>
                    {!selected.locations?.length && (
                      <div className="est-empty">
                        <h4>Aún no hay mesas</h4>
                        <p>
                          Registra sus nombres en Administrar mesas para generar
                          los QR.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          ) : (
            <section className="est-panel est-empty">
              <div className="est-empty-symbol">＋</div>
              <h3>Selecciona un establecimiento</h3>
              <p>Administra su catálogo, sus canales y los QR de sus mesas.</p>
            </section>
          )}
        </div>
      )}
      {product && selected && (
        <div className="est-modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
            className="est-modal"
          >
            <div className="est-panel-heading">
              <h3 id="product-title">
                {product.id ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button
                disabled={busy}
                className="est-secondary"
                onClick={() => setProduct(null)}
              >
                Cerrar
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProduct();
              }}
            >
              <div className="est-form-body">
                {!product.id && (
                  <label className="est-field">
                    Menú
                    <select
                      required
                      value={product.menuId}
                      onChange={(e) =>
                        setProduct({ ...product, menuId: e.target.value })
                      }
                    >
                      {selected.menus?.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="est-form-grid">
                  {[
                    ["name", "Nombre del producto"],
                    ["category", "Categoría"],
                    ["priceCOP", "Precio en pesos"],
                    ["image", "Imagen (enlace o ruta)"],
                  ].map(([k, l]) => (
                    <label className="est-field" key={k}>
                      {l}
                      <input
                        required={k !== "image"}
                        type={k === "priceCOP" ? "number" : "text"}
                        min={0}
                        step={k === "priceCOP" ? 1 : undefined}
                        value={product[k] ?? ""}
                        onChange={(e) =>
                          setProduct({ ...product, [k]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="est-field">
                  Descripción
                  <textarea
                    value={product.description ?? ""}
                    onChange={(e) =>
                      setProduct({ ...product, description: e.target.value })
                    }
                  />
                </label>
                <label className="est-toggle">
                  <span>
                    <b>Disponible para pedir</b>
                    <small>Desactívalo cuando el producto se agote.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={(e) =>
                      setProduct({ ...product, isActive: e.target.checked })
                    }
                  />
                </label>
                {error && (
                  <p role="alert" className="est-alert">
                    {error}
                  </p>
                )}
              </div>
              <footer className="est-form-footer">
                <button
                  type="button"
                  className="est-secondary"
                  disabled={busy}
                  onClick={() => setProduct(null)}
                >
                  Cancelar
                </button>
                <button className="est-primary" disabled={busy}>
                  {busy ? "Guardando…" : "Guardar producto"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
