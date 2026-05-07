//app\(cc)\drivers\components\UsersTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "@/app/(cc)/components/CtccCityContext";
import {
  createDriverUser,
  deleteDriverUser,
  listDriverUsers,
  updateDriverUser,
  type AdminDriverUser,
} from "../lib/usersApi";

function levelLabel(lvl?: string | null) {
  const v = String(lvl ?? "").toUpperCase();
  if (v === "PLATINO") return "Platino";
  if (v === "ORO") return "Oro";
  if (v === "PLATA") return "Plata";
  return "Bronce";
}

function cityLabelFromUser(u: AdminDriverUser) {
  if (!u.driverProfile?.city) return "Global";
  return `${u.driverProfile.city.name}, ${u.driverProfile.city.department}`;
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "slate",
  hint,
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "blue";
  hint?: string;
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "amber"
        ? "from-amber-100 to-white"
        : tone === "blue"
          ? "from-blue-100 to-white"
          : "from-slate-100 to-white";

  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-blue-700"
          : "text-slate-900";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${glow}`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function UsersTab() {
  const { citySlug, isGlobal, cityGeoLabel, cities } = useCtccCity();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "DELETED">("ACTIVE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; items: AdminDriverUser[] } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDriverUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    documentId: "",
    isActive: true,
    citySlug: "",
    isGlobal: false,
  });

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const res = await listDriverUsers({
        q,
        status,
        page,
        limit,
        citySlug: isGlobal ? undefined : citySlug,
      });

      setData({ total: res.total, items: res.items });
    } catch (e: any) {
      setErr(e?.message || "Error cargando usuarios");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page, limit, citySlug, isGlobal]);

  useEffect(() => {
    setPage(1);
  }, [citySlug, isGlobal]);

  const canNext = useMemo(() => {
    const n = data?.items?.length ?? 0;
    return n >= limit;
  }, [data, limit]);

  const summary = useMemo(() => {
    const items = data?.items ?? [];
    const active = items.filter((u) => !u.deletedAt && u.driverProfile?.isActive).length;
    const deleted = items.filter((u) => Boolean(u.deletedAt)).length;
    const withDocument = items.filter((u) => Boolean(u.driverProfile?.documentId)).length;

    return {
      total: data?.total ?? 0,
      active,
      deleted,
      withDocument,
    };
  }, [data]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      documentId: "",
      isActive: true,
      citySlug: isGlobal ? "" : citySlug,
      isGlobal: isGlobal,
    });
    setModalOpen(true);
  }

  function openEdit(u: AdminDriverUser) {
    const userCitySlug = u.driverProfile?.city?.slug ?? "";
    const userIsGlobal = !userCitySlug;

    setEditing(u);
    setForm({
      name: u.name ?? "",
      phone: u.phone ?? "",
      email: u.email ?? "",
      password: "",
      documentId: u.driverProfile?.documentId ?? "",
      isActive: u.driverProfile?.isActive ?? true,
      citySlug: userCitySlug,
      isGlobal: userIsGlobal,
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  }

  async function save() {
    setSaving(true);
    setErr(null);

    try {
      const body = {
        name: form.name,
        phone: form.phone,
        email: form.email.trim() ? form.email.trim() : null,
        password: form.password,
        documentId: form.documentId.trim() ? form.documentId.trim() : null,
        isActive: !!form.isActive,
        citySlug: form.isGlobal ? null : form.citySlug || null,
      };

      if (!editing) {
        await createDriverUser(body);
      } else {
        await updateDriverUser(editing.id, {
          ...body,
          password: form.password.trim() ? form.password.trim() : undefined,
        });
      }

      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: AdminDriverUser) {
    if (!confirm(`¿Eliminar (soft delete) al usuario ${u.name}?`)) return;
    setErr(null);

    try {
      await deleteDriverUser(u.id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo eliminar");
    }
  }

  return (
    <>
      {err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Usuarios DRIVER"
              subtitle="Gestión de credenciales, activación e información base de acceso a la Driver App."
            />
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  {isGlobal ? "Vista global: todas las ciudades" : `Ciudad activa: ${cityGeoLabel}`}
                </span>

                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
                  {data?.total ?? 0} usuario(s) en vista
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Total" value={String(summary.total)} tone="slate" hint="Registros en la vista" />
                <MetricCard label="Activos" value={String(summary.active)} tone="emerald" hint="Disponibles para login" />
                <MetricCard label="Eliminados" value={String(summary.deleted)} tone="amber" hint="Soft delete aplicado" />
                <MetricCard label="Con documento" value={String(summary.withDocument)} tone="blue" hint="Documentación cargada" />
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Resumen de filtros" subtitle="Estado actual de la búsqueda" />
            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Ciudad</span>
                  <span className="max-w-[220px] truncate text-right font-semibold text-slate-900">
                    {isGlobal ? "Todas las ciudades" : cityGeoLabel}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estado</span>
                  <span className="font-semibold text-slate-900">
                    {status === "ALL" ? "Todos" : status === "ACTIVE" ? "Activos" : "Eliminados"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Búsqueda</span>
                  <span className="max-w-[220px] truncate text-right font-semibold text-slate-900">
                    {q.trim() || "Sin filtro"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Paginación</span>
                  <span className="font-semibold text-slate-900">
                    Página {page} · {limit}/pág
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Filtros"
            subtitle="Consulta, filtra y crea usuarios internos del módulo Driver."
          />
          <div className="p-4">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <label className="text-xs font-medium text-slate-600">Buscar</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Nombre, phone, email, id..."
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                />
              </div>

              <div className="lg:col-span-3">
                <label className="text-xs font-medium text-slate-600">Estado</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value as "ALL" | "ACTIVE" | "DELETED");
                  }}
                >
                  <option value="ACTIVE">Activos</option>
                  <option value="DELETED">Eliminados</option>
                  <option value="ALL">Todos</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Por página</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              <div className="flex items-end justify-end gap-2 lg:col-span-2">
                <button
                  onClick={load}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>
                <button
                  onClick={openCreate}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Usuarios (Drivers)"
            subtitle="Listado consolidado de usuarios internos"
            right={<span className="text-xs text-slate-500">{loading ? "Cargando..." : `${data?.total ?? 0} total`}</span>}
          />

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Activo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {(data?.items ?? []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {u.phone}
                        {u.email ? ` · ${u.email}` : ""}
                        {" · "}
                        {u.id}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {u.driverProfile?.city ? (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                          {cityLabelFromUser(u)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                          Global
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-700">{levelLabel(u.driverProfile?.level)}</td>
                    <td className="px-4 py-4 text-slate-700">{u.driverProfile?.isActive ? "Sí" : "No"}</td>
                    <td className="px-4 py-4 text-slate-700">{u.driverProfile?.documentId ?? "—"}</td>
                    <td className="px-4 py-4">
                      {u.deletedAt ? (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                          Eliminado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(u)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && (data?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                      No hay resultados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">
              Página {page} · {limit} por página
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {editing ? "Editar usuario DRIVER" : "Crear usuario DRIVER"}
                </div>
                <div className="mt-1 text-sm text-slate-600">Credenciales para Driver App</div>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-slate-50 px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500">Nombre</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Phone (username)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Email (opcional)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    {editing ? "Nueva contraseña (opcional)" : "Contraseña"}
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  />
                  <div className="mt-1 text-[11px] text-slate-500">Mínimo 6 caracteres.</div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">Documento (opcional)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.documentId}
                    onChange={(e) => setForm((p) => ({ ...p, documentId: e.target.value }))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs text-slate-500">Alcance / Ciudad</label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        checked={form.isGlobal}
                        onChange={() =>
                          setForm((p) => ({
                            ...p,
                            isGlobal: true,
                            citySlug: "",
                          }))
                        }
                      />
                      <span>Global</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        checked={!form.isGlobal}
                        onChange={() =>
                          setForm((p) => ({
                            ...p,
                            isGlobal: false,
                            citySlug: p.citySlug || citySlug || "",
                          }))
                        }
                      />
                      <span>Asignar a ciudad</span>
                    </label>
                  </div>

                  {!form.isGlobal ? (
                    <select
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={form.citySlug}
                      onChange={(e) => setForm((p) => ({ ...p, citySlug: e.target.value }))}
                    >
                      <option value="">Selecciona una ciudad</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}, {c.department}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="mt-2 text-[11px] text-slate-500">
                    Usa Global si este usuario no debe quedar restringido a una ciudad específica.
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    />
                    <span>Driver activo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={
                  saving ||
                  (!editing && form.password.trim().length < 6) ||
                  (!form.isGlobal && !form.citySlug)
                }
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}