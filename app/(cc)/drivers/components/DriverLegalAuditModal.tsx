//app\(cc)\drivers\components\DriverLegalAuditModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

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

type DriverTrainingAttempt = {
  id: string;
  userId: string;
  trainingType: string;
  version: string;
  scorePercent: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
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

type LegalDocConfig = {
  type: string;
  label: string;
  trainingType?: string;
};

const DRIVER_LEGAL_DOCS: LegalDocConfig[] = [
  { type: "DRIVER_TERMS", label: "Términos y Condiciones" },
  { type: "DRIVER_PRIVACY", label: "Política de Privacidad" },
  { type: "DRIVER_INDEPENDENCE_AGREEMENT", label: "Acuerdo de Independencia" },
  {
    type: "DRIVER_OPERATIONAL_SECURITY_MANUAL",
    label: "Manual Operativo y Seguridad",
    trainingType: "OPERATIONAL_SECURITY",
  },
  {
    type: "DRIVER_ANTI_FRAUD_POLICY",
    label: "Política Antifraude",
    trainingType: "ANTI_FRAUD",
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

function badgeClass(method?: string | null) {
  const m = String(method ?? "").toUpperCase();

  if (m === "DIGITAL") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (m === "PRESENTIAL") return "border-blue-200 bg-blue-50 text-blue-700";
  if (m === "ADMIN_OVERRIDE") return "border-amber-200 bg-amber-50 text-amber-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
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

export default function DriverLegalAuditModal({
  driverId,
  driverName,
  onClose,
}: {
  driverId: string;
  driverName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
  const [trainingAttempts, setTrainingAttempts] = useState<DriverTrainingAttempt[]>([]);
  const [documentsByType, setDocumentsByType] = useState<Record<string, LegalDocumentVersion>>({});

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

  const legalDocs = useMemo(() => {
    return DRIVER_LEGAL_DOCS.map((doc) => {
      const currentDoc = documentsByType[doc.type] ?? null;

      return {
        ...doc,
        title: currentDoc?.title || doc.label,
        currentVersion: currentDoc?.version || "",
        updatedAt: currentDoc?.updatedAt || currentDoc?.createdAt || null,
      };
    });
  }, [documentsByType]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [docsRes, legalRes, trainingRes] = await Promise.all([
        apiFetch<any>("/legal/documents/current"),
        apiFetch<any>(`/legal/admin/users/${driverId}/acceptances`),
        apiFetch<any>(`/legal/admin/users/${driverId}/training-attempts`),
      ]);

      const byType =
        docsRes?.byType && typeof docsRes.byType === "object"
          ? docsRes.byType
          : {};

      setDocumentsByType(byType);
      setAcceptances(Array.isArray(legalRes?.acceptances) ? legalRes.acceptances : []);
      setTrainingAttempts(Array.isArray(trainingRes?.attempts) ? trainingRes.attempts : []);

      setForm((prev) => {
        const next: typeof prev = { ...prev };

        for (const doc of DRIVER_LEGAL_DOCS) {
          const currentVersion = byType?.[doc.type]?.version || "";

          next[doc.type] = {
            version: next[doc.type]?.version || currentVersion,
            acceptanceMethod: next[doc.type]?.acceptanceMethod || "PRESENTIAL",
            manualReason: next[doc.type]?.manualReason || "",
            adminNotes: next[doc.type]?.adminNotes || "",
          };

          if (!next[doc.type].version && currentVersion) {
            next[doc.type].version = currentVersion;
          }
        }

        return next;
      });
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar aceptaciones legales.");
      setAcceptances([]);
      setTrainingAttempts([]);
      setDocumentsByType({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

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

    for (const doc of legalDocs) {
      if (!doc.currentVersion) continue;

      const found = acceptances
        .filter((item) => item.documentType === doc.type && item.version === doc.currentVersion)
        .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())[0];

      if (found) map.set(doc.type, found);
    }

    return map;
  }, [acceptances, legalDocs]);

  const latestTrainingByType = useMemo(() => {
    const map = new Map<string, DriverTrainingAttempt>();

    for (const attempt of trainingAttempts) {
      const key = String(attempt.trainingType);
      const prev = map.get(key);

      if (!prev || new Date(attempt.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
        map.set(key, attempt);
      }
    }

    return map;
  }, [trainingAttempts]);

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
      await apiFetch(`/legal/admin/users/${driverId}/acceptances/manual`, {
        method: "POST",
        body: JSON.stringify({
          documentType,
          version: current.version.trim(),
          acceptanceMethod: current.acceptanceMethod,
          manualReason: current.manualReason.trim() || null,
          adminNotes: current.adminNotes.trim() || null,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">KroniX Legal Audit</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              Aceptaciones legales del conductor
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {driverName} · {driverId}
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
              {legalDocs.map((doc) => {
                const currentForm = form[doc.type] || {
                  version: doc.currentVersion || "",
                  acceptanceMethod: "PRESENTIAL" as const,
                  manualReason: "",
                  adminNotes: "",
                };

                const currentAcceptance = currentByType.get(doc.type) ?? null;
                const latestAcceptance = latestByType.get(doc.type) ?? null;

                const status: "ACCEPTED_CURRENT" | "OUTDATED" | "PENDING" =
                  currentAcceptance ? "ACCEPTED_CURRENT" : latestAcceptance ? "OUTDATED" : "PENDING";

                const displayAcceptance = currentAcceptance ?? latestAcceptance ?? null;
                const trainingAttempt = doc.trainingType
                  ? latestTrainingByType.get(doc.trainingType) ?? null
                  : null;

                return (
                  <div
                    key={doc.type}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-slate-100 bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {doc.title}
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
                              {doc.currentVersion || "Sin versión activa"}
                            </span>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-500">Actualizado</span>
                            <span className="font-semibold text-slate-900">
                              {fmtDate(doc.updatedAt)}
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

                          {doc.trainingType ? (
                            <>
                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Quiz</span>
                                <span
                                  className={
                                    trainingAttempt?.passed
                                      ? "font-semibold text-emerald-700"
                                      : "font-semibold text-amber-700"
                                  }
                                >
                                  {trainingAttempt?.passed ? "Aprobado" : "Pendiente"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Puntaje</span>
                                <span className="font-semibold text-slate-900">
                                  {trainingAttempt
                                    ? `${trainingAttempt.scorePercent}% (${trainingAttempt.correctAnswers}/${trainingAttempt.totalQuestions})`
                                    : "—"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Último intento</span>
                                <span className="font-semibold text-slate-900">
                                  {fmtDate(trainingAttempt?.createdAt)}
                                </span>
                              </div>
                            </>
                          ) : null}

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
                            <label className="text-[11px] text-slate-500">
                              Versión a registrar
                            </label>

                            <input
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm.version}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...currentForm,
                                    version: e.target.value,
                                  },
                                }))
                              }
                            />

                            <div className="mt-1 text-[11px] text-slate-500">
                              Debe coincidir con la versión vigente si estás registrando aceptación actual.
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500">Método</label>

                            <select
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm.acceptanceMethod}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...currentForm,
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
                              value={currentForm.manualReason}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...currentForm,
                                    manualReason: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Ej: aceptación presencial durante capacitación"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500">Observaciones</label>

                            <textarea
                              className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              value={currentForm.adminNotes}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  [doc.type]: {
                                    ...currentForm,
                                    adminNotes: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Notas internas para auditoría legal."
                            />
                          </div>

                          <button
                            onClick={() => saveManual(doc.type)}
                            disabled={savingType === doc.type || !currentForm.version.trim()}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {savingType === doc.type ? "Guardando..." : "Guardar registro legal"}
                          </button>

                          <div className="text-[11px] leading-relaxed text-slate-500">
                            Este registro queda ligado al conductor y debe usarse solo para aceptación presencial
                            o corrección auditada por falla técnica. Si existe una nueva versión vigente y el
                            conductor solo aceptó una anterior, CTCC lo mostrará como pendiente de nueva versión.
                          </div>
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