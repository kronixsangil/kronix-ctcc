//app\(cc)\security\components\SecurityUsersTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminResetUserPassword,
  createSecurityUser,
  deleteSecurityUser,
  getPasswordResetSummary,
  getPasswordUserStatus,
  listPasswordResetRequests,
  listSecurityUsers,
  updateSecurityUser,
  type AdminPasswordResetResponse,
  type PasswordResetRequestRow,
  type PasswordUserStatusResponse,
  type SecurityUserRow,
} from "../lib/securityApi";
import { formatDateTime } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

type StatusFilter = "ALL" | "ACTIVE" | "DELETED";
type PasswordFilter = "PENDING" | "RESOLVED" | "ALL";

const ALL_ROLE_OPTIONS = ["ADMIN", "FINANCE", "STORE", "DRIVER", "BUYER"];
const CITY_ROLE_OPTIONS = ["FINANCE", "STORE", "DRIVER", "BUYER"];

function getRoleOptions(isGlobal: boolean) {
  return isGlobal ? ALL_ROLE_OPTIONS : CITY_ROLE_OPTIONS;
}

function cityBadgeLabel(u: SecurityUserRow) {
  if (!u.city) return "Global";
  return `${u.city.name}, ${u.city.department}`;
}

function roleLabel(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  if (r === "BUYER") return "Cliente";
  if (r === "DRIVER") return "Conductor";
  if (r === "STORE") return "Tienda";
  if (r === "ADMIN") return "Admin";
  if (r === "FINANCE") return "Finanzas";
  return r || "Usuario";
}

function buildWhatsappFallback(user: SecurityUserRow | PasswordUserStatusResponse["user"], temp: string) {
  const name = String(user?.name ?? "usuario").trim() || "usuario";
  return [
    `Hola ${name}.`,
    "",
    "Tu contraseña temporal de KroniX fue restablecida por soporte.",
    "",
    `Nueva contraseña: ${temp}`,
    "",
    "Por seguridad, inicia sesión y cámbiala inmediatamente desde Perfil > Seguridad.",
    "",
    "Equipo KroniX.",
  ].join("\n");
}

