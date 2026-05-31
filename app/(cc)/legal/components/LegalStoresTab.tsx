//app\(cc)\legal\components\LegalStoresTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../../components/CtccCityContext";
import {
  AdminStoreListItem,
  StoreStatusFilter,
  adminListStores,
} from "../../stores/lib/storesApi";

type LegalAcceptance = {
  id: string;
  userId: string;
  documentType: string;
  version: string;
  source: string;
  acceptanceMethod?: string | null;
  acceptedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  cityId?: string | null;
  createdAt: string;
};

type LegalDocumentVersion = {
  id: string;
  documentType: string;
  version: string;
  title: string;
  description?: string | null;
  content?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type StoreLegalResponse = {
  ok: boolean;
  message?: string;
  storeId: string;
  store: AdminStoreListItem | null;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: string;
  } | null;
  acceptances: LegalAcceptance[];
};

const STORE_LEGAL_DOC_FALLBACKS = [
  {
    type: "STORE_TERMS",
    label: "Términos y Condiciones",
    fallbackVersion: "store-terms-v1-2026-05",
  },
  {
    type: "STORE_PRIVACY",
    label: "Política de Privacidad",
    fallbackVersion: "store-privacy-v1-2026-05",
  },
  {
    type: "STORE_OPERATIONAL_CONSENT",
    label: "Consentimientos Operativos",
    fallbackVersion: "store-operational-consent-v1-2026-05",
  },
];

function buildStoreLegalDocs(currentDocs: LegalDocumentVersion[]) {
  return STORE_LEGAL_DOC_FALLBACKS.map((item) => {
    const current = currentDocs.find((doc) => doc.documentType === item.type);

    return {
      type: item.type,
      label: current?.title || item.label,
      currentVersion: current?.version || item.fallbackVersion,
    };
  });
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: "ACCEPTED_CURRENT" | "OUTDATED" | "PENDING") {
  if (status === "ACCEPTED_CURRENT") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "OUTDATED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function statusLabel(status: "ACCEPTED_CURRENT" | "OUTDATED" | "PENDING") {
  if (status === "ACCEPTED_CURRENT") return "Aceptado vigente";
  if (status === "OUTDATED") return "Pendiente nueva versión";
  return "Pendiente";
}

