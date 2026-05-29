//app\(cc)\legal\components\LegalDocumentsTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type LegalDocument = {
  id: string;
  documentType: string;
  version: string;
  title: string;
  description?: string | null;
  content?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const DOCUMENT_TYPES = [
  { value: "DRIVER_TERMS", label: "Términos Drivers" },
  { value: "DRIVER_PRIVACY", label: "Privacy Drivers" },
  { value: "DRIVER_INDEPENDENCE_AGREEMENT", label: "Independence Agreement" },
  { value: "DRIVER_OPERATIONAL_SECURITY_MANUAL", label: "Operational Security" },
  { value: "DRIVER_ANTI_FRAUD_POLICY", label: "Anti Fraud Policy" },
  { value: "STORE_TERMS", label: "Terms Store" },
  { value: "STORE_PRIVACY", label: "Privacy Store" },
  { value: "STORE_OPERATIONAL_CONSENT", label: "Operational Consent Store" },
  { value: "BUYER_TERMS", label: "Terms Buyer" },
  { value: "BUYER_PRIVACY", label: "Privacy Buyer" },
];

function labelForType(type: string) {
  return DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type;
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

export default function LegalDocumentsTab() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState("STORE_TERMS");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ ok: boolean; documents: LegalDocument[] }>(
        "/legal/admin/documents"
      );

      setDocuments(Array.isArray(res.documents) ? res.documents : []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los documentos legales.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const activeByType = useMemo(() => {
    const map = new Map<string, LegalDocument>();

    for (const doc of documents) {
      if (doc.isActive) {
        map.set(doc.documentType, doc);
      }
    }

    return map;
  }, [documents]);

  async function createDocument() {
    if (!documentType || !version.trim() || !title.trim()) {
      setError("Documento, versión y título son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch<{ ok: boolean; document?: LegalDocument; message?: string }>(
        "/legal/admin/documents",
        {
          method: "POST",
          body: JSON.stringify({
            documentType,
            version: version.trim(),
            title: title.trim(),
            description: description.trim() || null,
            content: content.trim() || null,
            isActive,
          }),
        }
      );

      if (!res.ok) {
        setError(res.message || "No se pudo crear la versión legal.");
        return;
      }

      setVersion("");
      setTitle("");
      setDescription("");
      setContent("");
      setIsActive(true);

      await loadDocuments();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la versión legal.");
    } finally {
      setSaving(false);
    }
  }

  async function activateDocument(id: string) {
    setActivatingId(id);
    setError(null);

    try {
      const res = await apiFetch<{ ok: boolean; message?: string }>(
        `/legal/admin/documents/${id}/activate`,
        {
          method: "PATCH",
        }
      );

      if (!res.ok) {
        setError(res.message || "No se pudo activar el documento.");
        return;
      }

      await loadDocuments();
    } catch (e: any) {
      setError(e?.message || "No se pudo activar el documento.");
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-500">KroniX Legal Center</div>

        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Documentos legales
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Administra versiones legales vigentes para conductores, tiendas y clientes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          Crear nueva versión
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="text-xs font-medium text-slate-600">Documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              {DOCUMENT_TYPES.map((doc) => (
                <option key={doc.value} value={doc.value}>
                  {doc.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-slate-600">Versión</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="store-terms-v1-2026-05"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="lg:col-span-5">
            <label className="text-xs font-medium text-slate-600">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Términos y Condiciones para Comercios"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="lg:col-span-12">
            <label className="text-xs font-medium text-slate-600">Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Versión inicial del documento legal."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="lg:col-span-12">
            <label className="text-xs font-medium text-slate-600">Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Contenido legal completo o temporal..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 lg:col-span-12">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Activar esta versión como vigente
            </label>
          </div>

          <div className="flex justify-end lg:col-span-12">
            <button
              onClick={createDocument}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Crear versión"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            Versiones legales
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Solo una versión puede estar activa por cada tipo de documento.
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Versión</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {labelForType(doc.documentType)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {doc.documentType}
                    </div>
                  </td>

                  <td className="px-4 py-4 font-mono text-xs text-slate-700">
                    {doc.version}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{doc.title}</div>
                    <div className="mt-1 max-w-xl truncate text-xs text-slate-500">
                      {doc.description || "Sin descripción"}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {doc.isActive ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Vigente
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Histórica
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    {fmtDate(doc.updatedAt)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    {!doc.isActive ? (
                      <button
                        onClick={() => activateDocument(doc.id)}
                        disabled={activatingId === doc.id}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                      >
                        {activatingId === doc.id ? "Activando..." : "Activar"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Activa
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No hay documentos legales creados todavía.
                  </td>
                </tr>
              ) : null}

              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Cargando documentos...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          Versiones vigentes actuales
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DOCUMENT_TYPES.map((doc) => {
            const active = activeByType.get(doc.value);

            return (
              <div
                key={doc.value}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {doc.label}
                </div>

                <div className="mt-1 font-mono text-xs text-slate-500">
                  {doc.value}
                </div>

                <div className="mt-3 text-sm">
                  {active ? (
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      {active.version}
                    </span>
                  ) : (
                    <span className="text-xs text-rose-700">
                      Sin versión vigente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}