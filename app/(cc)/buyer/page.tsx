// app/(cc)/buyer/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import BuyerCategoriesCard from "../stores/components/BuyerCategoriesCard";
import { useCtccCity } from "../components/CtccCityContext";

type WalletListItem = {
  wallet: {
    id: string;
    userId: string;
    cityId?: string;
    cashBalanceCOP: number;
    bonusBalanceCOP: number;
    totalAvailableCOP: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  city?: {
    id: string;
    name?: string | null;
    department?: string | null;
  } | null;
};

type WalletListResponse = {
  ok: boolean;
  items: WalletListItem[];
};

type WalletTxItem = {
  id: string;
  walletId: string;
  userId: string;
  cityId?: string;
  orderId?: string | null;
  createdByAdminId?: string | null;
  type: string;
  bucket: string;
  amountCOP: number;
  cashBalanceAfterCOP: number;
  bonusBalanceAfterCOP: number;
  reference?: string | null;
  note?: string | null;
  createdAt: string;
};

type WalletDetailResponse = {
  ok: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  city?: {
    id: string;
    name?: string | null;
    department?: string | null;
  } | null;
  wallet: {
    id: string;
    userId: string;
    cityId?: string;
    cashBalanceCOP: number;
    bonusBalanceCOP: number;
    totalAvailableCOP: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  items: WalletTxItem[];
};

type TxFilter = "ALL" | "INCOME" | "OUTCOME" | "RECHARGES" | "ORDERS" | "ADJUSTMENTS";

function formatCOP(value?: number | null) {
  return Number(value ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTxTone(amount: number) {
  return amount < 0
    ? {
        amountClass: "text-rose-700",
        chipClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        sign: "-",
        label: "Salida",
      }
    : {
        amountClass: "text-emerald-700",
        chipClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        sign: "+",
        label: "Ingreso",
      };
}

function getTxTitle(typeRaw?: string | null) {
  const type = String(typeRaw ?? "").toUpperCase();

  if (type === "RECHARGE_REAL") return "Recarga Wompi";
  if (type === "RECHARGE_WOMPI") return "Recarga Wompi";
  if (type === "RECHARGE_MOCK") return "Recarga mock";
  if (type === "ORDER_PAYMENT") return "Pago de pedido";
  if (type === "PROMO_BONUS") return "Bono promocional";
  if (type === "ADMIN_ADJUSTMENT") return "Ajuste administrativo";
  if (type === "REFUND") return "Reembolso";

  return type || "Movimiento";
}

function getTxKind(typeRaw?: string | null) {
  const type = String(typeRaw ?? "").toUpperCase();

  if (type === "RECHARGE_REAL" || type === "RECHARGE_WOMPI" || type === "RECHARGE_MOCK") {
    return "Recarga";
  }

  if (type === "ORDER_PAYMENT") return "Pedido";
  if (type === "ADMIN_ADJUSTMENT") return "Ajuste";
  if (type === "PROMO_BONUS") return "Bono";
  if (type === "REFUND") return "Reembolso";

  return "Wallet";
}

function buildCityScopedUrl(
  basePath: string,
  options?: {
    query?: string;
    limit?: number;
    cityId?: string | null;
  }
) {
  const params = new URLSearchParams();

  const query = String(options?.query ?? "").trim();
  const limit = Number(options?.limit ?? 0);
  const cityId = String(options?.cityId ?? "").trim();

  if (query) params.set("query", query);
  if (limit > 0) params.set("limit", String(limit));
  if (cityId) params.set("cityId", cityId);

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPersonLabel(item?: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  id?: string | null;
}) {
  return item?.name || item?.email || item?.phone || item?.id || "Usuario sin nombre";
}

function getCityText(item?: {
  name?: string | null;
  department?: string | null;
} | null) {
  if (!item) return "Ciudad no disponible";
  if (item.name && item.department) return `${item.name}, ${item.department}`;
  return item.name || "Ciudad no disponible";
}

export default function BuyerPage() {
  const { isGlobal, selectedCity, cityLabel } = useCtccCity();

  const cityTitle = selectedCity
    ? `${selectedCity.name}, ${selectedCity.department}`
    : cityLabel;

  const scopedCityId = !isGlobal ? String(selectedCity?.id ?? "").trim() : "";

  const [walletQuery, setWalletQuery] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [walletDetail, setWalletDetail] = useState<WalletDetailResponse | null>(null);

  const [adjustBucket, setAdjustBucket] = useState<"CASH" | "BONUS">("CASH");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);

  const [txFilter, setTxFilter] = useState<TxFilter>("ALL");

  async function loadWallets(query?: string) {
    setWalletLoading(true);
    setWalletError(null);

    try {
      const q = String(query ?? walletQuery).trim();

      const path = buildCityScopedUrl("/wallet/admin/list", {
        query: q,
        limit: 50,
        cityId: scopedCityId || undefined,
      });

      const res = await apiFetch<WalletListResponse>(path, { method: "GET" });
      const rows = Array.isArray(res?.items) ? res.items : [];

      setWallets(rows);

      if (rows.length > 0) {
        setSelectedUserId((prev) => {
          if (!prev) return rows[0].user.id;
          if (!rows.find((x) => x.user.id === prev)) return rows[0].user.id;
          return prev;
        });
      } else {
        setSelectedUserId("");
        setWalletDetail(null);
      }
    } catch (e: any) {
      setWalletError(e?.message || "No se pudo cargar el listado de wallets.");
      setWallets([]);
      setSelectedUserId("");
      setWalletDetail(null);
    } finally {
      setWalletLoading(false);
    }
  }

  async function loadWalletDetail(userId: string) {
    if (!userId) {
      setWalletDetail(null);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    setAdjustMsg(null);

    try {
      const path = buildCityScopedUrl(
        `/wallet/admin/by-user/${encodeURIComponent(userId)}`,
        {
          limit: 80,
          cityId: scopedCityId || undefined,
        }
      );

      const res = await apiFetch<WalletDetailResponse>(path, { method: "GET" });
      setWalletDetail(res);
    } catch (e: any) {
      setDetailError(e?.message || "No se pudo cargar el detalle del wallet.");
      setWalletDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadWallets("");
  }, [isGlobal, scopedCityId]);

  useEffect(() => {
    if (!selectedUserId) return;
    loadWalletDetail(selectedUserId);
  }, [selectedUserId, isGlobal, scopedCityId]);

  const selectedSummary = useMemo(() => {
    return wallets.find((x) => x.user.id === selectedUserId) ?? null;
  }, [wallets, selectedUserId]);

  const walletTotals = useMemo(() => {
    return wallets.reduce(
      (acc, item) => {
        acc.total += Number(item.wallet.totalAvailableCOP || 0);
        acc.cash += Number(item.wallet.cashBalanceCOP || 0);
        acc.bonus += Number(item.wallet.bonusBalanceCOP || 0);

        if (item.wallet.isActive) acc.active += 1;
        else acc.inactive += 1;

        return acc;
      },
      {
        total: 0,
        cash: 0,
        bonus: 0,
        active: 0,
        inactive: 0,
      }
    );
  }, [wallets]);

  const txStats = useMemo(() => {
    const items = walletDetail?.items ?? [];

    return items.reduce(
      (acc, item) => {
        const amount = Number(item.amountCOP ?? 0);
        const type = String(item.type ?? "").toUpperCase();

        if (amount > 0) acc.income += amount;
        if (amount < 0) acc.outcome += Math.abs(amount);
        if (type.includes("RECHARGE")) acc.recharges += Math.abs(amount);
        if (type === "ORDER_PAYMENT") acc.orders += Math.abs(amount);
        if (type === "ADMIN_ADJUSTMENT") acc.adjustments += Math.abs(amount);

        return acc;
      },
      {
        income: 0,
        outcome: 0,
        recharges: 0,
        orders: 0,
        adjustments: 0,
      }
    );
  }, [walletDetail?.items]);

  const filteredTransactions = useMemo(() => {
    const items = walletDetail?.items ?? [];

    return items.filter((item) => {
      const amount = Number(item.amountCOP ?? 0);
      const type = String(item.type ?? "").toUpperCase();

      if (txFilter === "INCOME") return amount > 0;
      if (txFilter === "OUTCOME") return amount < 0;
      if (txFilter === "RECHARGES") return type.includes("RECHARGE");
      if (txFilter === "ORDERS") return type === "ORDER_PAYMENT";
      if (txFilter === "ADJUSTMENTS") return type === "ADMIN_ADJUSTMENT";

      return true;
    });
  }, [walletDetail?.items, txFilter]);

  async function handleAdjustWallet() {
    const effectiveUserId =
      selectedUserId || selectedSummary?.user.id || walletDetail?.user.id || "";

    if (!effectiveUserId) {
      setAdjustMsg("⚠️ No hay usuario seleccionado. Selecciona uno del panel izquierdo.");
      return;
    }

    const amountCOP = Math.round(Number(adjustAmount || 0));

    if (!Number.isFinite(amountCOP) || amountCOP === 0) {
      setAdjustMsg("Escribe un valor válido distinto de 0.");
      return;
    }

    if (String(adjustNote).trim().length < 5) {
      setAdjustMsg("Escribe una nota mínima de 5 caracteres.");
      return;
    }

    setAdjusting(true);
    setAdjustMsg(null);

    try {
      await apiFetch("/wallet/admin/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          cityId: scopedCityId || undefined,
          bucket: adjustBucket,
          amountCOP,
          note: adjustNote.trim(),
        }),
      });

      setAdjustAmount("");
      setAdjustNote("");
      setAdjustMsg("Ajuste aplicado correctamente.");

      await loadWallets(walletQuery);
      await loadWalletDetail(effectiveUserId);
      setSelectedUserId(effectiveUserId);
    } catch (e: any) {
      setAdjustMsg(e?.message || "No se pudo aplicar el ajuste.");
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
        <div className="p-5 md:p-6">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              CTCC · Cliente Buyer · Wallet financiera
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              Cliente (Buyer)
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Configura categorías por ciudad, consulta saldos, audita recargas Wompi y realiza ajustes manuales controlados.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {isGlobal ? (
                <div className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20">
                  Vista global activa
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  Ciudad activa: {cityTitle}
                </div>
              )}

              <div className="inline-flex items-center rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-400/20">
                {isGlobal
                  ? "Wallet admin en vista global"
                  : `Wallet admin filtrado por ciudad: ${cityTitle}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGlobal ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-lg font-semibold text-amber-900">
            Buyer visual requiere ciudad, Wallet admin sigue el selector
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            La configuración visual del Buyer sigue siendo local por ciudad. Para editar categorías o banners selecciona una ciudad específica.
          </p>
        </div>
      ) : (
        <BuyerCategoriesCard citySlug={selectedCity?.slug || ""} cityLabel={cityTitle} />
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500">Control de Wallet</div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Wallets de usuarios</h2>
            <p className="mt-1 text-sm text-slate-600">
              Consulta saldo por usuario, revisa movimientos y valida el comportamiento financiero de KroniX Wallet.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <input
              value={walletQuery}
              onChange={(e) => setWalletQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadWallets(walletQuery);
              }}
              placeholder="Buscar por nombre, correo, teléfono o userId"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 sm:min-w-[340px]"
            />

            <button
              type="button"
              onClick={() => loadWallets(walletQuery)}
              disabled={walletLoading}
              className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {walletLoading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Saldo total
            </div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {formatCOP(walletTotals.total)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Cash
            </div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {formatCOP(walletTotals.cash)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Bono
            </div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {formatCOP(walletTotals.bonus)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Wallets
            </div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {walletTotals.active} activas
            </div>
            {walletTotals.inactive > 0 ? (
              <div className="mt-1 text-xs font-bold text-rose-700">
                {walletTotals.inactive} inactivas
              </div>
            ) : null}
          </div>
        </div>

        {walletError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {walletError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.45fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">
                Usuarios con wallet
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {walletLoading ? "Cargando..." : `${wallets.length} resultados`}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {wallets.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  No se encontraron wallets para la búsqueda actual.
                </div>
              ) : (
                wallets.map((item) => {
                  const active = item.user.id === selectedUserId;
                  const cityText = getCityText(item.city);

                  return (
                    <button
                      key={item.wallet.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(item.user.id);
                        setAdjustMsg(null);
                        setTxFilter("ALL");
                      }}
                      className={[
                        "w-full rounded-2xl border px-4 py-4 text-left transition",
                        active
                          ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-extrabold text-slate-900">
                            {getPersonLabel(item.user)}
                          </div>

                          <div className="mt-1 truncate text-xs text-slate-500">
                            {item.user.email || item.user.phone || item.user.id}
                          </div>

                          <div className="mt-1 text-[11px] font-semibold text-slate-500">
                            Ciudad wallet: {cityText}
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                              <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                Total
                              </div>
                              <div className="mt-1 text-xs font-black text-slate-900">
                                {formatCOP(item.wallet.totalAvailableCOP)}
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                              <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                Cash
                              </div>
                              <div className="mt-1 text-xs font-black text-slate-900">
                                {formatCOP(item.wallet.cashBalanceCOP)}
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                              <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                                Bono
                              </div>
                              <div className="mt-1 text-xs font-black text-slate-900">
                                {formatCOP(item.wallet.bonusBalanceCOP)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                              item.wallet.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
                            ].join(" ")}
                          >
                            {item.wallet.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Cargando detalle del wallet...
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                {detailError}
              </div>
            ) : !walletDetail ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Selecciona un usuario para ver su wallet.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {getPersonLabel(walletDetail.user)}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {walletDetail.user.email || walletDetail.user.phone || walletDetail.user.id}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        User ID: {walletDetail.user.id}
                      </div>

                      {walletDetail.city ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Ciudad wallet:{" "}
                          <span className="font-semibold text-slate-700">
                            {getCityText(walletDetail.city)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold",
                          walletDetail.wallet.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
                        ].join(" ")}
                      >
                        {walletDetail.wallet.isActive ? "Wallet activa" : "Wallet inactiva"}
                      </span>

                      <span className="inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white">
                        Total {formatCOP(walletDetail.wallet.totalAvailableCOP)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Cash
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {formatCOP(walletDetail.wallet.cashBalanceCOP)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Bono
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {formatCOP(walletDetail.wallet.bonusBalanceCOP)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Actualizado
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {formatDate(walletDetail.wallet.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                      Ingresos
                    </div>
                    <div className="mt-1 text-base font-black text-emerald-800">
                      {formatCOP(txStats.income)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-rose-700">
                      Salidas
                    </div>
                    <div className="mt-1 text-base font-black text-rose-800">
                      {formatCOP(txStats.outcome)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-sky-700">
                      Recargas
                    </div>
                    <div className="mt-1 text-base font-black text-sky-800">
                      {formatCOP(txStats.recharges)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-700">
                      Ajustes
                    </div>
                    <div className="mt-1 text-base font-black text-amber-800">
                      {formatCOP(txStats.adjustments)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-base font-black text-slate-900">Ajuste manual</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Usa valores positivos para sumar y negativos para descontar. Todo queda auditado.
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Bucket
                      </label>
                      <select
                        value={adjustBucket}
                        onChange={(e) => setAdjustBucket(e.target.value as "CASH" | "BONUS")}
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="CASH">CASH</option>
                        <option value="BONUS">BONUS</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Valor COP
                      </label>
                      <input
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="Ej: 10000 o -5000"
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Nota obligatoria
                      </label>
                      <input
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder="Motivo del ajuste"
                        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  {adjustMsg ? (
                    <div
                      className={[
                        "mt-4 rounded-2xl px-4 py-3 text-sm font-semibold",
                        adjustMsg.toLowerCase().includes("correctamente")
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-800",
                      ].join(" ")}
                    >
                      {adjustMsg}
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAdjustWallet}
                      disabled={adjusting || !selectedUserId}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {adjusting ? "Aplicando..." : "Aplicar ajuste"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900">
                        Auditoría / movimientos
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Últimas transacciones del wallet seleccionado.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        ["ALL", "Todo"],
                        ["RECHARGES", "Recargas"],
                        ["ORDERS", "Pedidos"],
                        ["ADJUSTMENTS", "Ajustes"],
                        ["INCOME", "Ingresos"],
                        ["OUTCOME", "Salidas"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTxFilter(value as TxFilter)}
                          className={[
                            "rounded-full px-3 py-1.5 text-[11px] font-extrabold transition",
                            txFilter === value
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => loadWalletDetail(selectedUserId)}
                        disabled={detailLoading}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        Actualizar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredTransactions.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                        No hay movimientos para este filtro.
                      </div>
                    ) : (
                      filteredTransactions.map((item) => {
                        const amount = Number(item.amountCOP ?? 0);
                        const tone = getTxTone(amount);
                        const absAmount = Math.abs(amount);

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-extrabold text-slate-900">
                                    {getTxTitle(item.type)}
                                  </div>

                                  <span
                                    className={[
                                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                                      tone.chipClass,
                                    ].join(" ")}
                                  >
                                    {tone.label}
                                  </span>

                                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 ring-1 ring-slate-200">
                                    {String(item.bucket ?? "").toUpperCase()}
                                  </span>

                                  <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-500 ring-1 ring-slate-200">
                                    {getTxKind(item.type)}
                                  </span>
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {formatDate(item.createdAt)}
                                </div>

                                {item.reference ? (
                                  <div className="mt-2 text-xs text-slate-500">
                                    Ref:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {item.reference}
                                    </span>
                                  </div>
                                ) : null}

                                {item.orderId ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    Orden:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {item.orderId}
                                    </span>
                                  </div>
                                ) : null}

                                {item.cityId ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    City ID:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {item.cityId}
                                    </span>
                                  </div>
                                ) : null}

                                {item.createdByAdminId ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    Admin ID:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {item.createdByAdminId}
                                    </span>
                                  </div>
                                ) : null}

                                {item.note ? (
                                  <div className="mt-2 text-sm text-slate-700">{item.note}</div>
                                ) : null}

                                <div className="mt-2 text-xs text-slate-500">
                                  Cash: {formatCOP(item.cashBalanceAfterCOP)} · Bono:{" "}
                                  {formatCOP(item.bonusBalanceAfterCOP)}
                                </div>
                              </div>

                              <div
                                className={[
                                  "shrink-0 text-right text-sm font-black",
                                  tone.amountClass,
                                ].join(" ")}
                              >
                                {tone.sign}
                                {formatCOP(absAmount)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}