function badgeClass(method?: string | null) {
  const m = String(method ?? "").toUpperCase();

  if (m === "DIGITAL") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (m === "PRESENTIAL") return "border-blue-200 bg-blue-50 text-blue-700";
  if (m === "ADMIN_OVERRIDE") return "border-amber-200 bg-amber-50 text-amber-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StoreLegalAuditModal({
  store,
  onClose,
}: {
  store: AdminStoreListItem;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StoreLegalResponse | null>(null);
  const [currentDocs, setCurrentDocs] = useState<LegalDocumentVersion[]>([]);

async function load() {
  setLoading(true);
  setError(null);

  try {
    const [storeRes, docsRes] = await Promise.all([
      apiFetch<StoreLegalResponse>(
        `/legal/admin/stores/${store.id}/acceptances`
      ),
      apiFetch<{
        ok: boolean;
        documents: LegalDocumentVersion[];
        byType?: Record<string, LegalDocumentVersion>;
      }>("/legal/documents/current"),
    ]);

    setData(storeRes);
    setCurrentDocs(Array.isArray(docsRes?.documents) ? docsRes.documents : []);
  } catch (e: any) {
    setError(e?.message || "No se pudo cargar auditoría legal de la tienda.");
    setData(null);
    setCurrentDocs([]);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  const latestByType = useMemo(() => {
    const map = new Map<string, LegalAcceptance>();

    for (const item of data?.acceptances ?? []) {
      const key = String(item.documentType);
      const prev = map.get(key);

      if (!prev || new Date(item.acceptedAt).getTime() > new Date(prev.acceptedAt).getTime()) {
        map.set(key, item);
      }
    }

    return map;
  }, [data]);

  const storeLegalDocs = useMemo(() => {
  return buildStoreLegalDocs(currentDocs);
}, [currentDocs]);

  const currentByType = useMemo(() => {
    const map = new Map<string, LegalAcceptance>();

    for (const doc of storeLegalDocs) {
      const found = (data?.acceptances ?? [])
        .filter((item) => item.documentType === doc.type && item.version === doc.currentVersion)
        .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())[0];

      if (found) map.set(doc.type, found);
    }

    return map;
  }, [data, storeLegalDocs]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">KroniX Legal Audit</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              Auditoría legal de tienda
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {store.name} · {store.storeCode}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="bg-slate-50 px-6 py-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Cargando aceptaciones legales...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Usuario STORE asociado
                </div>

                <div className="mt-3 text-sm text-slate-700">
                  {data?.user ? (
                    <>
                      <b>{data.user.name}</b> · {data.user.phone}
                      {data.user.email ? ` · ${data.user.email}` : ""}
                    </>
                  ) : (
                    <span className="text-amber-700">
                      Esta tienda no tiene usuario STORE asociado.
                    </span>
                  )}
                </div>

                {data?.message ? (
                  <div className="mt-2 text-xs text-amber-700">{data.message}</div>
                ) : null}
              </div>

              {storeLegalDocs.map((doc) => {
                const currentAcceptance = currentByType.get(doc.type) ?? null;
                const latestAcceptance = latestByType.get(doc.type) ?? null;

                const status: "ACCEPTED_CURRENT" | "OUTDATED" | "PENDING" =
                  currentAcceptance ? "ACCEPTED_CURRENT" : latestAcceptance ? "OUTDATED" : "PENDING";

                const displayAcceptance = currentAcceptance ?? latestAcceptance ?? null;

                return (
                  <div
                    key={doc.type}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-slate-100 bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {doc.label}
                          </div>
                          <div className="mt-1 text-xs font-mono text-slate-500">
                            {doc.type}
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Estado actual
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Estado</span>
                            <span className="font-semibold text-slate-900">
                              {statusLabel(status)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Versión vigente</span>
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {doc.currentVersion}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Última aceptada</span>
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {latestAcceptance?.version ?? "—"}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Fecha / hora</span>
                            <span className="font-semibold text-slate-900">
                              {fmtDate(displayAcceptance?.acceptedAt)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Fuente</span>
                            <span className="font-semibold text-slate-900">
                              {displayAcceptance?.source ?? "—"}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Método</span>
                            <span className="font-semibold text-slate-900">
                              {displayAcceptance?.acceptanceMethod ?? "—"}
                            </span>
                          </div>

                          {displayAcceptance ? (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(displayAcceptance.acceptanceMethod)}`}
                            >
                              {displayAcceptance.acceptanceMethod || displayAcceptance.source}
                            </span>
                          ) : null}

                          <div>
                            <div className="text-xs text-slate-500">IP</div>
                            <div className="mt-1 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700">
                              {displayAcceptance?.ipAddress ?? "—"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-slate-500">User Agent</div>
                            <div className="mt-1 max-h-20 overflow-y-auto break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700">
                              {displayAcceptance?.userAgent ?? "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Resumen legal
                        </div>

                        <div className="text-sm leading-6 text-slate-600">
                          Esta sección audita aceptación digital o manual para documentos legales de tiendas.
                          Más adelante podemos habilitar corrección manual desde CTCC igual que conductores.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalStoresTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StoreStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedStore, setSelectedStore] = useState<AdminStoreListItem | null>(null);

  const debounceRef = useRef<number | null>(null);
  const [appliedQ, setAppliedQ] = useState("");

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      setAppliedQ(q);
      setPage(1);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await adminListStores({
        q: appliedQ.trim(),
        status,
        citySlug: effectiveCitySlug,
        page,
        limit,
      });

      setItems(Array.isArray(res.items) ? res.items : []);
      setTotal(Number(res.total || 0));
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar auditoría legal de tiendas.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, status, effectiveCitySlug, page, limit]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const activeCount = items.filter((s) => s.isActive && !s.isPaused).length;
  const pausedCount = items.filter((s) => s.isActive && s.isPaused).length;
  const inactiveCount = items.filter((s) => !s.isActive).length;

  return (
    <>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">KroniX Legal Center</div>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Legal Tiendas
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Auditoría legal de comercios: Términos, Política de Privacidad y Consentimientos Operativos.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
              {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
              Total: <b>{total}</b>
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Activas: <b>{activeCount}</b>
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
              Pausadas: <b>{pausedCount}</b>
            </span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">
              Inactivas: <b>{inactiveCount}</b>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="text-xs font-medium text-slate-600">Buscar</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Nombre, código, categoría..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-slate-600">Ciudad</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                value={isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                disabled
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-600">Estado</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as StoreStatusFilter);
                }}
              >
                <option value="ALL">Todas</option>
                <option value="ACTIVE">Activas</option>
                <option value="PAUSED">Pausadas</option>
                <option value="INACTIVE">Inactivas</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-600">Por página</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
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
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={loadStores}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">
              Tiendas para auditoría legal
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Abre una tienda para revisar aceptaciones legales de su usuario STORE.
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Tienda</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Auditoría</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{store.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {store.storeCode} · {store.id}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {store.city ? `${store.city.name}, ${store.city.department}` : "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">{store.category}</td>

                    <td className="px-4 py-4">
                      {!store.isActive ? (
                        <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                          Inactiva
                        </span>
                      ) : store.isPaused ? (
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                          Pausada
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                          Activa
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedStore(store)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Ver auditoría legal
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      No hay tiendas para los filtros actuales.
                    </td>
                  </tr>
                ) : null}

                {loading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      Cargando tiendas...
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={page <= 1}
              >
                Anterior
              </button>

              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={items.length < limit}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedStore ? (
        <StoreLegalAuditModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
        />
      ) : null}
    </>
  );
}