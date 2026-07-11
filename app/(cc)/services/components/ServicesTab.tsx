//app\(cc)\services\components\ServicesTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../../components/CtccCityContext";
import {
  adminListServiceConfigs,
  adminUpdateServiceConfig,
  type AdminServiceConfig,
  type WorkerType,
} from "../lib/servicesApi";

type ServiceDraft = AdminServiceConfig;

function workerLabel(workerType: WorkerType) {
  if (workerType === "TAXI") return "Taxista";
  if (workerType === "MOTORCARGO") return "Motocarguero";
  return "Domiciliario";
}

function serviceTone(serviceType: string) {
  if (serviceType === "TAXI") return "border-amber-200 bg-amber-50 text-amber-800";
  if (serviceType === "MOTORCARGO") return "border-violet-200 bg-violet-50 text-violet-700";
  if (serviceType === "PACKAGE") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function ServicesTab() {
  const { mode, citySlug, cityLabel } = useCtccCity();

  const [items, setItems] = useState<ServiceDraft[]>([]);
  const [originalItems, setOriginalItems] = useState<ServiceDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = mode === "CITY" && Boolean(citySlug);

  async function load() {
    if (!citySlug) {
      setItems([]);
      setOriginalItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSavedMessage(null);

    try {
      const response = await adminListServiceConfigs(citySlug);
      const rows = Array.isArray(response?.items) ? response.items : [];
      setItems(rows);
      setOriginalItems(rows);
    } catch (e: any) {
      setError(e?.message || "No fue posible cargar la configuración de servicios.");
      setItems([]);
      setOriginalItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

  const dirty = useMemo(() => JSON.stringify(items) !== JSON.stringify(originalItems), [items, originalItems]);
  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);
  const commissionReference = useMemo(
    () => items.reduce((sum, item) => sum + (item.isActive ? Number(item.workerCommissionCOP || 0) : 0), 0),
    [items]
  );

  function patchItem(serviceType: string, patch: Partial<ServiceDraft>) {
    setItems((current) => current.map((item) => item.serviceType === serviceType ? { ...item, ...patch } : item));
    setSavedMessage(null);
    setError(null);
  }

  async function saveChanges() {
    if (!canEdit || !citySlug || !dirty) return;

    setSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const changed = items.filter((item) => {
        const original = originalItems.find((row) => row.serviceType === item.serviceType);
        return JSON.stringify(original) !== JSON.stringify(item);
      });

      const updated = await Promise.all(
        changed.map((item) =>
          adminUpdateServiceConfig(citySlug, item.serviceType, {
            name: item.name,
            description: item.description,
            workerType: item.workerType,
            workerCommissionCOP: Math.max(0, Math.round(Number(item.workerCommissionCOP || 0))),
            isActive: Boolean(item.isActive),
            sortOrder: Math.max(0, Math.round(Number(item.sortOrder || 0))),
          })
        )
      );

      const byType = new Map(updated.map((response) => [response.item.serviceType, response.item]));
      const nextItems = items.map((item) => byType.get(item.serviceType) ?? item);
      setItems(nextItems);
      setOriginalItems(nextItems);
      setSavedMessage(`Configuración guardada en API para ${cityLabel}.`);
    } catch (e: any) {
      setError(e?.message || "No fue posible guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  function restoreValues() {
    setItems(originalItems);
    setSavedMessage(null);
    setError(null);
  }

  return (
    <div className="space-y-2">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Servicios KRONIX
              </h1>             
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={restoreValues}
                disabled={!canEdit}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-40"
              >
                Restaurar valores
              </button>

              <button
                type="button"
                onClick={saveChanges}
                disabled={!canEdit || !dirty || saving}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {!canEdit ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          Selecciona una ciudad en el selector superior. Las comisiones se preparan
          de forma independiente por ciudad.
        </div>
      ) : null}

      {savedMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {savedMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
          Cargando configuración real desde la API...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Servicios configurados
          </div>
          <div className="mt-2 text-3xl font-black text-slate-950">{items.length}</div>
          <div className="mt-2 text-xs text-slate-500">Catálogo inicial para Fase 2.</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Servicios activos
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700">{activeCount}</div>
          <div className="mt-2 text-xs text-slate-500">Habilitados realmente para la ciudad.</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Suma de comisiones
          </div>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {formatCOP(commissionReference)}
          </div>
          <div className="mt-2 text-xs text-slate-500">Suma de comisiones activas por servicio.</div>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 md:px-5">
          <div className="text-lg font-black text-slate-950">
            Catálogo y comisión por servicio
          </div>
          <div className="mt-1 text-sm text-slate-500">
            La comisión es el valor fijo que KRONIX cobrará al Worker al completar
            exitosamente el servicio.
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {items
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((service) => (
              <div key={service.serviceType} className="p-4 md:p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_170px] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                          serviceTone(service.serviceType),
                        ].join(" ")}
                      >
                        {service.name}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600">
                        {service.serviceType}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">{service.description}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tipo de Worker
                    </label>
                    <select
                      value={service.workerType}
                      disabled={!canEdit}
                      onChange={(event) =>
                        patchItem(service.serviceType, {
                          workerType: event.target.value as WorkerType,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:bg-slate-50"
                    >
                      <option value="MOTORCYCLE">Domiciliario</option>
                      <option value="TAXI">Taxista</option>
                      <option value="MOTORCARGO">Motocarguero</option>
                    </select>
                    </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Comisión KRONIX
                    </label>
                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={service.workerCommissionCOP}
                        disabled={!canEdit}
                        onChange={(event) =>
                          patchItem(service.serviceType, {
                            workerCommissionCOP: Math.max(
                              0,
                              Math.round(Number(event.target.value || 0))
                            ),
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-8 pr-4 text-right text-sm font-black disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                    </label>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() =>
                        patchItem(service.serviceType, {
                          isActive: !service.isActive,
                        })
                      }
                      className={[
                        "mt-2 w-full rounded-2xl border px-4 py-2 text-sm font-black transition disabled:opacity-50",
                        service.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {service.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 shadow-sm">
        <div className="font-black">Estado técnico de esta etapa</div>
        <div className="mt-2 leading-6">
          Esta pantalla ya está conectada con
          <code className="mx-1 rounded bg-white/70 px-1.5 py-0.5">ServiceConfig</code>
          en la API. Los cambios afectan las nuevas órdenes. Cada orden conserva
          la comisión vigente al momento de su creación.
        </div>
      </section>
    </div>
  );
}
