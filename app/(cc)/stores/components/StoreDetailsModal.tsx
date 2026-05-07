// app/(cc)/stores/components/StoreDetailsModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCOP } from "@/lib/format";
import {
  AdminCityItem,
  AdminCreateStoreInput,
  AdminProduct,
  AdminStoreDetails,
  AdminStoreMetrics,
  StorePremiumTier,
  adminCreateStore,
  adminCreateStoreProduct,
  adminDeactivateStore,
  adminDeleteStoreProduct,
  adminGetStore,
  adminGetStoreMetricsToday,
  adminImportStoreProducts,
  adminListCities,
  adminListStoreProducts,
  adminUpdateStore,
  adminUpdateStoreProduct,
} from "../lib/storesApi";

type Props = {
  storeId: string | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: () => void;
  onDeactivated: () => void;
};

function overlayClose(e: React.MouseEvent<HTMLDivElement>, onClose: () => void) {
  if (e.target === e.currentTarget) onClose();
}

const emptyCreate: AdminCreateStoreInput = {
  citySlug: "",
  storeCode: "",
  name: "",
  address: "",
  lat: 0,
  lng: 0,
  category: "General",
  description: "",
  etaMin: 10,
  etaMax: 25,
  cel1: "",
  cel2: "",
  hrOp: "",
  hrCl: "",
  image: "",
  image2: "",
  image3: "",
  image4: "",
};

function pctFromBps(bps: number) {
  const n = Number(bps);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

function bpsFromPct(pct: any) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

function prettyTier(t: StorePremiumTier) {
  if (t === "PREMIUM_PLUS") return "Premium+";
  if (t === "PREMIUM") return "Premium";
  return "Standard";
}

function storeStatusLabel(s: AdminStoreDetails) {
  if (!s.isActive) return "INACTIVA";
  if (s.isPaused) return "PAUSADA";
  return "ACTIVA";
}

function storeStatusPill(s: AdminStoreDetails) {
  if (!s.isActive) return "bg-slate-100";
  if (s.isPaused) return "bg-amber-50";
  return "bg-emerald-50";
}

function storeStatusText(s: AdminStoreDetails) {
  if (!s.isActive) return "text-slate-700";
  if (s.isPaused) return "text-amber-800";
  return "text-emerald-700";
}

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

    if (ch === "\r") {
      continue;
    }

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
  if (s === "1" || s === "true" || s === "si" || s === "sí" || s === "y" || s === "yes") return true;
  return true;
}

