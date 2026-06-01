//app\(cc)\legal\components\LegalBuyersTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../../components/CtccCityContext";

type BuyerListItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  createdAt?: string;
  city?: {
    id: string;
    slug?: string | null;
    name?: string | null;
    department?: string | null;
    country?: string | null;
  } | null;
};

type BuyerListResponse = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;

  summary?: {
    totalClients: number;
    legalCurrent: number;
    pending: number;
    outdated: number;
  };

  items: BuyerListItem[];
};

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
  acceptedByAdminId?: string | null;
  adminNotes?: string | null;
  manualReason?: string | null;
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

const BUYER_LEGAL_DOC_FALLBACKS = [
  {
    type: "BUYER_TERMS",
    label: "Términos y Condiciones",
    fallbackVersion: "buyer-terms-v1-2026-05",
  },
  {
    type: "BUYER_PRIVACY",
    label: "Política de Privacidad",
    fallbackVersion: "buyer-privacy-v1-2026-05",
  },
];

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
  if (status === "ACCEPTED_CURRENT") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "OUTDATED") return "border-amber-200 bg-amber-50 text-amber-700";
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

function buildBuyerLegalDocs(currentDocs: LegalDocumentVersion[]) {
  return BUYER_LEGAL_DOC_FALLBACKS.map((item) => {
    const current = currentDocs.find((doc) => doc.documentType === item.type);

    return {
      type: item.type,
      label: current?.title || item.label,
      currentVersion: current?.version || item.fallbackVersion,
    };
  });
}

function getBuyerName(buyer: BuyerListItem) {
  return buyer.name || buyer.phone || buyer.email || buyer.id;
}

function getCityLabel(buyer: BuyerListItem) {
  const city = buyer.city;
  if (!city) return "—";
  if (city.name && city.department) return `${city.name}, ${city.department}`;
  return city.name || city.slug || "—";
}

