"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../../components/CtccCityContext";
import ServiceEditorModal from "./ServiceEditorModal";
import {
  adminArchiveDynamicService,
  adminCreateDynamicService,
  adminListDynamicServices,
  adminUpdateDynamicService,
  type DynamicServiceDefinition,
  type DynamicServiceWriteInput,
} from "../lib/servicesApi";

type ModalState =
  | { open: false; mode: "create"; source: null }
  | {
      open: true;
      mode: "create" | "edit" | "duplicate";
      source: DynamicServiceDefinition | null;
    };

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "Publicado";
  if (status === "DRAFT") return "Borrador";
  return status;
}

function toneForStatus(status: string) {
  if (status === "PUBLISHED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function ServicesTab() {
  const { mode, citySlug, cityLabel } = useCtccCity();

  const [items, setItems] = useState<DynamicServiceDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    source: null,
  });

  const canEdit = mode === "CITY" && Boolean(citySlug);

  async function load() {
    if (!citySlug) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await adminListDynamicServices(citySlug);
      setItems(Array.isArray(response?.items) ? response.items : []);
    } catch (e: any) {
      setError(
        e?.message || "No fue posible cargar el catálogo dinámico de servicios."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (!q) return true;
        return [
          item.name,
          item.shortName,
          item.serviceKey,
          item.slug,
          item.workerLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items, query]);

  const publishedCount = useMemo(
    () => items.filter((item) => item.status === "PUBLISHED").length,
    [items]
  );
  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items]
  );
  const commissionReference = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.isActive ? Number(item.workerCommissionCOP || 0) : 0),
        0
      ),
    [items]
  );

  async function saveService(
    input: DynamicServiceWriteInput & { serviceKey?: string }
  ) {
    if (!citySlug || !canEdit) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (modal.open && modal.mode === "edit" && modal.source) {
        await adminUpdateDynamicService(citySlug, modal.source.id, input);
        setMessage(
          `${input.name} fue actualizado y quedó en versión ${input.version}.`
        );
      } else {
        const serviceKey = String(input.serviceKey ?? "").trim();
        if (!serviceKey) {
          throw new Error("El código interno del servicio es obligatorio.");
        }

        await adminCreateDynamicService(citySlug, {
          ...input,
          serviceKey,
        } as DynamicServiceWriteInput & { serviceKey: string });

        setMessage(
          `${input.name} fue creado ${
            input.status === "PUBLISHED" && input.isActive
              ? "y ya está disponible en la ciudad."
              : "como configuración pendiente."
          }`
        );
      }

      setModal({ open: false, mode: "create", source: null });
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible guardar el servicio.");
    } finally {
      setSaving(false);
    }
  }

  async function quickPatch(
    item: DynamicServiceDefinition,
    patch: Partial<DynamicServiceWriteInput>
  ) {
    if (!citySlug || !canEdit || saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await adminUpdateDynamicService(citySlug, item.id, patch);
      await load();
      setMessage(`Se actualizó ${item.name}.`);
    } catch (e: any) {
      setError(e?.message || "No fue posible actualizar el servicio.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(item: DynamicServiceDefinition) {
    if (!citySlug || !canEdit || saving) return;

    const confirmed = window.confirm(
      `¿Archivar "${item.name}"?\n\nSe desactivará en todas las ciudades y dejará de aparecer en Buyer y Worker. Las órdenes históricas conservarán su snapshot.`
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await adminArchiveDynamicService(citySlug, item.id);
      await load();
      setMessage(`${item.name} fue archivado.`);
    } catch (e: any) {
      setError(e?.message || "No fue posible archivar el servicio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 md:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Constructor de Servicios KRONIX
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Crea, duplica, publica y configura servicios sin desarrollar un
              flujo independiente.
            </p>
          </div>

          <button
            type="button"
            disabled={!canEdit}
            onClick={() =>
              setModal({ open: true, mode: "create", source: null })
            }
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm hover:bg-slate-100 disabled:opacity-40"
          >
            + Crear servicio
          </button>
        </div>
      </section>

      {!canEdit ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900 shadow-sm">
          Selecciona una ciudad en el selector superior para administrar la
          activación, comisión y orden operativo.
        </div>
      ) : null}

      {message ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ["Servicios definidos", items.length, "Catálogo global no archivado"],
          ["Publicados", publishedCount, "Disponibles para activación"],
          ["Activos en ciudad", activeCount, cityLabel || "Ciudad seleccionada"],
          [
            "Suma de comisiones",
            formatCOP(commissionReference),
            "Referencia de servicios activos",
          ],
        ].map(([label, value, hint]) => (
          <div
            key={String(label)}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">
              {label}
            </div>
            <div className="mt-2 text-3xl font-black text-slate-950">
              {value}
            </div>
            <div className="mt-2 text-xs text-slate-500">{hint}</div>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-black text-slate-950">
              Catálogo dinámico
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Los cambios globales incrementan la versión; cada orden conserva la
              configuración con la que fue creada.
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar servicio..."
              className="w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Cargando catálogo dinámico desde la API...
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No hay servicios que coincidan con la búsqueda.
        </div>
      ) : null}

      <div className="grid gap-4">
        {filtered.map((service) => (
          <article
            key={service.id}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              className="h-2"
              style={{ backgroundColor: service.primaryColor || "#0F766E" }}
            />

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_180px_180px_190px] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex rounded-full border px-3 py-1 text-sm font-black"
                    style={{
                      borderColor: service.primaryColor,
                      color: service.primaryColor,
                      backgroundColor: service.accentColor,
                    }}
                  >
                    {service.icon ? `${service.icon} ` : ""}
                    {service.name}
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-black text-slate-600">
                    {service.serviceKey}
                  </span>

                  <span
                    className={[
                      "rounded-full border px-2.5 py-1 text-[11px] font-black",
                      toneForStatus(service.status),
                    ].join(" ")}
                  >
                    {statusLabel(service.status)}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                    v{service.version}
                  </span>
                </div>

                <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {service.description || "Sin descripción."}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>
                    Slug: <b className="text-slate-700">{service.slug}</b>
                  </span>
                  <span>
                    Worker:{" "}
                    <b className="text-slate-700">{service.workerLabel}</b>
                  </span>
                  <span>
                    Tipo:{" "}
                    <b className="font-mono text-slate-700">
                      {service.workerTypeKey}
                    </b>
                  </span>
                  <span>
                    Orden: <b className="text-slate-700">{service.sortOrder}</b>
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Comisión
                </div>
                <div className="mt-2 text-xl font-black text-slate-950">
                  {formatCOP(service.workerCommissionCOP)}
                </div>
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Estado ciudad
                </div>
                <button
                  type="button"
                  disabled={!canEdit || saving || service.status !== "PUBLISHED"}
                  onClick={() =>
                    void quickPatch(service, {
                      isActive: !service.isActive,
                    })
                  }
                  className={[
                    "mt-2 w-full rounded-2xl border px-4 py-2.5 text-sm font-black transition disabled:opacity-40",
                    service.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() =>
                    setModal({
                      open: true,
                      mode: "edit",
                      source: service,
                    })
                  }
                  className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                >
                  Editar
                </button>

                <button
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() =>
                    setModal({
                      open: true,
                      mode: "duplicate",
                      source: service,
                    })
                  }
                  className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-black text-sky-700 disabled:opacity-50"
                >
                  Duplicar
                </button>

                <button
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() =>
                    void quickPatch(service, {
                      workerCommissionCOP:
                        service.workerCommissionCOP + 100,
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 disabled:opacity-50"
                >
                  + $100 comisión
                </button>

                <button
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() => void archive(service)}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 disabled:opacity-50"
                >
                  Archivar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 shadow-sm">
        <div className="font-black">Prueba principal de Fase 2</div>
        <div className="mt-2 leading-6">
          Duplica un servicio existente y crea <b>KroniX Envíos</b> con código{" "}
          <code className="rounded bg-white px-1.5 py-0.5">PACKAGE</code>, slug{" "}
          <code className="rounded bg-white px-1.5 py-0.5">
            kronix-envios
          </code>
          , imágenes de la carpeta{" "}
          <code className="rounded bg-white px-1.5 py-0.5">package</code> y estado
          Publicado + Activo. Buyer y Worker deberán consumirlo sin agregar código.
        </div>
      </section>

      <ServiceEditorModal
        open={modal.open}
        mode={modal.mode}
        source={modal.source}
        saving={saving}
        onClose={() =>
          !saving &&
          setModal({ open: false, mode: "create", source: null })
        }
        onSave={saveService}
      />
    </div>
  );
}
