"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

const LABELS: Record<string, string> = {
  CUSTOMER: "Cliente",
  WORKER: "Trabajador",
  CARPOOL_PASSENGER: "Pasajero Ruta Kx",
  CARPOOL_DRIVER: "Conductor Ruta Kx",
  STORE: "Tienda",
  ADMINISTRATION: "Administración",
};

const TONES: Record<string, string> = {
  CUSTOMER: "bg-blue-50 text-blue-700 ring-blue-200",
  WORKER: "bg-amber-50 text-amber-700 ring-amber-200",
  CARPOOL_PASSENGER: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CARPOOL_DRIVER: "bg-orange-50 text-orange-700 ring-orange-200",
  STORE: "bg-violet-50 text-violet-700 ring-violet-200",
  ADMINISTRATION: "bg-slate-100 text-slate-700 ring-slate-300",
};

type Capability = { key: string; isEnabled: boolean; source: string };
type UserRow = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  createdAt: string;
  deletedAt?: string | null;
  city?: { name?: string; slug?: string } | null;
  capabilities: Capability[];
  products: { services: boolean; rutaKronix: boolean };
  activity: { orders: number; carpoolTrips: number; carpoolBookings: number };
};
type Response = { items: UserRow[]; total: number; page: number; limit: number; capabilities: string[] };

function Badge({ capability }: { capability: Capability }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${capability.isEnabled ? TONES[capability.key] ?? TONES.ADMINISTRATION : "bg-slate-50 text-slate-400 ring-slate-200 line-through"}`}>
      {LABELS[capability.key] ?? capability.key}
    </span>
  );
}

export default function UsersPage() {
  const [data, setData] = useState<Response | null>(null);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [capability, setCapability] = useState("ALL");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => { setQuery(q.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "30", capability, status });
      if (query) qs.set("q", query);
      setData(await apiFetch<Response>(`/admin/identity/users?${qs.toString()}`));
    } catch (e: any) {
      setError(e?.message || "No pudimos cargar los usuarios KroniX.");
    } finally { setLoading(false); }
  }, [page, capability, status, query]);

  useEffect(() => { void load(); }, [load]);

  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 30)));
  const activeCount = useMemo(() => data?.items.filter((x) => !x.deletedAt).length ?? 0, [data]);

  async function toggle(key: string) {
    if (!selected) return;
    const current = selected.capabilities.find((item) => item.key === key);
    setSaving(true);
    try {
      const updated = await apiFetch<UserRow>(`/admin/identity/users/${selected.id}/capabilities`, {
        method: "PATCH",
        body: JSON.stringify({ capabilities: [{ key, isEnabled: !(current?.isEnabled ?? false) }] }),
      });
      setSelected(updated);
      setData((old) => old ? { ...old, items: old.items.map((item) => item.id === updated.id ? updated : item) } : old);
    } catch (e: any) { setError(e?.message || "No se pudo actualizar la capacidad."); }
    finally { setSaving(false); }
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-6 text-white shadow-xl">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Identidad única KroniX</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-black">Usuarios KroniX</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Una persona, una cuenta y todas sus capacidades habilitadas en los productos KroniX.</p></div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 text-right ring-1 ring-white/15"><div className="text-2xl font-black">{data?.total ?? 0}</div><div className="text-xs text-slate-300">usuarios encontrados</div></div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs font-bold text-slate-400">En esta página</div><div className="mt-1 text-2xl font-black text-slate-900">{data?.items.length ?? 0}</div></div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs font-bold text-slate-400">Activos visibles</div><div className="mt-1 text-2xl font-black text-emerald-700">{activeCount}</div></div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-xs font-bold text-slate-400">Vista</div><div className="mt-1 text-lg font-black text-blue-700">Global · Todas las ciudades</div></div>
      </section>

      <section className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_180px_auto]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, celular o correo" className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500" />
          <select value={capability} onChange={(e) => { setCapability(e.target.value); setPage(1); }} className="h-12 rounded-2xl border border-slate-200 px-3 font-bold">
            <option value="ALL">Todas las capacidades</option>
            {Object.entries(LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-12 rounded-2xl border border-slate-200 px-3 font-bold"><option value="ACTIVE">Activos</option><option value="ALL">Todos</option><option value="DELETED">Eliminados</option></select>
          <button onClick={() => void load()} className="h-12 rounded-2xl bg-slate-950 px-5 font-black text-white">Actualizar</button>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-700">{error}</div> : null}

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Usuario</th><th className="p-4">Contacto</th><th className="p-4">Capacidades</th><th className="p-4">Ciudad operativa</th><th className="p-4">Actividad</th><th className="p-4">Registro</th><th className="p-4"></th></tr></thead>
            <tbody className="divide-y">
              {(data?.items ?? []).map((user) => (
                <tr key={user.id} className="align-top hover:bg-slate-50/70">
                  <td className="p-4"><div className="font-black text-slate-950">{user.name}</div><div className="mt-1 text-xs font-bold text-slate-400">Rol base: {user.role}</div></td>
                  <td className="p-4"><div className="font-bold">{user.phone}</div><div className="mt-1 text-xs text-slate-500">{user.email || "Sin correo"}</div></td>
                  <td className="p-4"><div className="flex max-w-md flex-wrap gap-1.5">{user.capabilities.filter((x) => x.isEnabled).map((item) => <Badge key={item.key} capability={item} />)}</div></td>
                  <td className="p-4 font-bold text-slate-600">{user.city?.name || "Global / Sin ciudad"}</td>
                  <td className="p-4 text-xs font-bold text-slate-600">{user.activity.orders} órdenes · {user.activity.carpoolBookings} reservas · {user.activity.carpoolTrips} viajes</td>
                  <td className="p-4 text-xs font-bold text-slate-500">{new Date(user.createdAt).toLocaleDateString("es-CO")}</td>
                  <td className="p-4"><button onClick={() => setSelected(user)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">Gestionar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !data?.items.length ? <div className="p-12 text-center font-bold text-slate-400">No encontramos usuarios con estos filtros.</div> : null}
        {loading ? <div className="p-12 text-center font-bold text-blue-600">Cargando identidades KroniX…</div> : null}
        <div className="flex items-center justify-between border-t bg-slate-50 p-4"><span className="text-xs font-bold text-slate-500">Página {page} de {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((x) => x - 1)} className="rounded-xl border bg-white px-4 py-2 text-xs font-black disabled:opacity-40">Anterior</button><button disabled={page >= pages} onClick={() => setPage((x) => x + 1)} className="rounded-xl border bg-white px-4 py-2 text-xs font-black disabled:opacity-40">Siguiente</button></div></div>
      </section>

      {selected ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-xs font-black uppercase tracking-widest text-blue-600">Capacidades</div><h2 className="mt-1 text-2xl font-black">{selected.name}</h2><p className="text-sm text-slate-500">{selected.phone}</p></div><button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 px-3 py-2 font-black">×</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{Object.entries(LABELS).map(([key, label]) => { const enabled = selected.capabilities.some((x) => x.key === key && x.isEnabled); return <button key={key} disabled={saving} onClick={() => void toggle(key)} className={`flex items-center justify-between rounded-2xl border p-4 text-left ${enabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><span className="font-black text-slate-800">{label}</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${enabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>{enabled ? "ACTIVA" : "INACTIVA"}</span></button>; })}</div><p className="mt-5 text-xs leading-5 text-slate-500">Desactivar una capacidad no elimina la cuenta ni cambia su rol operativo. Los perfiles documentales se gestionan en sus módulos especializados.</p></div></div> : null}
    </main>
  );
}