function BuyerLegalAuditModal({
  buyer,
  onClose,
}: {
  buyer: BuyerListItem;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
  const [currentDocs, setCurrentDocs] = useState<LegalDocumentVersion[]>([]);

  const buyerLegalDocs = useMemo(() => buildBuyerLegalDocs(currentDocs), [currentDocs]);

  const [form, setForm] = useState<
    Record<
      string,
      {
        version: string;
        acceptanceMethod: "PRESENTIAL" | "ADMIN_OVERRIDE";
        manualReason: string;
        adminNotes: string;
      }
    >
  >({});

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [legalRes, docsRes] = await Promise.all([
        apiFetch<any>(`/legal/admin/users/${buyer.id}/acceptances`),
        apiFetch<{
          ok: boolean;
          documents: LegalDocumentVersion[];
          byType?: Record<string, LegalDocumentVersion>;
        }>("/legal/documents/current"),
      ]);

      const docs = Array.isArray(docsRes?.documents) ? docsRes.documents : [];
      const builtDocs = buildBuyerLegalDocs(docs);

      const initial: Record<string, any> = {};
      for (const doc of builtDocs) {
        initial[doc.type] = {
          version: doc.currentVersion,
          acceptanceMethod: "PRESENTIAL",
          manualReason: "",
          adminNotes: "",
        };
      }

      setAcceptances(Array.isArray(legalRes?.acceptances) ? legalRes.acceptances : []);
      setCurrentDocs(docs);
      setForm(initial);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar auditoría legal del cliente.");
      setAcceptances([]);
      setCurrentDocs([]);
      setForm({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [buyer.id]);

  const latestByType = useMemo(() => {
    const map = new Map<string, LegalAcceptance>();

    for (const item of acceptances) {
      const key = String(item.documentType);
      const prev = map.get(key);

      if (!prev || new Date(item.acceptedAt).getTime() > new Date(prev.acceptedAt).getTime()) {
        map.set(key, item);
      }
    }

    return map;
  }, [acceptances]);

  const currentByType = useMemo(() => {
    const map = new Map<string, LegalAcceptance>();

    for (const doc of buyerLegalDocs) {
      const found = acceptances
        .filter((item) => item.documentType === doc.type && item.version === doc.currentVersion)
        .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())[0];

      if (found) map.set(doc.type, found);
    }

    return map;
  }, [acceptances, buyerLegalDocs]);

  async function saveManual(documentType: string) {
    const current = form[documentType];
    if (!current) return;

    if (!current.version.trim()) {
      setError("La versión es obligatoria.");
      return;
    }

    if (current.acceptanceMethod === "ADMIN_OVERRIDE" && current.manualReason.trim().length < 5) {
      setError("Para ADMIN_OVERRIDE debes escribir una razón clara.");
      return;
    }

    setSavingType(documentType);
    setError(null);

    try {
      await apiFetch(`/legal/admin/users/${buyer.id}/acceptances/manual`, {
        method: "POST",
        body: JSON.stringify({
          documentType,
          version: current.version.trim(),
          acceptanceMethod: current.acceptanceMethod,
          manualReason: current.manualReason.trim() || null,
          adminNotes: current.adminNotes.trim() || null,
          cityId: buyer.city?.id || null,
        }),
      });

      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar aceptación legal.");
    } finally {
      setSavingType(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">KroniX Legal Audit</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              Auditoría legal de cliente
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {getBuyerName(buyer)} · {buyer.id}
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
              {buyerLegalDocs.map((doc) => {
                const currentForm = form[doc.type];
                const currentAcceptance = currentByType.get(doc.type) ?? null;
                const latestAcceptance = latestByType.get(doc.type) ?? null;

                const status: "ACCEPTED_CURRENT" | "OUTDATED" | "PENDING" =
                  currentAcceptance ? "ACCEPTED_CURRENT" : latestAcceptance ? "OUTDATED" : "PENDING";

                const displayAcceptance = currentAcceptance ?? latestAcceptance ?? null;

                return (
                  <div key={doc.type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{doc.label}</div>
                          <div className="mt-1 text-xs font-mono text-slate-500">{doc.type}</div>
                        </div>

                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
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
                            <span className="font-semibold text-slate-900">{statusLabel(status)}</span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Versión vigente</span>
                            <span className="font-mono text-xs font-semibold text-slate-900">{doc.currentVersion}</span>
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
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(displayAcceptance.acceptanceMethod)}`}>
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

                          {displayAcceptance?.manualReason ? (
                            <div>
                              <div className="text-xs text-slate-500">Razón manual</div>
                              <div className="mt-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-700">
                                {displayAcceptance.manualReason}
                              </div>
                            </div>
                          ) : null}

                          {displayAcceptance?.adminNotes ? (
                            <div>
                              <div className="text-xs text-slate-500">Observaciones admin</div>
                              <div className="mt-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-700">
                                {displayAcceptance.adminNotes}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Registro manual / corrección auditada
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <label className="text-[11px] text-slate-500">Versión a registrar</label>
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm?.version ?? doc.currentVersion}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...(prev[doc.type] ?? {
                                      acceptanceMethod: "PRESENTIAL",
                                      manualReason: "",
                                      adminNotes: "",
                                    }),
                                    version: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500">Método</label>
                            <select
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm?.acceptanceMethod ?? "PRESENTIAL"}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...(prev[doc.type] ?? {
                                      version: doc.currentVersion,
                                      manualReason: "",
                                      adminNotes: "",
                                    }),
                                    acceptanceMethod: e.target.value as "PRESENTIAL" | "ADMIN_OVERRIDE",
                                  },
                                }))
                              }
                            >
                              <option value="PRESENTIAL">Presencial</option>
                              <option value="ADMIN_OVERRIDE">Corrección admin</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500">Razón</label>
                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm?.manualReason ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...(prev[doc.type] ?? {
                                      version: doc.currentVersion,
                                      acceptanceMethod: "PRESENTIAL",
                                      adminNotes: "",
                                    }),
                                    manualReason: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Ej: aceptación presencial o corrección auditada"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500">Observaciones</label>
                            <textarea
                              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm?.adminNotes ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...(prev[doc.type] ?? {
                                      version: doc.currentVersion,
                                      acceptanceMethod: "PRESENTIAL",
                                      manualReason: "",
                                    }),
                                    adminNotes: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Notas internas para auditoría legal."
                            />
                          </div>

                          <button
                            onClick={() => saveManual(doc.type)}
                            disabled={savingType === doc.type}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {savingType === doc.type ? "Guardando..." : "Guardar registro legal"}
                          </button>
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
  tone?: "slate" | "emerald" | "amber" | "blue" | "rose";
  hint?: string;
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-100 to-white"
      : tone === "amber"
        ? "from-amber-100 to-white"
        : tone === "blue"
          ? "from-blue-100 to-white"
          : tone === "rose"
            ? "from-rose-100 to-white"
            : "from-slate-100 to-white";

  const valueTone =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "blue"
          ? "text-blue-700"
          : tone === "rose"
            ? "text-rose-700"
            : "text-slate-900";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b ${glow}`} />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className={`mt-3 text-3xl font-semibold ${valueTone}`}>{value}</div>
        {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function LegalBuyersTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BuyerListResponse | null>(null);

  const [selectedBuyer, setSelectedBuyer] = useState<BuyerListItem | null>(null);

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

  const loadBuyers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();

      if (appliedQ.trim()) qs.set("q", appliedQ.trim());
      if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);

      qs.set("page", String(page));
      qs.set("limit", String(limit));

      const res = await apiFetch<BuyerListResponse>(
        `/users/admin/buyers?${qs.toString()}`
      );

      setData(res);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar auditoría legal de clientes.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, effectiveCitySlug, page, limit]);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  const items = data?.items ?? [];
 const totalBuyers = data?.total ?? 0;
const visibleBuyers = items.length;
const buyersWithContact = items.filter(
  (b) => !!b.phone || !!b.email
).length;

const buyersWithoutContact = totalBuyers - buyersWithContact;

  return (
    <>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-12">
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
    <SectionHeader
      title="Auditoría legal de clientes"
      subtitle="Consulta clientes Buyer, documentos vigentes, aceptaciones digitales y registros manuales auditados."
    />

    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {isGlobalCityLocked ? `Ciudad activa: ${cityLabel}` : "Vista global: todas las ciudades"}
        </div>

        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          Centro legal unificado
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs text-slate-500">
      Total clientes
    </div>

    <div className="mt-1 text-2xl font-bold text-slate-900">
      {data?.summary?.totalClients ?? 0}
    </div>
  </div>

  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
    <div className="text-xs text-emerald-700">
      Legal vigente
    </div>

    <div className="mt-1 text-2xl font-bold text-emerald-700">
      {data?.summary?.legalCurrent ?? 0}
    </div>
  </div>

  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
    <div className="text-xs text-rose-700">
      Pendientes
    </div>

    <div className="mt-1 text-2xl font-bold text-rose-700">
      {data?.summary?.pending ?? 0}
    </div>
  </div>

  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
    <div className="text-xs text-amber-700">
      Nueva versión pendiente
    </div>

    <div className="mt-1 text-2xl font-bold text-amber-700">
      {data?.summary?.outdated ?? 0}
    </div>
  </div>
</div>
    </div>
  </div>

  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-4">
    <SectionHeader
      title="Estado del módulo"
      subtitle="Auditoría legal Buyer conectada a Legal Center."
    />

    <div className="space-y-3 p-4 text-sm">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Ciudad</span>
          <span className="font-semibold text-slate-900">
            {isGlobalCityLocked ? cityLabel : "Todas"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Búsqueda</span>
          <span className="max-w-[220px] truncate text-right font-semibold text-slate-900">
            {q.trim() || "Sin filtro"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600">Documentos</span>
          <span className="font-semibold text-slate-900">Buyer Terms / Privacy</span>
        </div>
      </div>
    </div>
  </div>
</div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <label className="text-xs font-medium text-slate-600">Buscar</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Nombre, teléfono, email o userId..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="lg:col-span-4">
              <label className="text-xs font-medium text-slate-600">Ciudad</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                value={isGlobalCityLocked ? cityLabel : "Todas las ciudades"}
                disabled
              />
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
              onClick={loadBuyers}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">
              Clientes para auditoría legal
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Abre un cliente para revisar sus aceptaciones legales.
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Auditoría</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {getBuyerName(buyer)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{buyer.id}</div>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {buyer.phone || buyer.email || "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {getCityLabel(buyer)}
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {fmtDate(buyer.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedBuyer(buyer)}
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
                      No hay clientes para los filtros actuales.
                    </td>
                  </tr>
                ) : null}

                {loading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      Cargando clientes...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">
              Página {data?.page ?? page} · {data?.limit ?? limit} por página
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

      {selectedBuyer ? (
        <BuyerLegalAuditModal
          buyer={selectedBuyer}
          onClose={() => setSelectedBuyer(null)}
        />
      ) : null}
    </>
  );
}