export default function StoreDetailsModal({ storeId, mode, onClose, onSaved, onDeactivated }: Props) {
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [store, setStore] = useState<AdminStoreDetails | null>(null);
  const [metrics, setMetrics] = useState<AdminStoreMetrics | null>(null);

  const [form, setForm] = useState<any>(mode === "create"
    ? {
        ...emptyCreate,
        isActive: true,
        isPaused: false,
        pausedReason: "",
        commissionRatePct: 8,
        premiumTier: "STANDARD",
        autoDecisionMode: "AUTO_REJECT",
        autoDecisionMinutes: 5,
        isBuyerRecommended: false,
        buyerRecommendedOrder: "",
        buyerCardTitleOverride: "",
        buyerCardSubtitleOverride: "",
        buyerCardBadgeText: "",
        buyerCardDistanceText: "",
        buyerCardRatingText: "",
        buyerCardStickerEmoji: "",
        buyerCardImageOrder: "",

        productsFeatureEnabled: true,
        storeAppCanManageProducts: true,
        storeAppCanCreateProducts: true,
        storeAppCanEditProducts: true,
        storeAppCanDeleteProducts: true,
        storeAppCanChangeProductPrices: true,
        storeAppCanUploadProductImages: true,
        storeAppCanUseProductCamera: true,
        storeAppCanImportProductsCsv: true,
        storeAppCanToggleProductActive: true,
        storeAppCanToggleProductAvailable: true,
      }
    : null);

  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cities, setCities] = useState<AdminCityItem[]>([]);

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
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const title = useMemo(() => {
    return mode === "create" ? "Nueva tienda" : `Tienda ${store?.storeCode ?? ""}`;
  }, [mode, store?.storeCode]);

  async function loadCities() {
    setCitiesLoading(true);
    try {
      const res = await adminListCities({ status: "ACTIVE", page: 1, limit: 100 });
      setCities(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([adminGetStore(storeId), adminGetStoreMetricsToday(storeId)]);
      setStore(s);
      setMetrics(m);

      const storeAny = s as any;

      setForm({
        citySlug: s.city?.slug ?? "",
        storeCode: s.storeCode,
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        category: s.category,
        description: s.description,
        etaMin: s.etaMin,
        etaMax: s.etaMax,
        cel1: s.cel1 ?? "",
        cel2: s.cel2 ?? "",
        hrOp: s.hrOp ?? "",
        hrCl: s.hrCl ?? "",
        image: s.image ?? "",
        image2: s.image2 ?? "",
        image3: s.image3 ?? "",
        image4: s.image4 ?? "",
        isActive: s.isActive,
        isPaused: Boolean(s.isPaused),
        pausedReason: s.pausedReason ?? "",
        commissionRatePct: pctFromBps(s.commissionRateBps),
        premiumTier: s.premiumTier ?? "STANDARD",
        autoDecisionMode: s.autoDecisionMode,
        autoDecisionMinutes: s.autoDecisionMinutes,
        isBuyerRecommended: Boolean(s.isBuyerRecommended),
        buyerRecommendedOrder: s.buyerRecommendedOrder ?? "",
        buyerCardTitleOverride: s.buyerCardTitleOverride ?? "",
        buyerCardSubtitleOverride: s.buyerCardSubtitleOverride ?? "",
        buyerCardBadgeText: s.buyerCardBadgeText ?? "",
        buyerCardDistanceText: s.buyerCardDistanceText ?? "",
        buyerCardRatingText: s.buyerCardRatingText ?? "",
        buyerCardStickerEmoji: s.buyerCardStickerEmoji ?? "",
        buyerCardImageOrder: s.buyerCardImageOrder ?? "",

        productsFeatureEnabled: Boolean(storeAny.productsFeatureEnabled ?? true),
        storeAppCanManageProducts: Boolean(storeAny.storeAppCanManageProducts ?? true),
        storeAppCanCreateProducts: Boolean(storeAny.storeAppCanCreateProducts ?? true),
        storeAppCanEditProducts: Boolean(storeAny.storeAppCanEditProducts ?? true),
        storeAppCanDeleteProducts: Boolean(storeAny.storeAppCanDeleteProducts ?? true),
        storeAppCanChangeProductPrices: Boolean(storeAny.storeAppCanChangeProductPrices ?? true),
        storeAppCanUploadProductImages: Boolean(storeAny.storeAppCanUploadProductImages ?? true),
        storeAppCanUseProductCamera: Boolean(storeAny.storeAppCanUseProductCamera ?? true),
        storeAppCanImportProductsCsv: Boolean(storeAny.storeAppCanImportProductsCsv ?? true),
        storeAppCanToggleProductActive: Boolean(storeAny.storeAppCanToggleProductActive ?? true),
        storeAppCanToggleProductAvailable: Boolean(storeAny.storeAppCanToggleProductAvailable ?? true),
      });
    } catch (e: any) {
      setError(e?.message || "Error cargando tienda");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    if (!storeId) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const list = await adminListStoreProducts(storeId, { q: productQ, available: productAvail });
      setProducts(list);
    } catch (e: any) {
      setProductsError(e?.message || "Error cargando productos");
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (mode === "edit") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!storeId) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, productAvail]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const citySlug = String(form.citySlug || "").trim();
      if (!citySlug) throw new Error("Debes seleccionar una ciudad.");

      if (mode === "create") {
        const created = await adminCreateStore({
          citySlug,
          storeCode: String(form.storeCode || "").trim(),
          name: String(form.name || "").trim(),
          address: String(form.address || "").trim(),
          lat: Number(form.lat),
          lng: Number(form.lng),
          category: String(form.category || "").trim(),
          description: String(form.description || "").trim(),
          etaMin: Number(form.etaMin),
          etaMax: Number(form.etaMax),
          cel1: form.cel1 ? String(form.cel1) : null,
          cel2: form.cel2 ? String(form.cel2) : null,
          hrOp: form.hrOp ? String(form.hrOp) : null,
          hrCl: form.hrCl ? String(form.hrCl) : null,
          image: form.image ? String(form.image) : null,
          image2: form.image2 ? String(form.image2) : null,
          image3: form.image3 ? String(form.image3) : null,
          image4: form.image4 ? String(form.image4) : null,
        });
        setStore(created);
        onSaved();
      } else {
        if (!storeId) return;

        const updated = await adminUpdateStore(storeId, {
          citySlug,
          name: String(form.name || "").trim(),
          address: String(form.address || "").trim(),
          lat: Number(form.lat),
          lng: Number(form.lng),
          category: String(form.category || "").trim(),
          description: String(form.description || "").trim(),
          etaMin: Number(form.etaMin),
          etaMax: Number(form.etaMax),
          cel1: form.cel1 ? String(form.cel1) : null,
          cel2: form.cel2 ? String(form.cel2) : null,
          hrOp: form.hrOp ? String(form.hrOp) : null,
          hrCl: form.hrCl ? String(form.hrCl) : null,
          image: form.image ? String(form.image) : null,
          image2: form.image2 ? String(form.image2) : null,
          image3: form.image3 ? String(form.image3) : null,
          image4: form.image4 ? String(form.image4) : null,
          isActive: Boolean(form.isActive),
          isPaused: Boolean(form.isActive) ? Boolean(form.isPaused) : false,
          pausedReason:
            Boolean(form.isActive) && Boolean(form.isPaused)
              ? String(form.pausedReason || "").trim() || null
              : null,
          commissionRateBps: bpsFromPct(form.commissionRatePct),
          premiumTier: (form.premiumTier as StorePremiumTier) || "STANDARD",
          autoDecisionMode: form.autoDecisionMode === "AUTO_CONFIRM" ? "AUTO_CONFIRM" : "AUTO_REJECT",
          autoDecisionMinutes: Math.max(1, Math.round(Number(form.autoDecisionMinutes || 5))),
          isBuyerRecommended: Boolean(form.isBuyerRecommended),
          buyerRecommendedOrder:
            form.buyerRecommendedOrder === "" || form.buyerRecommendedOrder === null
              ? null
              : Math.max(0, Math.round(Number(form.buyerRecommendedOrder))),
          buyerCardTitleOverride: String(form.buyerCardTitleOverride || "").trim() || null,
          buyerCardSubtitleOverride: String(form.buyerCardSubtitleOverride || "").trim() || null,
          buyerCardBadgeText: String(form.buyerCardBadgeText || "").trim() || null,
          buyerCardDistanceText: String(form.buyerCardDistanceText || "").trim() || null,
          buyerCardRatingText: String(form.buyerCardRatingText || "").trim() || null,
          buyerCardStickerEmoji: String(form.buyerCardStickerEmoji || "").trim() || null,
          buyerCardImageOrder: String(form.buyerCardImageOrder || "").trim() || null,

          productsFeatureEnabled: Boolean(form.productsFeatureEnabled),
          storeAppCanManageProducts: Boolean(form.storeAppCanManageProducts),
          storeAppCanCreateProducts: Boolean(form.storeAppCanCreateProducts),
          storeAppCanEditProducts: Boolean(form.storeAppCanEditProducts),
          storeAppCanDeleteProducts: Boolean(form.storeAppCanDeleteProducts),
          storeAppCanChangeProductPrices: Boolean(form.storeAppCanChangeProductPrices),
          storeAppCanUploadProductImages: Boolean(form.storeAppCanUploadProductImages),
          storeAppCanUseProductCamera: Boolean(form.storeAppCanUseProductCamera),
          storeAppCanImportProductsCsv: Boolean(form.storeAppCanImportProductsCsv),
          storeAppCanToggleProductActive: Boolean(form.storeAppCanToggleProductActive),
          storeAppCanToggleProductAvailable: Boolean(form.storeAppCanToggleProductAvailable),
        } as any);

        setStore(updated);
        onSaved();
      }
    } catch (e: any) {
      setError(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    if (!storeId) return;
    const ok = window.confirm("¿Desactivar esta tienda? (No se borra, solo se marca inactiva)");
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      await adminDeactivateStore(storeId);
      onDeactivated();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error desactivando");
    } finally {
      setDeleting(false);
    }
  }

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

      const storeCode = String(store.storeCode ?? "").trim();

      const errors: string[] = [];
      const rowsToSend: Array<{
        externalId: string;
        name: string;
        description?: string | null;
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

  return (
    <div onMouseDown={(e) => overlayClose(e, onClose)} className="fixed inset-0 z-50 bg-black/30 p-3 md:p-6">
      <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 md:p-5">
          <div>
            <div className="text-sm text-slate-500">KroniX Control Center</div>
            <div className="text-lg font-semibold">{title}</div>

            {mode === "edit" && store ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className={["rounded-full px-2.5 py-1", storeStatusPill(store), storeStatusText(store)].join(" ")}>
                  estado: <b>{storeStatusLabel(store)}</b>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  premium: <b>{prettyTier(store.premiumTier)}</b>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  comisión: <b>{(store.commissionRateBps / 100).toFixed(2)}%</b>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  auto: <b>{store.autoDecisionMode === "AUTO_CONFIRM" ? "ON" : "OFF"}</b>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  min: <b>{store.autoDecisionMinutes}</b>
                </span>
                <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-fuchsia-700">
                  buyer recom.: <b>{store.isBuyerRecommended ? "Sí" : "No"}</b>
                </span>
                {store.city ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                    ciudad: <b>{store.city.name}, {store.city.department}</b>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-4 md:p-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="xl:col-span-3 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Detalle</div>
                  <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Ciudad</label>
                      <select
                        value={String(form?.citySlug ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, citySlug: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={citiesLoading}
                      >
                        <option value="">Selecciona una ciudad</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.slug}>
                            {city.name}, {city.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Código tienda</label>
                      <input
                        value={form?.storeCode ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, storeCode: e.target.value }))}
                        disabled={mode === "edit"}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Nombre</label>
                      <input
                        value={form?.name ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, name: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Dirección</label>
                      <input
                        value={form?.address ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, address: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Categoría</label>
                      <input
                        value={form?.category ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, category: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Imagen principal</label>
                      <input
                        value={form?.image ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, image: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Imagen 2</label>
                      <input
                        value={form?.image2 ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, image2: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Imagen 3</label>
                      <input
                        value={form?.image3 ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, image3: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Imagen 4</label>
                      <input
                        value={form?.image4 ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, image4: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Lat</label>
                      <input
                        value={String(form?.lat ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, lat: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Lng</label>
                      <input
                        value={String(form?.lng ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, lng: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">ETA min</label>
                      <input
                        value={String(form?.etaMin ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, etaMin: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">ETA max</label>
                      <input
                        value={String(form?.etaMax ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, etaMax: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Cel 1</label>
                      <input
                        value={form?.cel1 ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, cel1: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Cel 2</label>
                      <input
                        value={form?.cel2 ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, cel2: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Descripción</label>
                      <textarea
                        rows={3}
                        value={form?.description ?? ""}
                        onChange={(e) => setForm((s: any) => ({ ...s, description: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Operación + Buyer</div>

                  <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Estado</label>
                      <select
                        value={String(Boolean(form?.isActive))}
                        onChange={(e) =>
                          setForm((s: any) => ({
                            ...s,
                            isActive: e.target.value === "true",
                            isPaused: e.target.value === "true" ? Boolean(s.isPaused) : false,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Pausada</label>
                      <select
                        value={String(Boolean(form?.isPaused))}
                        onChange={(e) => setForm((s: any) => ({ ...s, isPaused: e.target.value === "true" }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={mode === "create" || !Boolean(form?.isActive)}
                      >
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Comisión (%)</label>
                      <input
                        value={String(form?.commissionRatePct ?? 8)}
                        onChange={(e) => setForm((s: any) => ({ ...s, commissionRatePct: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Razón pausa</label>
                      <input
                        value={String(form?.pausedReason ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, pausedReason: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create" || !Boolean(form?.isActive) || !Boolean(form?.isPaused)}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Plan</label>
                      <select
                        value={form?.premiumTier ?? "STANDARD"}
                        onChange={(e) => setForm((s: any) => ({ ...s, premiumTier: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="PREMIUM_PLUS">Premium+</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Auto-confirmación</label>
                      <select
                        value={form?.autoDecisionMode ?? "AUTO_REJECT"}
                        onChange={(e) =>
                          setForm((s: any) => ({
                            ...s,
                            autoDecisionMode: e.target.value === "AUTO_CONFIRM" ? "AUTO_CONFIRM" : "AUTO_REJECT",
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      >
                        <option value="AUTO_REJECT">OFF</option>
                        <option value="AUTO_CONFIRM">ON</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Minutos auto</label>
                      <input
                        value={String(form?.autoDecisionMinutes ?? 5)}
                        onChange={(e) => setForm((s: any) => ({ ...s, autoDecisionMinutes: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Recomendada Buyer</label>
                      <select
                        value={String(Boolean(form?.isBuyerRecommended))}
                        onChange={(e) => setForm((s: any) => ({ ...s, isBuyerRecommended: e.target.value === "true" }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      >
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Orden recomendado</label>
                      <input
                        value={String(form?.buyerRecommendedOrder ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerRecommendedOrder: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create" || !Boolean(form?.isBuyerRecommended)}
                        placeholder="0, 1, 2..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Sticker emoji</label>
                      <input
                        value={String(form?.buyerCardStickerEmoji ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardStickerEmoji: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                        placeholder="🐾"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Título tarjeta override</label>
                      <input
                        value={String(form?.buyerCardTitleOverride ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardTitleOverride: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Subtítulo tarjeta override</label>
                      <input
                        value={String(form?.buyerCardSubtitleOverride ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardSubtitleOverride: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Badge texto</label>
                      <input
                        value={String(form?.buyerCardBadgeText ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardBadgeText: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Distancia texto</label>
                      <input
                        value={String(form?.buyerCardDistanceText ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardDistanceText: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                        placeholder="1.2 km"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600">Rating texto</label>
                      <input
                        value={String(form?.buyerCardRatingText ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardRatingText: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                        placeholder="4.8"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Orden imágenes tarjeta</label>
                      <input
                        value={String(form?.buyerCardImageOrder ?? "")}
                        onChange={(e) => setForm((s: any) => ({ ...s, buyerCardImageOrder: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        disabled={mode === "create"}
                        placeholder="image,image3,image2,image4"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
                    Permisos catálogo / Store App
                  </div>

                  <div className="grid gap-3 p-4 md:grid-cols-2">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Catálogo habilitado</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.productsFeatureEnabled)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, productsFeatureEnabled: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede administrar productos</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanManageProducts)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanManageProducts: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede crear productos</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanCreateProducts)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanCreateProducts: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede editar productos</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanEditProducts)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanEditProducts: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede eliminar productos</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanDeleteProducts)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanDeleteProducts: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede cambiar precios</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanChangeProductPrices)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanChangeProductPrices: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede usar imágenes</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanUploadProductImages)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanUploadProductImages: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede usar cámara</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanUseProductCamera)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanUseProductCamera: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede importar CSV</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanImportProductsCsv)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanImportProductsCsv: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Puede activar / desactivar</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanToggleProductActive)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanToggleProductActive: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Puede cambiar disponibilidad</span>
                      <input
                        type="checkbox"
                        checked={Boolean(form?.storeAppCanToggleProductAvailable)}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, storeAppCanToggleProductAvailable: e.target.checked }))
                        }
                        disabled={mode === "create"}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Productos</div>

                  {mode !== "edit" || !storeId ? (
                    <div className="p-4 text-sm text-slate-600">Disponible después de crear la tienda.</div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {productsError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 whitespace-pre-line">
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
                                <th className="text-right">Precio</th>
                                <th>Disponible</th>
                                <th className="text-right">Acciones</th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                              {productsLoading ? (
                                <tr>
                                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                    Cargando productos...
                                  </td>
                                </tr>
                              ) : products.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
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
                                        {p.description ? <div className="text-xs text-slate-500">{p.description}</div> : null}
                                        {productAny.info ? (
                                          <div className="mt-1 text-xs text-slate-500">{productAny.info}</div>
                                        ) : null}
                                      </td>
                                      <td className="text-right font-medium">{formatCOP(p.priceCOP)}</td>
                                      <td>
                                        <span
                                          className={[
                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                            p.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700",
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
                                onChange={(e) => setProductForm((s: any) => ({ ...s, externalId: e.target.value }))}
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
                                onChange={(e) => setProductForm((s: any) => ({ ...s, description: e.target.value }))}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-slate-600">Info ampliada</label>
                              <textarea
                                value={String(productForm.info ?? "")}
                                onChange={(e) =>
                                  setProductForm((s: any) => ({
                                    ...s,
                                    info: e.target.value,
                                  }))
                                }
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Ingredientes, especificaciones, detalles importantes..."
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-600">price_cop</label>
                              <input
                                value={String(productForm.priceCOP)}
                                onChange={(e) => setProductForm((s: any) => ({ ...s, priceCOP: e.target.value }))}
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

                            <div>
                              <label className="text-xs font-medium text-slate-600">is_available</label>
                              <select
                                value={String(Boolean(productForm.isAvailable))}
                                onChange={(e) =>
                                  setProductForm((s: any) => ({ ...s, isAvailable: e.target.value === "true" }))
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
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Métricas de hoy</div>
                  <div className="p-4 text-sm">
                    {mode === "edit" ? (
                      metrics ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-slate-600">Órdenes</div>
                            <div className="font-semibold">{metrics.ordersCount}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-slate-600">Ventas</div>
                            <div className="font-semibold">{formatCOP(metrics.salesCOP)}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-slate-600">Comisión</div>
                            <div className="font-semibold">{formatCOP(metrics.commissionCOP)}</div>
                          </div>
                          <div className="pt-2 text-[11px] text-slate-500">Fecha: {metrics.date}</div>
                        </div>
                      ) : (
                        <div className="text-slate-500">Cargando métricas...</div>
                      )
                    ) : (
                      <div className="text-slate-500">Disponible después de crear.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Acciones</div>

                  <div className="p-4 space-y-3">
                    <button
                      onClick={save}
                      disabled={saving || loading || citiesLoading}
                      className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : mode === "create" ? "Crear tienda" : "Guardar cambios"}
                    </button>

                    {mode === "edit" ? (
                      <button
                        onClick={deactivate}
                        disabled={deleting || loading}
                        className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deleting ? "Desactivando..." : "Desactivar tienda"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">Guía rápida Buyer</div>
                  <div className="p-4 text-sm text-slate-600 space-y-2">
                    <div><b>Ciudad:</b> define en qué mercado aparecerá la tienda.</div>
                    <div><b>Recomendada Buyer:</b> controla si aparece en Recomendados.</div>
                    <div><b>Orden recomendado:</b> menor número = aparece primero.</div>
                    <div><b>Título/Subtítulo override:</b> sobreescribe texto de la tarjeta.</div>
                    <div><b>Orden imágenes:</b> ejemplo <code>image,image3,image2,image4</code>.</div>
                    <div><b>Sticker emoji:</b> ejemplo 🐾 👜 💊</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 md:p-5">
          <div className="text-xs text-slate-500">Tip: “Recomendada Buyer” se usa para Home → Recomendados.</div>
        </div>
      </div>
    </div>
  );
}