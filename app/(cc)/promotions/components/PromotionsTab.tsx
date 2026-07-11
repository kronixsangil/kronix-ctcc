"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../../components/CtccCityContext";
import {
  AdminCityItem,
  AdminSystemPromo,
  adminCreateSystemPromo,
  adminListCities,
  adminListSystemPromos,
  adminUpdateSystemPromo,
} from "../../stores/lib/storesApi";

type PromoForm = {
  code: string;
  title: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: string;
  minOrderCOP: string;
  maxDiscountCOP: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const EMPTY_FORM: PromoForm = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderCOP: "",
  maxDiscountCOP: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function formatCOP(value?: number | null) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-CO");
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function isoOrNull(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getPromoState(promo: AdminSystemPromo) {
  if (!promo.isActive) {
    return { label: "Inactiva", className: "border-slate-200 bg-slate-100 text-slate-600" };
  }
  const now = Date.now();
  const start = promo.startsAt ? new Date(promo.startsAt).getTime() : null;
  const end = promo.endsAt ? new Date(promo.endsAt).getTime() : null;
  if (start && start > now) {
    return { label: "Programada", className: "border-sky-200 bg-sky-50 text-sky-700" };
  }
  if (end && end < now) {
    return { label: "Vencida", className: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  return { label: "Activa", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

export default function PromotionsTab() {
  const { isGlobal, citySlug: globalCitySlug, cityLabel: globalCityLabel } = useCtccCity();

  const [cities, setCities] = useState<AdminCityItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [localCitySlug, setLocalCitySlug] = useState("");
  const [items, setItems] = useState<AdminSystemPromo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSystemPromo | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);

  const effectiveCitySlug = isGlobal ? localCitySlug : globalCitySlug;
  const selectedCity = useMemo(
    () => cities.find((city) => city.slug === effectiveCitySlug) ?? null,
    [cities, effectiveCitySlug]
  );
  const effectiveCityLabel = selectedCity
    ? `${selectedCity.name}, ${selectedCity.department}`
    : isGlobal
      ? "Selecciona una ciudad"
      : globalCityLabel;
  const canManage = Boolean(effectiveCitySlug);

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const response = await adminListCities({ status: "ACTIVE", page: 1, limit: 100 });
      setCities(Array.isArray(response?.items) ? response.items : []);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function loadPromotions() {
    if (!effectiveCitySlug) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await adminListSystemPromos(effectiveCitySlug, "STORE");
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || "No fue posible cargar las promociones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (!isGlobal) setLocalCitySlug(globalCitySlug || "");
  }, [isGlobal, globalCitySlug]);

  useEffect(() => {
    setSuccess(null);
    setModalOpen(false);
    setEditing(null);
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCitySlug]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((promo) => {
      if (statusFilter === "ACTIVE" && !promo.isActive) return false;
      if (statusFilter === "INACTIVE" && promo.isActive) return false;
      if (!q) return true;
      return `${promo.code} ${promo.title} ${promo.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
    setError(null);
  }

  function openEdit(promo: AdminSystemPromo) {
    setEditing(promo);
    setForm({
      code: promo.code ?? "",
      title: promo.title ?? "",
      description: promo.description ?? "",
      discountType: promo.discountType ?? "PERCENT",
      discountValue: String(promo.discountValue ?? ""),
      minOrderCOP: promo.minOrderCOP == null ? "" : String(promo.minOrderCOP),
      maxDiscountCOP: promo.maxDiscountCOP == null ? "" : String(promo.maxDiscountCOP),
      startsAt: toInputDateTime(promo.startsAt),
      endsAt: toInputDateTime(promo.endsAt),
      isActive: Boolean(promo.isActive),
    });
    setModalOpen(true);
    setError(null);
  }

  async function savePromotion() {
    if (!effectiveCitySlug) return;
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    const discountValue = Number(form.discountValue || 0);
    if (!code) return setError("El código es obligatorio.");
    if (!title) return setError("El título es obligatorio.");
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return setError("El descuento debe ser mayor que cero.");
    }
    if (form.discountType === "PERCENT" && discountValue > 100) {
      return setError("El porcentaje no puede superar el 100%.");
    }
    const startsAt = isoOrNull(form.startsAt);
    const endsAt = isoOrNull(form.endsAt);
    if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return setError("La fecha final debe ser posterior a la fecha inicial.");
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        code,
        title,
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue,
        minOrderCOP: form.minOrderCOP === "" ? null : Math.max(0, Math.round(Number(form.minOrderCOP || 0))),
        maxDiscountCOP: form.maxDiscountCOP === "" ? null : Math.max(0, Math.round(Number(form.maxDiscountCOP || 0))),
        startsAt,
        endsAt,
        isActive: Boolean(form.isActive),
        serviceType: "STORE" as const,
      };

      if (editing?.id) {
        await adminUpdateSystemPromo(editing.id, payload);
        setSuccess("Promoción actualizada correctamente.");
      } else {
        await adminCreateSystemPromo({ ...payload, citySlug: effectiveCitySlug });
        setSuccess("Promoción creada correctamente.");
      }

      setModalOpen(false);
      setEditing(null);
      await loadPromotions();
    } catch (e: any) {
      setError(e?.message || "No fue posible guardar la promoción.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(promo: AdminSystemPromo) {
    setError(null);
    setSuccess(null);
    try {
      await adminUpdateSystemPromo(promo.id, {
        isActive: !promo.isActive,
        serviceType: "STORE",
      });
      setSuccess(promo.isActive ? "Promoción desactivada." : "Promoción activada.");
      await loadPromotions();
    } catch (e: any) {
      setError(e?.message || "No fue posible cambiar el estado.");
    }
  }

  return (
    <div className="space-y-2">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Promociones</h1>
             
              <div className="mt-4 flex flex-wrap gap-2">
              </div>
            </div>
            <button type="button" onClick={openCreate} disabled={!canManage} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:opacity-40">+ Nueva promoción</button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Ciudad</label>
            <select value={effectiveCitySlug || ""} disabled={!isGlobal || citiesLoading} onChange={(e) => setLocalCitySlug(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold disabled:bg-slate-50">
              <option value="">Selecciona una ciudad</option>
              {cities.map((city) => <option key={city.id} value={city.slug}>{city.name}, {city.department}</option>)}
            </select>
            <div className="mt-2 text-[11px] text-slate-500">{!isGlobal ? "La ciudad está controlada por el selector superior." : "Las promociones se administran por ciudad."}</div>
          </div>
          <button type="button" onClick={loadPromotions} disabled={!canManage || loading} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? "Actualizando..." : "⟳ Actualizar"}</button>
        </div>
      </section>

      {!canManage ? <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900 shadow-sm">Selecciona una ciudad para administrar promociones.</div> : null}
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</div><div className="mt-2 text-3xl font-black text-slate-950">{loading ? "..." : items.length}</div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Activas</div><div className="mt-2 text-3xl font-black text-emerald-700">{loading ? "..." : items.filter((p) => p.isActive).length}</div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Inactivas</div><div className="mt-2 text-3xl font-black text-slate-700">{loading ? "..." : items.filter((p) => !p.isActive).length}</div></div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código, título o descripción" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">
              <option value="ALL">Todas</option><option value="ACTIVE">Activas</option><option value="INACTIVE">Inactivas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white text-[11px] uppercase tracking-wide text-slate-500"><tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-bold"><th>Código</th><th>Promoción</th><th>Descuento</th><th>Pedido mínimo</th><th>Tope</th><th>Vigencia</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Cargando promociones...</td></tr> : filteredItems.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No hay promociones para mostrar.</td></tr> : filteredItems.map((promo) => {
                const state = getPromoState(promo);
                return <tr key={promo.id} className="align-top hover:bg-slate-50/70 [&>td]:px-4 [&>td]:py-4">
                  <td className="font-mono text-xs font-black text-slate-800">{promo.code}</td>
                  <td className="min-w-[260px]"><div className="font-black text-slate-950">{promo.title}</div>{promo.description ? <div className="mt-1 text-xs leading-5 text-slate-500">{promo.description}</div> : null}</td>
                  <td className="font-black text-slate-900">{promo.discountType === "PERCENT" ? `${promo.discountValue}%` : formatCOP(promo.discountValue)}</td>
                  <td>{promo.minOrderCOP == null ? "—" : formatCOP(promo.minOrderCOP)}</td>
                  <td>{promo.maxDiscountCOP == null ? "—" : formatCOP(promo.maxDiscountCOP)}</td>
                  <td className="min-w-[210px] text-xs leading-5 text-slate-600"><div><b>Inicio:</b> {formatDateTime(promo.startsAt)}</div><div><b>Fin:</b> {formatDateTime(promo.endsAt)}</div></td>
                  <td><span className={["inline-flex rounded-full border px-2.5 py-1 text-xs font-black", state.className].join(" ")}>{state.label}</span></td>
                  <td className="text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEdit(promo)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Editar</button><button type="button" onClick={() => togglePromotion(promo)} className={["rounded-xl border px-3 py-2 text-xs font-black", promo.isActive ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"].join(" ")}>{promo.isActive ? "Desactivar" : "Activar"}</button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4"><div><div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tienda en Línea · {effectiveCityLabel}</div><h2 className="mt-1 text-xl font-black text-slate-950">{editing ? "Editar promoción" : "Nueva promoción"}</h2></div><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Cerrar</button></div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <input value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="Código" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="Título" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={3} placeholder="Descripción" className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <select value={form.discountType} onChange={(e) => setForm((s) => ({ ...s, discountType: e.target.value as any }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><option value="PERCENT">Porcentaje</option><option value="FIXED">Valor fijo</option></select>
              <input type="number" min={0} value={form.discountValue} onChange={(e) => setForm((s) => ({ ...s, discountValue: e.target.value }))} placeholder="Valor descuento" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input type="number" min={0} value={form.minOrderCOP} onChange={(e) => setForm((s) => ({ ...s, minOrderCOP: e.target.value }))} placeholder="Pedido mínimo" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input type="number" min={0} value={form.maxDiscountCOP} onChange={(e) => setForm((s) => ({ ...s, maxDiscountCOP: e.target.value }))} placeholder="Tope descuento" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((s) => ({ ...s, startsAt: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((s) => ({ ...s, endsAt: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <label className="md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} /><span className="text-sm font-bold">Promoción activa</span></label>
              <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Cancelar</button><button type="button" onClick={savePromotion} disabled={saving} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear promoción"}</button></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