function PasswordRequestStatusPill({ status }: { status?: string | null }) {
  const s = String(status ?? "").toUpperCase();
  if (s === "RESOLVED") {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em] text-emerald-700">
        Resuelta
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.10em] text-amber-700">
      Pendiente
    </span>
  );
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

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<SecurityUserRow | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<PasswordUserStatusResponse | null>(null);
  const [passwordResult, setPasswordResult] = useState<AdminPasswordResetResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [resetSummary, setResetSummary] = useState<{ pending: number } | null>(null);
  const [resetRows, setResetRows] = useState<PasswordResetRequestRow[]>([]);
  const [resetRowsLoading, setResetRowsLoading] = useState(false);
  const [resetFilter, setResetFilter] = useState<PasswordFilter>("PENDING");

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
  const pendingUserIds = useMemo(() => new Set(resetRows.filter((r) => r.status === "PENDING").map((r) => r.userId)), [resetRows]);

  async function loadPasswordSummary() {
    try {
      const summary = await getPasswordResetSummary({ citySlug: isGlobal ? "" : citySlug });
      setResetSummary({ pending: Number(summary.pending ?? 0) });
    } catch {
      setResetSummary(null);
    }
  }

  async function loadPasswordRequests() {
    setResetRowsLoading(true);
    try {
      const res = await listPasswordResetRequests({
        status: resetFilter,
        role,
        q,
        citySlug: isGlobal ? "" : citySlug,
        page: 1,
        limit: 50,
      });
      setResetRows(res.items ?? []);
    } catch {
      setResetRows([]);
    } finally {
      setResetRowsLoading(false);
    }
  }

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
    loadPasswordSummary();
    loadPasswordRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, resetFilter, isGlobal, citySlug]);

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

  async function openPasswordModal(u: SecurityUserRow) {
    setPasswordUser(u);
    setPasswordModalOpen(true);
    setPasswordErr(null);
    setPasswordStatus(null);
    setPasswordResult(null);
    setCopied(false);
    setPasswordLoading(true);

    try {
      const res = await getPasswordUserStatus(u.id);
      setPasswordStatus(res);
    } catch (e: any) {
      setPasswordErr(e?.message || "No se pudo cargar el estado de contraseña.");
    } finally {
      setPasswordLoading(false);
    }
  }

  function closePasswordModal() {
    if (passwordSaving) return;
    setPasswordModalOpen(false);
    setPasswordUser(null);
    setPasswordStatus(null);
    setPasswordResult(null);
    setPasswordErr(null);
    setCopied(false);
  }

  async function resetPassword() {
    if (!passwordUser || passwordSaving) return;

    setPasswordSaving(true);
    setPasswordErr(null);
    setPasswordResult(null);
    setCopied(false);

    try {
      const res = await adminResetUserPassword(passwordUser.id, {
        notes: "Reset administrativo desde Seguridad > Usuarios > Contraseñas",
      });
      setPasswordResult(res);
      await loadPasswordSummary();
      await loadPasswordRequests();
    } catch (e: any) {
      setPasswordErr(e?.message || "No se pudo restablecer la contraseña.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function copyWhatsappMessage() {
    const message = passwordResult?.whatsappMessage || (passwordUser && passwordResult?.temporaryPassword ? buildWhatsappFallback(passwordUser, passwordResult.temporaryPassword) : "");
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setPasswordErr("No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.");
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">Usuarios del sistema</div>
              <div className="mt-1 text-xs text-slate-500">
                Creación, edición, rol, baja lógica y recuperación administrativa de contraseñas.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                Usuarios
              </span>
              <span className="relative rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                Contraseñas
                {resetSummary?.pending ? (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                    {resetSummary.pending}
                  </span>
                ) : null}
              </span>
            </div>
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
                onClick={() => {
                  load();
                  loadPasswordSummary();
                  loadPasswordRequests();
                }}
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

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-slate-900">Contraseñas</div>
                <div className="mt-0.5 text-xs font-medium text-slate-500">
                  Solicitudes pendientes y reseteos manuales para enviar la contraseña temporal por WhatsApp Business.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={resetFilter}
                  onChange={(e) => setResetFilter(e.target.value as PasswordFilter)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="PENDING">Pendientes</option>
                  <option value="RESOLVED">Resueltas</option>
                  <option value="ALL">Todas</option>
                </select>
                <button
                  type="button"
                  onClick={loadPasswordRequests}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  {resetRowsLoading ? "Cargando..." : `${resetRows.length} en vista`}
                </button>
              </div>
            </div>

            {resetRows.length ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {resetRows.slice(0, 6).map((r) => (
                  <button
                    key={`${r.userId}-${r.requestId ?? "manual"}`}
                    type="button"
                    onClick={() =>
                      openPasswordModal({
                        id: r.userId,
                        name: r.name,
                        phone: r.phone,
                        email: r.email,
                        role: r.role,
                        createdAt: r.requestedAt || new Date().toISOString(),
                        deletedAt: null,
                        storeId: r.storeId,
                        city: r.city,
                      })
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">{r.name}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          {roleLabel(r.role)} · {r.phone}
                        </div>
                      </div>
                      <PasswordRequestStatusPill status={r.status} />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
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
              {(data?.items ?? []).map((u) => {
                const hasPendingReset = pendingUserIds.has(u.id);
                return (
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
                      <div className="flex flex-wrap justify-end gap-2">
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
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="relative rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100"
                        >
                          Contraseñas
                          {hasPendingReset ? (
                            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />
                          ) : null}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

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
                <div className="mt-1 text-[11px] text-slate-500">
                  Mínimo 8 caracteres, combinando letras y números. No necesita símbolos.
                </div>
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
                  (!editing && form.password.trim().length < 8) ||
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

      {passwordModalOpen && passwordUser ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black">Gestión de contraseña</div>
                  <div className="mt-1 text-sm font-semibold text-white/65">
                    Reset administrativo y mensaje para WhatsApp Business.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordSaving}
                  className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Usuario</div>
                <div className="mt-2 text-lg font-black text-slate-950">{passwordStatus?.user?.name ?? passwordUser.name}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{roleLabel(passwordStatus?.user?.role ?? passwordUser.role)}</div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-xl bg-white px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-slate-400">Teléfono</div>
                    <div className="font-bold text-slate-900">{passwordStatus?.user?.phone ?? passwordUser.phone}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-slate-400">Email</div>
                    <div className="break-words font-bold text-slate-900">{passwordStatus?.user?.email ?? passwordUser.email ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-slate-400">Solicitudes pendientes</div>
                    <div className="font-bold text-slate-900">
                      {passwordLoading ? "..." : passwordStatus?.pendingResetRequests ?? (pendingUserIds.has(passwordUser.id) ? 1 : 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {passwordErr ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
                    {passwordErr}
                  </div>
                ) : null}

                {passwordLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-600">
                    Cargando estado de recuperación...
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">Nueva contraseña temporal</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        Se genera alfanumérica de 8 caracteres, revoca sesiones y consume solicitudes pendientes.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetPassword}
                      disabled={passwordSaving || passwordLoading || Boolean(passwordUser.deletedAt)}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {passwordSaving ? "Generando..." : "Restablecer contraseña"}
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center">
                    <div className="font-mono text-3xl font-black tracking-[0.16em] text-slate-950">
                      {passwordResult?.temporaryPassword ?? "••••••••"}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                      {passwordResult ? "Contraseña temporal generada. Copia el mensaje y envíalo al usuario." : "Aún no se ha generado una contraseña temporal."}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">Mensaje WhatsApp</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">Texto listo para copiar y enviar desde WhatsApp Business.</div>
                    </div>
                    <button
                      type="button"
                      onClick={copyWhatsappMessage}
                      disabled={!passwordResult?.temporaryPassword}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {copied ? "Copiado ✅" : "Copiar mensaje"}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={passwordResult?.whatsappMessage ?? "Genera una contraseña temporal para ver aquí el mensaje listo para WhatsApp."}
                    className="mt-3 h-44 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
