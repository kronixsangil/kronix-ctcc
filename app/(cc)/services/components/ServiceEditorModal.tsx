"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DynamicServiceDefinition,
  DynamicServiceStatus,
  DynamicServiceWriteInput,
} from "../lib/servicesApi";

type EditorMode = "create" | "edit" | "duplicate";
type TabKey = "identity" | "request" | "worker" | "tracking" | "advanced";

type Props = {
  open: boolean;
  mode: EditorMode;
  source: DynamicServiceDefinition | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    input: DynamicServiceWriteInput & { serviceKey?: string }
  ) => Promise<void> | void;
};

type Draft = {
  serviceKey: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  workerTypeKey: string;
  workerLabel: string;
  workerPluralLabel: string;
  icon: string;
  assetSlug: string;
  buyerPath: string;
  cardImageLeft: string;
  cardImageRight: string;
  primaryColor: string;
  accentColor: string;
  status: DynamicServiceStatus;
  version: number;
  workerCommissionCOP: number;
  isActive: boolean;
  sortOrder: number;
  requestSchema: Record<string, any>;
  workerFlowSchema: Record<string, any>;
  trackingSchema: Record<string, any>;
  cityOverrides: Record<string, any>;
};

const EMPTY_REQUEST_SCHEMA = {
  routeMode: "POINT_ONLY",
  packageType: "Servicio",
  allowSavedAddress: true,
  allowCurrentLocation: true,
  origin: {
    enabled: true,
    required: true,
    title: "Punto del servicio",
    addressLabel: "Dirección o ubicación de inicio",
    placeNameLabel: "Nombre del lugar",
    referenceLabel: "Referencia",
  },
  destination: {
    enabled: false,
    required: false,
    title: "Destino",
    addressLabel: "Dirección de destino",
    placeNameLabel: "Nombre del destino",
    referenceLabel: "Referencia",
  },
  contact: { enabled: true, required: true },
  note: {
    enabled: true,
    required: false,
    label: "Indicaciones",
    placeholder: "Describe lo que necesitas...",
    defaultValue: "",
  },
  submit: {
    buttonText: "Solicitar servicio",
    creatingText: "Creando solicitud...",
  },
  paymentMode: "DIRECT_TO_WORKER",
};

const EMPTY_WORKER_FLOW = {
  assigned: {
    headerTitle: "Dirígete al punto indicado",
    navigateText: "Navegar al punto",
    arrivedText: "Llegué al punto",
    readySingleText: "Ya puedes iniciar el servicio.",
    footerText: "Este servicio ya está reservado para ti.",
  },
  pickup: {
    headerTitle: "Confirma el inicio del servicio",
    actionText: "Iniciar servicio",
    modalTitle: "Confirmación",
    modalDescription: "Confirma que puedes iniciar el servicio.",
    footerText: "Al confirmar, el servicio pasará a En ruta.",
    checks: [
      {
        key: "service_ok",
        label: "Confirmo que puedo iniciar correctamente el servicio.",
        required: true,
      },
    ],
  },
  enRoute: {
    headerTitle: "Servicio en curso",
    destinationLabel: "Destino",
    navigateText: "Navegar al destino",
    showDestination: false,
    deliveredText: "Finalicé el servicio",
    footerText: "Confirmar finaliza el servicio.",
  },
  labels: {
    packageLabel: "Descripción del servicio",
    pickupPointTitle: "Punto del servicio",
  },
};

