// app/(cc)/stores/components/store-details/StoreProductsTab.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { formatCOP } from "@/lib/format";
import {
  AdminProduct,
  AdminStoreDetails,
  adminCreateStoreProduct,
  adminDeleteStoreProduct,
  adminImportStoreProducts,
  adminListStoreProducts,
  adminUpdateStoreProduct,
} from "../../lib/storesApi";

type Props = {
  mode: "create" | "edit";
  storeId: string | null;
  store: AdminStoreDetails | null;
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    cur.push(field);
    field = "";
  };

  const pushRow = () => {
    if (cur.length === 1 && String(cur[0] ?? "").trim() === "") {
      cur = [];
      return;
    }

    rows.push(cur);
    cur = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }

      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      pushField();
      continue;
    }

    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }

    if (ch === "\r") continue;

    field += ch;
  }

  pushField();
  if (cur.length) pushRow();

  const headers = (rows[0] || []).map((h) => String(h ?? "").trim());
  const data = rows.slice(1);

  return { headers, rows: data };
}

function normHeader(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function toBool(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "0" || s === "false" || s === "no" || s === "n") return false;
  if (s === "1" || s === "true" || s === "si" || s === "sí" || s === "y" || s === "yes") {
    return true;
  }
  return true;
}

export default function StoreProductsTab({ mode, storeId, store }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productQ, setProductQ] = useState("");
  const [productAvail, setProductAvail] = useState<"ALL" | "true" | "false">("ALL");
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [productEditorMode, setProductEditorMode] = useState<"create" | "edit">("create");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productForm, setProductForm] = useState<any>({
    externalId: "",
    name: "",
    description: "",
    info: "",
    priceCOP: "",
    image: "",
    isAvailable: true,
    category: "",
    categoryOrder: "100",
    isRecommended: false,
    displayOrder: "100",
  });

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
    const productCategories = Array.from(
    new Set(
      products
        .map((p) => String((p as any).category ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  async function loadProducts() {
    if (!storeId) return;

    setProductsLoading(true);
    setProductsError(null);

    try {
      const list = await adminListStoreProducts(storeId, {
        q: productQ,
        available: productAvail,
      });

      setProducts(list);
    } catch (e: any) {
      setProductsError(e?.message || "Error cargando productos");
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    if (mode !== "edit") return;
    if (!storeId) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, productAvail]);

  function openCreateProduct() {
    setProductEditorMode("create");
    setEditingProductId(null);
    setProductForm({
      externalId: "",
      name: "",
      description: "",
      info: "",
      priceCOP: "",
      image: "",
      isAvailable: true,
      category: "",
      categoryOrder: "100",
      isRecommended: false,
      displayOrder: "100",
    });
    setProductEditorOpen(true);
  }

  function openEditProduct(p: AdminProduct) {
    const productAny = p as any;

    setProductEditorMode("edit");
    setEditingProductId(p.id);
    setProductForm({
      externalId: p.externalId,
      name: p.name,
      description: p.description ?? "",
      info: productAny.info ?? "",
      priceCOP: String(p.priceCOP ?? ""),
      image: p.image ?? "",
      isAvailable: Boolean(p.isAvailable),
      category: String(productAny.category ?? ""),
      categoryOrder: String(productAny.categoryOrder ?? 100),
      isRecommended: Boolean(productAny.isRecommended),
      displayOrder: String(productAny.displayOrder ?? 100),
    });
    setProductEditorOpen(true);
  }

  async function saveProduct() {
    if (!storeId) return;

    setProductSaving(true);
    setProductsError(null);

    try {
      const payload = {
        externalId: String(productForm.externalId || "").trim(),
        name: String(productForm.name || "").trim(),
        description: String(productForm.description || "").trim() || null,
        info: String(productForm.info || "").trim() || null,
        priceCOP: Math.max(0, Math.round(Number(productForm.priceCOP || 0))),
        image: String(productForm.image || "").trim() || null,
        isAvailable: Boolean(productForm.isAvailable),
        category: String(productForm.category || "").trim() || null,
        categoryOrder: Math.max(0, Math.round(Number(productForm.categoryOrder || 100))),
        isRecommended: Boolean(productForm.isRecommended),
        displayOrder: Math.max(0, Math.round(Number(productForm.displayOrder || 100))),
      };

      if (!payload.externalId) throw new Error("product_id requerido (externalId)");
      if (!payload.name) throw new Error("Nombre requerido");
      if (!Number.isFinite(payload.priceCOP)) throw new Error("price_cop inválido");

      if (productEditorMode === "create") {
        await adminCreateStoreProduct(storeId, payload as any);
      } else {
        if (!editingProductId) throw new Error("productId faltante");
        await adminUpdateStoreProduct(storeId, editingProductId, payload as any);
      }

      setProductEditorOpen(false);
      await loadProducts();
    } catch (e: any) {
      setProductsError(e?.message || "Error guardando producto");
    } finally {
      setProductSaving(false);
    }
  }

  async function toggleAvailability(p: AdminProduct) {
    if (!storeId) return;

    const ok = window.confirm(p.isAvailable ? "¿Marcar como NO disponible?" : "¿Marcar como disponible?");
    if (!ok) return;

    setProductsError(null);

    try {
      await adminUpdateStoreProduct(storeId, p.id, { isAvailable: !p.isAvailable } as any);
      await loadProducts();
    } catch (e: any) {
      setProductsError(e?.message || "Error cambiando disponibilidad");
    }
  }

  async function deleteProduct(p: AdminProduct) {
    if (!storeId) return;

    const ok = window.confirm(`¿Eliminar producto "${p.name}"? (se borra del catálogo)`);
    if (!ok) return;

    setProductsError(null);

    try {
      await adminDeleteStoreProduct(storeId, p.id);
      await loadProducts();
    } catch (e: any) {
      setProductsError(e?.message || "Error eliminando producto");
    }
  }

  async function handleCsvFile(file: File) {
    if (!storeId) return;
    if (!store) throw new Error("Tienda no cargada todavía");

    setImportMsg(null);
    setProductsError(null);
    setImporting(true);

    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      if (!parsed.headers || parsed.headers.length === 0) {
        throw new Error("CSV inválido: no se detectaron headers");
      }

      const headerMap = new Map<string, number>();
      parsed.headers.forEach((h, idx) => headerMap.set(normHeader(h), idx));

      const need = ["store_id", "product_id", "name", "desc", "price_cop", "is_available"];
      const missing = need.filter((k) => !headerMap.has(k));
      if (missing.length) {
        throw new Error(`CSV inválido. Faltan columnas: ${missing.join(", ")}`);
      }

      const idxStore = headerMap.get("store_id")!;
      const idxPid = headerMap.get("product_id")!;
      const idxName = headerMap.get("name")!;
      const idxDesc = headerMap.get("desc")!;
      const idxPrice = headerMap.get("price_cop")!;
      const idxAvail = headerMap.get("is_available")!;
      const idxImg = headerMap.has("image") ? headerMap.get("image")! : -1;
      const idxInfo = headerMap.has("extended_info") ? headerMap.get("extended_info")! : -1;

      const storeCode = String(store.storeCode ?? "").trim();

      const errors: string[] = [];
      const rowsToSend: Array<{
        externalId: string;
        name: string;
        description?: string | null;
        info?: string | null;
        priceCOP: number;
        image?: string | null;
        isAvailable?: boolean;
      }> = [];

      parsed.rows.forEach((r, i) => {
        const storeIdCsv = String(r[idxStore] ?? "").trim();
        const productId = String(r[idxPid] ?? "").trim();
        const name = String(r[idxName] ?? "").trim();
        const desc = String(r[idxDesc] ?? "").trim();
        const priceRaw = String(r[idxPrice] ?? "").trim();
        const availRaw = String(r[idxAvail] ?? "").trim();
        const image = idxImg >= 0 ? String(r[idxImg] ?? "").trim() : "";
        const extendedInfo = idxInfo >= 0 ? String(r[idxInfo] ?? "").trim() : "";

        if (storeIdCsv && storeIdCsv !== storeCode) {
          errors.push(`Fila ${i + 2}: store_id=${storeIdCsv} no coincide con storeCode=${storeCode}`);
          return;
        }

        if (!productId) {
          errors.push(`Fila ${i + 2}: product_id vacío`);
          return;
        }

        if (!name) {
          errors.push(`Fila ${i + 2}: name vacío`);
          return;
        }

        const price = Math.max(0, Math.round(Number(priceRaw)));
        if (!Number.isFinite(price)) {
          errors.push(`Fila ${i + 2}: price_cop inválido (${priceRaw})`);
          return;
        }

        rowsToSend.push({
          externalId: productId,
          name,
          description: desc ? desc : null,
          info: extendedInfo ? extendedInfo : null,
          priceCOP: price,
          image: image ? image : null,
          isAvailable: toBool(availRaw),
        });
      });

      if (errors.length) {
        throw new Error(
          `Errores en CSV:\n- ${errors.slice(0, 10).join("\n- ")}${
            errors.length > 10 ? `\n... (${errors.length - 10} más)` : ""
          }`
        );
      }

      if (rowsToSend.length === 0) {
        throw new Error("No hay filas válidas para importar.");
      }

      const ok = window.confirm(
        `Vas a importar ${rowsToSend.length} productos a la tienda ${storeCode}.\n` +
          `Esto hará UPSERT (crea/actualiza).\n\n¿Continuar?`
      );
      if (!ok) return;

      const res = await adminImportStoreProducts(storeId, { rows: rowsToSend });

      setImportMsg(
        `Importación OK ✅ Total CSV: ${res.total} · Unique: ${res.unique} · Creados: ${res.created} · Actualizados: ${res.updated} · Errores: ${res.errors?.length || 0}`
      );

      await loadProducts();
    } catch (e: any) {
      setProductsError(e?.message || "Error importando CSV");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (mode !== "edit" || !storeId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
          Productos
        </div>
        <div className="p-4 text-sm text-slate-600">Disponible después de crear la tienda.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Productos</div>
        <div className="mt-1 text-xs text-slate-500">
          Catálogo, búsqueda, disponibilidad, carga CSV y editor de productos.
        </div>
      </div>

      <div className="p-4 space-y-3">
        {productsError ? (
          <div className="whitespace-pre-line rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {productsError}
          </div>
        ) : null}

        {importMsg ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {importMsg}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Buscar</label>
              <input
                value={productQ}
                onChange={(e) => setProductQ(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Disponibilidad</label>
              <select
                value={productAvail}
                onChange={(e) => setProductAvail(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="true">Disponibles</option>
                <option value="false">No disponibles</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadProducts()}
              disabled={productsLoading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            >
              {productsLoading ? "..." : "Actualizar"}
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
            >
              {importing ? "Importando..." : "📥 Cargar CSV"}
            </button>

            <button
              onClick={openCreateProduct}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Nuevo
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsvFile(f);
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                  <th>product_id</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">Precio</th>
                  <th>Recomendado</th>
                  <th>Disponible</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {productsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      Cargando productos...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      No hay productos para mostrar.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const productAny = p as any;

                    return (
                      <tr key={p.id} className="[&>td]:px-3 [&>td]:py-3">
                        <td className="font-mono text-xs text-slate-700">{p.externalId}</td>

                        <td>
                          <div className="font-medium text-slate-900">{p.name}</div>
                          {p.description ? (
                            <div className="text-xs text-slate-500">{p.description}</div>
                          ) : null}
                          {productAny.info ? (
                            <div className="mt-1 text-xs text-slate-500">{productAny.info}</div>
                          ) : null}
                        </td>

                                                <td>
                          <div className="text-xs font-bold text-slate-800">
                            {String(productAny.category ?? "").trim() || "Sin categoría"}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            Cat: {productAny.categoryOrder ?? 100} · Prod: {productAny.displayOrder ?? 100}
                          </div>
                        </td>

                        <td className="text-right font-medium">{formatCOP(p.priceCOP)}</td>

                        <td>
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              productAny.isRecommended
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {productAny.isRecommended ? "Sí ⭐" : "No"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              p.isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700",
                            ].join(" ")}
                          >
                            {p.isAvailable ? "Sí" : "No"}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => toggleAvailability(p)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                            >
                              {p.isAvailable ? "No disponible" : "Disponible"}
                            </button>

                            <button
                              onClick={() => deleteProduct(p)}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {productEditorOpen ? (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
              {productEditorMode === "create" ? "Crear producto" : "Editar producto"}
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">product_id</label>
                <input
                  value={productForm.externalId}
                  onChange={(e) =>
                    setProductForm((s: any) => ({ ...s, externalId: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Nombre</label>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm((s: any) => ({ ...s, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Descripción</label>
                <input
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((s: any) => ({ ...s, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Info ampliada</label>
                <textarea
                  value={String(productForm.info ?? "")}
                  onChange={(e) => setProductForm((s: any) => ({ ...s, info: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Ingredientes, especificaciones, detalles importantes..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">price_cop</label>
                <input
                  value={String(productForm.priceCOP)}
                  onChange={(e) =>
                    setProductForm((s: any) => ({ ...s, priceCOP: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">image</label>
                <input
                  value={productForm.image}
                  onChange={(e) => setProductForm((s: any) => ({ ...s, image: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

                            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="text-sm font-extrabold text-slate-900">
                  📋 Organización del menú
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Define cómo se agrupará y ordenará este producto en la carta del Buyer App.
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Categoría</label>
                    <input
                      value={String(productForm.category ?? "")}
                      onChange={(e) =>
                        setProductForm((s: any) => ({ ...s, category: e.target.value }))
                      }
                      list="store-product-categories"
                      placeholder="Ej: Carnes, Bebidas, Postres..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <datalist id="store-product-categories">
                      {productCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Orden categoría</label>
                    <input
                      value={String(productForm.categoryOrder ?? "100")}
                      onChange={(e) =>
                        setProductForm((s: any) => ({ ...s, categoryOrder: e.target.value }))
                      }
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600">Orden producto</label>
                    <input
                      value={String(productForm.displayOrder ?? "100")}
                      onChange={(e) =>
                        setProductForm((s: any) => ({ ...s, displayOrder: e.target.value }))
                      }
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <label className="md:col-span-4 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <div className="text-sm font-bold text-slate-800">⭐ Producto recomendado</div>
                      <div className="text-xs text-slate-500">
                        Aparecerá arriba en Recomendados y también dentro de su categoría.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={Boolean(productForm.isRecommended)}
                      onChange={(e) =>
                        setProductForm((s: any) => ({
                          ...s,
                          isRecommended: e.target.checked,
                        }))
                      }
                      className="h-5 w-5"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">is_available</label>
                <select
                  value={String(Boolean(productForm.isAvailable))}
                  onChange={(e) =>
                    setProductForm((s: any) => ({
                      ...s,
                      isAvailable: e.target.value === "true",
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="true">1 (Disponible)</option>
                  <option value="false">0 (No disponible)</option>
                </select>
              </div>

              <div className="flex items-end justify-end gap-2 md:col-span-2">
                <button
                  onClick={() => setProductEditorOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={saveProduct}
                  disabled={productSaving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {productSaving ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
