//app\(cc)\security\components\SecurityUsersTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createSecurityUser,
  deleteSecurityUser,
  listSecurityUsers,
  updateSecurityUser,
  type SecurityUserRow,
} from "../lib/securityApi";
import { formatDateTime } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

type StatusFilter = "ALL" | "ACTIVE" | "DELETED";

const ALL_ROLE_OPTIONS = ["ADMIN", "FINANCE", "STORE", "DRIVER", "BUYER"];
const CITY_ROLE_OPTIONS = ["FINANCE", "STORE", "DRIVER", "BUYER"];

function getRoleOptions(isGlobal: boolean) {
  return isGlobal ? ALL_ROLE_OPTIONS : CITY_ROLE_OPTIONS;
}

function cityBadgeLabel(u: SecurityUserRow) {
  if (!u.city) return "Global";
  return `${u.city.name}, ${u.city.department}`;
}

export default function SecurityUsersTab() {
  const { isGlobal, citySlug, cityLabel, cityGeoLabel, cities } = useCtccCity();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; items: SecurityUserRow[] } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SecurityUserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "FINANCE",
    storeId: "",
    citySlug: "",
    isGlobal: true,
  });

  const roleOptions = useMemo(() => getRoleOptions(isGlobal), [isGlobal]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listSecurityUsers({
        q,
        role,
        status,
        page,
        limit,
        citySlug: isGlobal ? "" : citySlug,
      });
      setData({ total: res.total, items: res.items });
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar usuarios");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, status, page, limit, isGlobal, citySlug]);

  useEffect(() => {
    setPage(1);
    if (!isGlobal && role === "ADMIN") {
      setRole("ALL");
    }
  }, [isGlobal, citySlug, role]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      role: "FINANCE",
      storeId: "",
      citySlug: isGlobal ? "" : citySlug,
      isGlobal: isGlobal,
    });
    setModalOpen(true);
  }

  function openEdit(u: SecurityUserRow) {
    const userCitySlug = u.city?.slug ?? "";
    const userIsGlobal = !userCitySlug;

    setEditing(u);
    setForm({
      name: u.name ?? "",
      phone: u.phone ?? "",
      email: u.email ?? "",
      password: "",
      role: u.role ?? "FINANCE",
      storeId: u.storeId ?? "",
      citySlug: userCitySlug,
      isGlobal: isGlobal ? userIsGlobal : false,
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
    setError(null);

    try {
      const safeRole = !isGlobal && form.role === "ADMIN" ? "FINANCE" : form.role;

      if (!editing) {
        await createSecurityUser({
          name: form.name,
          phone: form.phone,
          email: form.email.trim() ? form.email.trim() : null,
          password: form.password,
          role: safeRole,
          storeId: form.storeId.trim() ? form.storeId.trim() : null,
          citySlug: form.isGlobal ? null : form.citySlug || null,
        });
      } else {
        await updateSecurityUser(editing.id, {
          name: form.name,
          phone: form.phone,
          email: form.email.trim() ? form.email.trim() : null,
          password: form.password.trim() ? form.password.trim() : undefined,
          role: safeRole,
          storeId: form.storeId.trim() ? form.storeId.trim() : null,
          citySlug: form.isGlobal ? null : form.citySlug || null,
        });
      }

      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(u: SecurityUserRow) {
    if (!confirm(`¿Desactivar/eliminar lógicamente a ${u.name}?`)) return;
    try {
      await deleteSecurityUser(u.id);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo desactivar");
    }
  }

  const canNext = useMemo(() => {
    const items = data?.items?.length ?? 0;
    return items >= limit;
  }, [data, limit]);

  return (
    <div className="space-y-4">
      {!isGlobal ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Vista filtrada por <b>{cityLabel}</b>. Aquí se muestran usuarios vinculados operativamente a esta ciudad.
          Los usuarios globales y la administración centralizada de seguridad se siguen gestionando desde Vista Global.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-lg font-semibold text-slate-900">Usuarios del sistema</div>
          <div className="mt-1 text-xs text-slate-500">
            Creación, edición, rol y baja lógica de usuarios.
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <label className="text-xs text-slate-500">Buscar</label>
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Nombre, phone, email, id..."
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Rol</label>
              <select
                value={role}
                onChange={(e) => {
                  setPage(1);
                  setRole(e.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">Todos</option>
                {roleOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="text-xs text-slate-500">Estado</label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as StatusFilter);
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="ACTIVE">Activos</option>
                <option value="DELETED">Eliminados</option>
                <option value="ALL">Todos</option>
              </select>
            </div>

            <div className="xl:col-span-1">
              <label className="text-xs text-slate-500">Por página</label>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>

            <div className="xl:col-span-2 flex items-end justify-end gap-2">
              <button
                onClick={load}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                {loading ? "Cargando..." : "Refrescar"}
              </button>
              <button
                onClick={openCreate}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-sm font-medium text-slate-900">Listado</div>
          <div className="text-xs text-slate-500">
            {loading ? "Cargando..." : `${data?.total ?? 0} total`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Alcance</th>
                <th className="px-4 py-3">StoreId</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">
                      {u.phone}
                      {u.email ? ` · ${u.email}` : ""}
                      {` · ${u.id}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.city ? (
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700">
                        {cityBadgeLabel(u)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                        Global
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.storeId || "—"}</td>
                  <td className="px-4 py-3">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      {!u.deletedAt ? (
                        <button
                          onClick={() => removeUser(u)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <span className="px-3 py-2 text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && (data?.items?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay resultados para los filtros actuales.
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
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {editing ? "Editar usuario interno" : "Crear usuario interno"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Control de acceso del ecosistema KroniX.
                </div>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Phone / username</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  {editing ? "Nueva contraseña (opcional)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
                <div className="mt-1 text-[11px] text-slate-500">Mínimo 6 caracteres.</div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {getRoleOptions(isGlobal).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs text-slate-500">Alcance / Ciudad</label>

                {isGlobal ? (
                  <>
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
                              role: p.role === "ADMIN" ? "ADMIN" : p.role,
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
                              role: p.role === "ADMIN" ? "FINANCE" : p.role,
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
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      Usuario local ligado a <span className="font-semibold">{cityGeoLabel}</span>.
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      En vista ciudad no se pueden crear usuarios globales ni administradores globales.
                    </div>
                  </>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-500">StoreId (solo si aplica)</label>
                <input
                  value={form.storeId}
                  onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm hover:bg-slate-50"
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
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}