const EMPTY_TRACKING = {
  detailsTitle: "Detalles del servicio",
  pickupTitle: "Punto del servicio",
  requestEyebrow: "Servicio solicitado",
  notesLabel: "Indicaciones del servicio",
  flowSteps: [
    {
      key: "WAITING_CONFIRMATION",
      label: "Solicitud recibida",
      hint: "Estamos registrando tu solicitud",
    },
    {
      key: "STORE_CONFIRMED",
      label: "Servicio confirmado",
      hint: "Buscaremos un Worker disponible",
    },
    {
      key: "PAID",
      label: "Buscando Worker",
      hint: "Tu solicitud ya está disponible",
    },
    {
      key: "PREPARING",
      label: "Worker asignado",
      hint: "El Worker se dirige al punto indicado",
    },
    {
      key: "EN_ROUTE",
      label: "Servicio en curso",
      hint: "El servicio está en proceso",
    },
    {
      key: "DELIVERED",
      label: "Finalizado",
      hint: "Tu servicio fue completado",
    },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function emptyDraft(): Draft {
  return {
    serviceKey: "",
    slug: "",
    name: "",
    shortName: "",
    description: "",
    workerTypeKey: "MOTORCYCLE",
    workerLabel: "Worker",
    workerPluralLabel: "Workers",
    icon: "🛠️",
    assetSlug: "",
    buyerPath: "",
    cardImageLeft: "",
    cardImageRight: "",
    primaryColor: "#0F766E",
    accentColor: "#ECFDF5",
    status: "DRAFT",
    version: 1,
    workerCommissionCOP: 500,
    isActive: false,
    sortOrder: 100,
    requestSchema: clone(EMPTY_REQUEST_SCHEMA),
    workerFlowSchema: clone(EMPTY_WORKER_FLOW),
    trackingSchema: clone(EMPTY_TRACKING),
    cityOverrides: {},
  };
}

function draftFromSource(
  source: DynamicServiceDefinition,
  mode: EditorMode
): Draft {
  const duplicate = mode === "duplicate";
  return {
    serviceKey: duplicate ? "" : source.serviceKey,
    slug: duplicate ? "" : source.slug,
    name: duplicate ? `${source.name} copia` : source.name,
    shortName: source.shortName,
    description: source.description ?? "",
    workerTypeKey: source.workerTypeKey,
    workerLabel: source.workerLabel,
    workerPluralLabel: source.workerPluralLabel,
    icon: source.icon ?? "",
    assetSlug: source.assetSlug ?? "",
    buyerPath: duplicate ? "" : source.buyerPath ?? "",
    cardImageLeft: source.cardImageLeft ?? "",
    cardImageRight: source.cardImageRight ?? "",
    primaryColor: source.primaryColor || "#0F766E",
    accentColor: source.accentColor || "#ECFDF5",
    status: duplicate ? "DRAFT" : source.status,
    version: duplicate ? 1 : Math.max(1, Number(source.version || 1)),
    workerCommissionCOP: Math.max(
      0,
      Number(source.workerCommissionCOP || 0)
    ),
    isActive: duplicate ? false : Boolean(source.isActive),
    sortOrder: duplicate
      ? Math.max(0, Number(source.sortOrder || 100) + 10)
      : Number(source.sortOrder || 100),
    requestSchema: clone(source.requestSchema || EMPTY_REQUEST_SCHEMA),
    workerFlowSchema: clone(source.workerFlowSchema || EMPTY_WORKER_FLOW),
    trackingSchema: clone(source.trackingSchema || EMPTY_TRACKING),
    cityOverrides: clone(source.cityOverrides || {}),
  };
}

function slugify(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function keyify(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getPath(obj: Record<string, any>, path: string, fallback: any = "") {
  const value = path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
  return value ?? fallback;
}

function setPath(
  source: Record<string, any>,
  path: string,
  value: unknown
): Record<string, any> {
  const next = clone(source || {});
  const keys = path.split(".");
  let cursor = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    if (!cursor[key] || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });
  return next;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {hint ? (
        <span className="ml-2 text-[11px] normal-case tracking-normal text-slate-400">
          {hint}
        </span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100";
const textareaClass = `${inputClass} min-h-[92px] resize-y font-normal`;

export default function ServiceEditorModal({
  open,
  mode,
  source,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [tab, setTab] = useState<TabKey>("identity");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [advancedRequest, setAdvancedRequest] = useState("");
  const [advancedWorker, setAdvancedWorker] = useState("");
  const [advancedTracking, setAdvancedTracking] = useState("");

  useEffect(() => {
    if (!open) return;
    const next =
      source && mode !== "create"
        ? draftFromSource(source, mode)
        : emptyDraft();
    setDraft(next);
    setAdvancedRequest(JSON.stringify(next.requestSchema, null, 2));
    setAdvancedWorker(JSON.stringify(next.workerFlowSchema, null, 2));
    setAdvancedTracking(JSON.stringify(next.trackingSchema, null, 2));
    setTab("identity");
    setError(null);
  }, [open, mode, source]);

  const title =
    mode === "edit"
      ? `Editar ${source?.name ?? "servicio"}`
      : mode === "duplicate"
        ? `Duplicar ${source?.name ?? "servicio"}`
        : "Crear servicio";

  const requiredErrors = useMemo(() => {
    const out: string[] = [];
    if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(draft.serviceKey)) {
      out.push("El código debe usar MAYÚSCULAS, números o guion bajo.");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
      out.push("El slug debe usar minúsculas y guiones.");
    }
    if (!draft.name.trim()) out.push("El nombre es obligatorio.");
    if (!draft.shortName.trim()) out.push("El nombre corto es obligatorio.");
    if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(draft.workerTypeKey)) {
      out.push("El tipo de Worker no es válido.");
    }
    if (!draft.workerLabel.trim()) out.push("La etiqueta del Worker es obligatoria.");
    if (!draft.workerPluralLabel.trim()) {
      out.push("La etiqueta plural del Worker es obligatoria.");
    }
    return out;
  }, [draft]);

  if (!open) return null;

  function patch(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function patchRequest(path: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      requestSchema: setPath(current.requestSchema, path, value),
    }));
  }

  function patchWorker(path: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      workerFlowSchema: setPath(current.workerFlowSchema, path, value),
    }));
  }

  function patchTracking(path: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      trackingSchema: setPath(current.trackingSchema, path, value),
    }));
  }

  function syncAdvancedJson() {
    try {
      const requestSchema = JSON.parse(advancedRequest);
      const workerFlowSchema = JSON.parse(advancedWorker);
      const trackingSchema = JSON.parse(advancedTracking);

      if (
        !requestSchema ||
        typeof requestSchema !== "object" ||
        Array.isArray(requestSchema)
      ) {
        throw new Error("requestSchema debe ser un objeto JSON.");
      }
      if (
        !workerFlowSchema ||
        typeof workerFlowSchema !== "object" ||
        Array.isArray(workerFlowSchema)
      ) {
        throw new Error("workerFlowSchema debe ser un objeto JSON.");
      }
      if (
        !trackingSchema ||
        typeof trackingSchema !== "object" ||
        Array.isArray(trackingSchema)
      ) {
        throw new Error("trackingSchema debe ser un objeto JSON.");
      }

      patch({ requestSchema, workerFlowSchema, trackingSchema });
      setError(null);
      return true;
    } catch (e: any) {
      setError(e?.message || "Hay un JSON inválido.");
      return false;
    }
  }

  async function submit() {
    setError(null);

    if (requiredErrors.length) {
      setError(requiredErrors[0]);
      setTab("identity");
      return;
    }

    if (tab === "advanced" && !syncAdvancedJson()) return;

    const version =
      mode === "edit" && source
        ? Math.max(Number(source.version || 1) + 1, Number(draft.version || 1))
        : Math.max(1, Number(draft.version || 1));

    await onSave({
      ...(mode !== "edit" ? { serviceKey: draft.serviceKey } : {}),
      slug: draft.slug,
      name: draft.name.trim(),
      shortName: draft.shortName.trim(),
      description: draft.description.trim(),
      workerTypeKey: draft.workerTypeKey,
      workerLabel: draft.workerLabel.trim(),
      workerPluralLabel: draft.workerPluralLabel.trim(),
      icon: draft.icon.trim(),
      assetSlug: draft.assetSlug.trim(),
      buyerPath: draft.buyerPath.trim() || `/kronix/${draft.slug}`,
      cardImageLeft: draft.cardImageLeft.trim(),
      cardImageRight: draft.cardImageRight.trim(),
      primaryColor: draft.primaryColor,
      accentColor: draft.accentColor,
      status: draft.status,
      version,
      workerCommissionCOP: Math.max(
        0,
        Math.round(Number(draft.workerCommissionCOP || 0))
      ),
      isActive: Boolean(draft.isActive),
      sortOrder: Math.max(0, Math.round(Number(draft.sortOrder || 0))),
      requestSchema: draft.requestSchema,
      workerFlowSchema: draft.workerFlowSchema,
      trackingSchema: draft.trackingSchema,
      cityOverrides: draft.cityOverrides,
    });
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "identity", label: "Identidad" },
    { key: "request", label: "Formulario Buyer" },
    { key: "worker", label: "Flujo Worker" },
    { key: "tracking", label: "Tracking" },
    { key: "advanced", label: "JSON avanzado" },
  ];

  const request = draft.requestSchema;
  const worker = draft.workerFlowSchema;
  const tracking = draft.trackingSchema;
  const checks = Array.isArray(getPath(worker, "pickup.checks", []))
    ? getPath(worker, "pickup.checks", [])
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
          <div>
            <div className="text-xl font-black">{title}</div>
            <div className="mt-1 text-xs text-slate-300">
              Configuración global del servicio y operación para la ciudad seleccionada.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.key === "advanced") {
                  setAdvancedRequest(JSON.stringify(draft.requestSchema, null, 2));
                  setAdvancedWorker(JSON.stringify(draft.workerFlowSchema, null, 2));
                  setAdvancedTracking(JSON.stringify(draft.trackingSchema, null, 2));
                }
                setTab(item.key);
                setError(null);
              }}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-black transition",
                tab === item.key
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          {tab === "identity" ? (
            <div className="grid gap-5">
              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-base font-black text-slate-900">
                  Identidad y presentación
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Código interno" hint="No cambia al editar">
                    <input
                      value={draft.serviceKey}
                      disabled={mode === "edit"}
                      onChange={(e) =>
                        patch({ serviceKey: keyify(e.target.value) })
                      }
                      placeholder="PACKAGE"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Slug URL">
                    <input
                      value={draft.slug}
                      onChange={(e) => patch({ slug: slugify(e.target.value) })}
                      placeholder="kronix-envios"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Nombre">
                    <input
                      value={draft.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        patch({
                          name,
                          ...(mode !== "edit" && !draft.slug
                            ? { slug: slugify(name), serviceKey: keyify(name) }
                            : {}),
                        });
                      }}
                      placeholder="KroniX Envíos"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Nombre corto">
                    <input
                      value={draft.shortName}
                      onChange={(e) => patch({ shortName: e.target.value })}
                      placeholder="Envíos"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Icono">
                    <input
                      value={draft.icon}
                      onChange={(e) => patch({ icon: e.target.value })}
                      placeholder="📦"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Orden">
                    <input
                      type="number"
                      min={0}
                      value={draft.sortOrder}
                      onChange={(e) =>
                        patch({ sortOrder: Number(e.target.value || 0) })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Descripción">
                    <textarea
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      placeholder="Descripción visible en Buyer App."
                      className={textareaClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black text-slate-900">
                  Worker, comisión y publicación
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Tipo de Worker">
                    <input
                      value={draft.workerTypeKey}
                      onChange={(e) =>
                        patch({ workerTypeKey: keyify(e.target.value) })
                      }
                      placeholder="MOTORCYCLE"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Worker singular">
                    <input
                      value={draft.workerLabel}
                      onChange={(e) => patch({ workerLabel: e.target.value })}
                      placeholder="Domiciliario"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Worker plural">
                    <input
                      value={draft.workerPluralLabel}
                      onChange={(e) =>
                        patch({ workerPluralLabel: e.target.value })
                      }
                      placeholder="Domiciliarios"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Comisión KRONIX">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={draft.workerCommissionCOP}
                      onChange={(e) =>
                        patch({
                          workerCommissionCOP: Number(e.target.value || 0),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Estado global">
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        patch({
                          status: e.target.value as DynamicServiceStatus,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="PUBLISHED">Publicado</option>
                    </select>
                  </Field>

                  <Field label="Estado en esta ciudad">
                    <button
                      type="button"
                      onClick={() => patch({ isActive: !draft.isActive })}
                      className={[
                        inputClass,
                        "font-black",
                        draft.isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {draft.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </Field>

                  <Field label="Color principal">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draft.primaryColor}
                        onChange={(e) =>
                          patch({ primaryColor: e.target.value })
                        }
                        className="h-11 w-14 rounded-xl border border-slate-200 bg-white p-1"
                      />
                      <input
                        value={draft.primaryColor}
                        onChange={(e) =>
                          patch({ primaryColor: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </Field>

                  <Field label="Color suave">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draft.accentColor}
                        onChange={(e) =>
                          patch({ accentColor: e.target.value })
                        }
                        className="h-11 w-14 rounded-xl border border-slate-200 bg-white p-1"
                      />
                      <input
                        value={draft.accentColor}
                        onChange={(e) =>
                          patch({ accentColor: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black text-slate-900">
                  Rutas e imágenes
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Ruta Buyer">
                    <input
                      value={draft.buyerPath}
                      onChange={(e) => patch({ buyerPath: e.target.value })}
                      placeholder={`/kronix/${draft.slug || "slug"}`}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Carpeta de imágenes">
                    <input
                      value={draft.assetSlug}
                      onChange={(e) => patch({ assetSlug: e.target.value })}
                      placeholder="package"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Imagen izquierda">
                    <input
                      value={draft.cardImageLeft}
                      onChange={(e) =>
                        patch({ cardImageLeft: e.target.value })
                      }
                      placeholder="/services/package/cardizq.png"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Imagen derecha">
                    <input
                      value={draft.cardImageRight}
                      onChange={(e) =>
                        patch({ cardImageRight: e.target.value })
                      }
                      placeholder="/services/package/cardder.png"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "request" ? (
            <div className="grid gap-5">
              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-base font-black">Comportamiento general</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Modo de ruta">
                    <select
                      value={String(request.routeMode ?? "POINT_ONLY")}
                      onChange={(e) =>
                        patchRequest("routeMode", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="POINT_ONLY">Solo punto inicial</option>
                      <option value="ORIGIN_DESTINATION">
                        Origen y destino
                      </option>
                    </select>
                  </Field>
                  <Field label="Nombre interno del servicio">
                    <input
                      value={String(request.packageType ?? "")}
                      onChange={(e) =>
                        patchRequest("packageType", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Pago">
                    <select
                      value={String(
                        request.paymentMode ?? "DIRECT_TO_WORKER"
                      )}
                      onChange={(e) =>
                        patchRequest("paymentMode", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="DIRECT_TO_WORKER">
                        Directo al Worker
                      </option>
                      <option value="PLATFORM">En plataforma</option>
                    </select>
                  </Field>
                  <Field label="Direcciones guardadas">
                    <button
                      type="button"
                      onClick={() =>
                        patchRequest(
                          "allowSavedAddress",
                          !Boolean(request.allowSavedAddress)
                        )
                      }
                      className={inputClass}
                    >
                      {request.allowSavedAddress ? "Permitidas" : "No permitidas"}
                    </button>
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black">Punto inicial</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["origin.title", "Título"],
                    ["origin.addressLabel", "Etiqueta dirección"],
                    ["origin.placeNameLabel", "Etiqueta lugar"],
                    ["origin.referenceLabel", "Etiqueta referencia"],
                  ].map(([path, label]) => (
                    <Field key={path} label={label}>
                      <input
                        value={String(getPath(request, path, ""))}
                        onChange={(e) => patchRequest(path, e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  ))}
                  <Field label="Obligatorio">
                    <button
                      type="button"
                      onClick={() =>
                        patchRequest(
                          "origin.required",
                          !Boolean(getPath(request, "origin.required", true))
                        )
                      }
                      className={inputClass}
                    >
                      {getPath(request, "origin.required", true)
                        ? "Sí"
                        : "No"}
                    </button>
                  </Field>
                  <Field label="Ubicación actual">
                    <button
                      type="button"
                      onClick={() =>
                        patchRequest(
                          "allowCurrentLocation",
                          !Boolean(request.allowCurrentLocation)
                        )
                      }
                      className={inputClass}
                    >
                      {request.allowCurrentLocation ? "Permitida" : "No permitida"}
                    </button>
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-base font-black">Destino</div>
                  <button
                    type="button"
                    onClick={() =>
                      patchRequest(
                        "destination.enabled",
                        !Boolean(getPath(request, "destination.enabled", false))
                      )
                    }
                    className={[
                      "rounded-2xl border px-4 py-2 text-sm font-black",
                      getPath(request, "destination.enabled", false)
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {getPath(request, "destination.enabled", false)
                      ? "Habilitado"
                      : "Deshabilitado"}
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["destination.title", "Título"],
                    ["destination.addressLabel", "Etiqueta dirección"],
                    ["destination.placeNameLabel", "Etiqueta lugar"],
                    ["destination.referenceLabel", "Etiqueta referencia"],
                  ].map(([path, label]) => (
                    <Field key={path} label={label}>
                      <input
                        disabled={!getPath(request, "destination.enabled", false)}
                        value={String(getPath(request, path, ""))}
                        onChange={(e) => patchRequest(path, e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  ))}
                  <Field label="Destino obligatorio">
                    <button
                      type="button"
                      disabled={!getPath(request, "destination.enabled", false)}
                      onClick={() =>
                        patchRequest(
                          "destination.required",
                          !Boolean(
                            getPath(request, "destination.required", false)
                          )
                        )
                      }
                      className={inputClass}
                    >
                      {getPath(request, "destination.required", false)
                        ? "Sí"
                        : "No"}
                    </button>
                  </Field>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black">
                  Indicaciones y botón
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Etiqueta indicaciones">
                    <input
                      value={String(getPath(request, "note.label", ""))}
                      onChange={(e) =>
                        patchRequest("note.label", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Placeholder">
                    <input
                      value={String(getPath(request, "note.placeholder", ""))}
                      onChange={(e) =>
                        patchRequest("note.placeholder", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Texto predeterminado">
                    <textarea
                      value={String(
                        getPath(request, "note.defaultValue", "")
                      )}
                      onChange={(e) =>
                        patchRequest("note.defaultValue", e.target.value)
                      }
                      className={textareaClass}
                    />
                  </Field>
                  <div className="grid gap-4">
                    <Field label="Texto del botón">
                      <input
                        value={String(
                          getPath(request, "submit.buttonText", "")
                        )}
                        onChange={(e) =>
                          patchRequest("submit.buttonText", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Texto al crear">
                      <input
                        value={String(
                          getPath(request, "submit.creatingText", "")
                        )}
                        onChange={(e) =>
                          patchRequest("submit.creatingText", e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "worker" ? (
            <div className="grid gap-5">
              {[
                {
                  title: "Asignación",
                  prefix: "assigned",
                  fields: [
                    ["headerTitle", "Título principal"],
                    ["navigateText", "Botón navegar"],
                    ["arrivedText", "Botón llegada"],
                    ["readySingleText", "Mensaje listo"],
                    ["footerText", "Mensaje inferior"],
                  ],
                },
                {
                  title: "Recogida / inicio",
                  prefix: "pickup",
                  fields: [
                    ["headerTitle", "Título principal"],
                    ["actionText", "Botón de inicio"],
                    ["modalTitle", "Título confirmación"],
                    ["modalDescription", "Descripción confirmación"],
                    ["footerText", "Mensaje inferior"],
                  ],
                },
                {
                  title: "En ruta / finalización",
                  prefix: "enRoute",
                  fields: [
                    ["headerTitle", "Título principal"],
                    ["destinationLabel", "Etiqueta destino"],
                    ["navigateText", "Botón navegar"],
                    ["deliveredText", "Botón finalizar"],
                    ["footerText", "Mensaje inferior"],
                  ],
                },
              ].map((section) => (
                <section
                  key={section.prefix}
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-4 text-base font-black">{section.title}</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map(([key, label]) => (
                      <Field key={key} label={label}>
                        <input
                          value={String(
                            getPath(worker, `${section.prefix}.${key}`, "")
                          )}
                          onChange={(e) =>
                            patchWorker(
                              `${section.prefix}.${key}`,
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    ))}
                    {section.prefix === "enRoute" ? (
                      <Field label="Mostrar destino y navegación">
                        <button
                          type="button"
                          onClick={() =>
                            patchWorker(
                              "enRoute.showDestination",
                              !Boolean(
                                getPath(
                                  worker,
                                  "enRoute.showDestination",
                                  false
                                )
                              )
                            )
                          }
                          className={inputClass}
                        >
                          {getPath(
                            worker,
                            "enRoute.showDestination",
                            false
                          )
                            ? "Sí"
                            : "No"}
                        </button>
                      </Field>
                    ) : null}
                  </div>
                </section>
              ))}

              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-base font-black">
                  Checklist de inicio
                </div>
                <div className="space-y-3">
                  {checks.map((item: any, index: number) => (
                    <div
                      key={`${item?.key ?? "check"}-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[180px_minmax(0,1fr)_120px_48px]"
                    >
                      <input
                        value={String(item?.key ?? "")}
                        onChange={(e) => {
                          const next = clone(checks);
                          next[index] = {
                            ...next[index],
                            key: keyify(e.target.value).toLowerCase(),
                          };
                          patchWorker("pickup.checks", next);
                        }}
                        placeholder="check_key"
                        className={inputClass}
                      />
                      <input
                        value={String(item?.label ?? "")}
                        onChange={(e) => {
                          const next = clone(checks);
                          next[index] = {
                            ...next[index],
                            label: e.target.value,
                          };
                          patchWorker("pickup.checks", next);
                        }}
                        placeholder="Confirmación que debe realizar el Worker"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = clone(checks);
                          next[index] = {
                            ...next[index],
                            required: next[index]?.required === false,
                          };
                          patchWorker("pickup.checks", next);
                        }}
                        className={inputClass}
                      >
                        {item?.required === false ? "Opcional" : "Obligatorio"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = checks.filter(
                            (_: any, i: number) => i !== index
                          );
                          patchWorker("pickup.checks", next);
                        }}
                        className="rounded-2xl border border-rose-200 bg-rose-50 text-lg font-black text-rose-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patchWorker("pickup.checks", [
                      ...checks,
                      {
                        key: `check_${checks.length + 1}`,
                        label: "",
                        required: true,
                      },
                    ])
                  }
                  className="mt-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
                >
                  + Agregar verificación
                </button>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black">Etiquetas</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Etiqueta de descripción">
                    <input
                      value={String(
                        getPath(worker, "labels.packageLabel", "")
                      )}
                      onChange={(e) =>
                        patchWorker("labels.packageLabel", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Etiqueta del punto">
                    <input
                      value={String(
                        getPath(worker, "labels.pickupPointTitle", "")
                      )}
                      onChange={(e) =>
                        patchWorker("labels.pickupPointTitle", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "tracking" ? (
            <div className="grid gap-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-base font-black">
                  Títulos del seguimiento
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["detailsTitle", "Título de detalles"],
                    ["pickupTitle", "Título del punto inicial"],
                    ["requestEyebrow", "Etiqueta de solicitud"],
                    ["notesLabel", "Etiqueta de indicaciones"],
                  ].map(([path, label]) => (
                    <Field key={path} label={label}>
                      <input
                        value={String(getPath(tracking, path, ""))}
                        onChange={(e) =>
                          patchTracking(path, e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-base font-black">
                  Timeline del cliente
                </div>
                <div className="space-y-3">
                  {(Array.isArray(tracking.flowSteps)
                    ? tracking.flowSteps
                    : []
                  ).map((step: any, index: number) => (
                    <div
                      key={`${step?.key}-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[190px_240px_minmax(0,1fr)]"
                    >
                      <input
                        value={String(step?.key ?? "")}
                        disabled
                        className={inputClass}
                      />
                      <input
                        value={String(step?.label ?? "")}
                        onChange={(e) => {
                          const next = clone(tracking.flowSteps || []);
                          next[index] = {
                            ...next[index],
                            label: e.target.value,
                          };
                          patchTracking("flowSteps", next);
                        }}
                        placeholder="Título del paso"
                        className={inputClass}
                      />
                      <input
                        value={String(step?.hint ?? "")}
                        onChange={(e) => {
                          const next = clone(tracking.flowSteps || []);
                          next[index] = {
                            ...next[index],
                            hint: e.target.value,
                          };
                          patchTracking("flowSteps", next);
                        }}
                        placeholder="Explicación para el cliente"
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {tab === "advanced" ? (
            <div className="grid gap-5">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Esta sección permite editar directamente los contratos JSON. Úsala
                únicamente para campos que todavía no estén disponibles en las
                pestañas visuales. El sistema validará que cada bloque sea JSON válido.
              </div>
              {[
                {
                  label: "requestSchema",
                  value: advancedRequest,
                  setValue: setAdvancedRequest,
                },
                {
                  label: "workerFlowSchema",
                  value: advancedWorker,
                  setValue: setAdvancedWorker,
                },
                {
                  label: "trackingSchema",
                  value: advancedTracking,
                  setValue: setAdvancedTracking,
                },
              ].map((editor) => (
                <Field key={editor.label} label={editor.label}>
                  <textarea
                    value={editor.value}
                    onChange={(e) => editor.setValue(e.target.value)}
                    spellCheck={false}
                    className="min-h-[320px] w-full resize-y rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-5 text-emerald-200 outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </Field>
              ))}
              <button
                type="button"
                onClick={syncAdvancedJson}
                className="w-fit rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
              >
                Validar y aplicar JSON
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-500">
            {mode === "edit"
              ? `Al guardar se creará la versión ${Math.max(
                  Number(source?.version || 1) + 1,
                  draft.version
                )}.`
              : "El servicio puede guardarse como borrador antes de publicarlo."}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : mode === "edit"
                  ? "Guardar nueva versión"
                  : "Crear servicio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
