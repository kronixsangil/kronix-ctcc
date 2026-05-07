//app\(cc)\stores\components\BuyerCategoriesCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  type AdminBuyerCategory,
  adminCreateBuyerCategory,
  adminDeleteBuyerCategory,
  adminListBuyerCategories,
  adminUpdateBuyerCategory,
} from "../lib/storesApi";

const EMPTY_FORM = {
  slug: "",
  name: "",
  emoji: "✨",
  sortOrder: 100,
  isActive: true,
  matchTerms: "",
};

export default function BuyerCategoriesCard({
  citySlug,
  cityLabel,
}: {
  citySlug: string;
  cityLabel: string;
}) {
  const [items, setItems] = useState<AdminBuyerCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  async function load() {
    if (!citySlug) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    setOkMsg(null);

    try {
      const res = await adminListBuyerCategories({ citySlug });
      setItems(res);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar las categorías Buyer");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCreateForm(EMPTY_FORM);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

  async function createCategory() {
    if (!citySlug) return;

    setCreating(true);
    setError(null);
    setOkMsg(null);

    try {
      await adminCreateBuyerCategory({
        citySlug,
        slug: createForm.slug,
        name: createForm.name,
        emoji: createForm.emoji || "✨",
        sortOrder: Number(createForm.sortOrder || 100),
        isActive: Boolean(createForm.isActive),
        matchTerms: createForm.matchTerms || null,
      });

      setCreateForm(EMPTY_FORM);
      setOkMsg(`Categoría creada para ${cityLabel}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la categoría");
    } finally {
      setCreating(false);
    }
  }

  async function saveInline(item: AdminBuyerCategory) {
    if (!citySlug) return;

    setSavingId(item.id);
    setError(null);
    setOkMsg(null);

    try {
      await adminUpdateBuyerCategory(item.id, {
        citySlug,
        slug: item.slug,
        name: item.name,
        emoji: item.emoji || "✨",
        sortOrder: Number(item.sortOrder || 100),
        isActive: Boolean(item.isActive),
        matchTerms: item.matchTerms || null,
      });

      setOkMsg(`Categoría actualizada para ${cityLabel}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la categoría");
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(id: string) {
    const ok = window.confirm(`¿Eliminar esta categoría Buyer de ${cityLabel}?`);
    if (!ok) return;

    setSavingId(id);
    setError(null);
    setOkMsg(null);

    try {
      await adminDeleteBuyerCategory(id);
      setOkMsg(`Categoría eliminada de ${cityLabel}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar");
    } finally {
      setSavingId(null);
    }
  }

  function patchItem(id: string, patch: Partial<AdminBuyerCategory>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Categorías Buyer</div>
            <div className="mt-1 text-sm text-slate-600">
              Controla qué filtros aparecen en el Home de Buyer para la ciudad seleccionada.
            </div>
          </div>

          <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
            {cityLabel}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {okMsg ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {okMsg}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Nueva categoría</div>

          <div className="mt-2 text-xs text-slate-500">
            Esta categoría se creará únicamente para <b>{cityLabel}</b>.
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={createForm.slug}
              onChange={(e) => setCreateForm((s) => ({ ...s, slug: e.target.value }))}
              placeholder="slug"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Nombre"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={createForm.emoji}
              onChange={(e) => setCreateForm((s) => ({ ...s, emoji: e.target.value }))}
              placeholder="Emoji"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={createForm.sortOrder}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))
              }
              placeholder="Orden"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={String(createForm.isActive)}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, isActive: e.target.value === "true" }))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="true">Activa</option>
              <option value="false">Oculta</option>
            </select>
            <button
              onClick={createCategory}
              disabled={creating}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
          </div>

          <textarea
            value={createForm.matchTerms}
            onChange={(e) =>
              setCreateForm((s) => ({ ...s, matchTerms: e.target.value }))
            }
            placeholder="matchTerms: restaurante, comida, pizza, hamburguesa"
            rows={2}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />

          <div className="mt-2 text-[11px] text-slate-500">
            Usa <b>matchTerms</b> separados por coma para que Buyer sepa qué tiendas entran en cada filtro.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                  <th>Orden</th>
                  <th>Emoji</th>
                  <th>Slug</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Coincidencias</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      Aún no hay categorías configuradas para {cityLabel}.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="[&>td]:px-3 [&>td]:py-3 align-top">
                      <td className="w-[90px]">
                        <input
                          type="number"
                          value={item.sortOrder}
                          onChange={(e) =>
                            patchItem(item.id, { sortOrder: Number(e.target.value) })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        />
                      </td>

                      <td className="w-[90px]">
                        <input
                          value={item.emoji || ""}
                          onChange={(e) => patchItem(item.id, { emoji: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        />
                      </td>

                      <td className="w-[180px]">
                        <input
                          value={item.slug}
                          onChange={(e) => patchItem(item.id, { slug: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        />
                      </td>

                      <td className="w-[220px]">
                        <input
                          value={item.name}
                          onChange={(e) => patchItem(item.id, { name: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        />
                      </td>

                      <td className="w-[130px]">
                        <select
                          value={String(item.isActive)}
                          onChange={(e) =>
                            patchItem(item.id, { isActive: e.target.value === "true" })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        >
                          <option value="true">Activa</option>
                          <option value="false">Oculta</option>
                        </select>
                      </td>

                      <td>
                        <textarea
                          rows={2}
                          value={item.matchTerms || ""}
                          onChange={(e) =>
                            patchItem(item.id, { matchTerms: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        />
                      </td>

                      <td className="w-[180px] text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveInline(item)}
                            disabled={savingId === item.id}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {savingId === item.id ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}