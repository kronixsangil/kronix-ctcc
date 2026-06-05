// app/(cc)/buyer/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../components/CtccCityContext";
import BuyerKpiCard from "./components/BuyerKpiCard";
import BuyersTable from "./components/BuyersTable";
import BuyerTabs, { type BuyerAdminTab } from "./components/BuyerTabs";
import BuyerProfilePanel from "./components/BuyerProfilePanel";
import BuyerWalletPanel from "./components/BuyerWalletPanel";
import BuyerPlusPanel from "./components/BuyerPlusPanel";
import {
  type BuyerAdminItem,
  type BuyersAdminResponse,
  type KronixPlusApplication,
  listBuyers,
  listKronixPlusApplications,
} from "./lib/buyerAdminApi";

export default function BuyerPage() {
  const { isGlobal, selectedCity, cityLabel } = useCtccCity();

  const cityTitle = selectedCity
    ? `${selectedCity.name}, ${selectedCity.department}`
    : cityLabel;

  const scopedCityId = !isGlobal ? String(selectedCity?.id ?? "").trim() : "";
  const scopedCitySlug = !isGlobal ? String(selectedCity?.slug ?? "").trim() : "";

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyersResponse, setBuyersResponse] = useState<BuyersAdminResponse | null>(null);

  const [plusLoading, setPlusLoading] = useState(false);
  const [plusError, setPlusError] = useState<string | null>(null);
  const [plusApplications, setPlusApplications] = useState<KronixPlusApplication[]>([]);

  const [selectedBuyer, setSelectedBuyer] = useState<BuyerAdminItem | null>(null);
  const [activeTab, setActiveTab] = useState<BuyerAdminTab>("PROFILE");

  async function loadBuyers() {
    setLoading(true);
    setError(null);

    try {
      const res = await listBuyers({
        q: query,
        status,
        page,
        limit,
        citySlug: scopedCitySlug || undefined,
      });

      const rows = Array.isArray(res?.items) ? res.items : [];
      setBuyersResponse({ ...res, items: rows });

      setSelectedBuyer((prev) => {
        if (prev && rows.some((item) => item.id === prev.id)) return prev;
        return rows[0] ?? null;
      });
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el listado de clientes.");
      setBuyersResponse(null);
      setSelectedBuyer(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlusApplications() {
    setPlusLoading(true);
    setPlusError(null);

    try {
      const res = await listKronixPlusApplications({
        citySlug: scopedCitySlug || undefined,
        status: "ALL",
      });
      setPlusApplications(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setPlusApplications([]);
      setPlusError(
        e?.message ||
          "No se pudieron cargar solicitudes KroniX Plus. Verifica que los endpoints admin estén activos en API."
      );
    } finally {
      setPlusLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [scopedCitySlug, status, limit]);

  useEffect(() => {
    loadBuyers();
    loadPlusApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, scopedCitySlug]);

  const buyers = buyersResponse?.items ?? [];

  const plusByUserId = useMemo(() => {
    const map = new Map<string, KronixPlusApplication>();
    for (const app of plusApplications) {
      const userId = String(app.userId ?? app.user?.id ?? "").trim();
      if (userId) map.set(userId, app);
    }
    return map;
  }, [plusApplications]);

  const selectedPlusApplication = selectedBuyer
    ? plusByUserId.get(selectedBuyer.id) ?? null
    : null;

  const plusSummary = useMemo(() => {
    return plusApplications.reduce(
      (acc, app) => {
        const s = String(app.status ?? "").toUpperCase();
        acc.total += 1;
        if (s === "PENDING") acc.pending += 1;
        if (s === "APPROVED") acc.approved += 1;
        if (s === "REJECTED") acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [plusApplications]);

  const summary = buyersResponse?.summary;
  const total = Number(buyersResponse?.total ?? summary?.totalClients ?? buyers.length);
  const activeCount = buyers.filter((item) => !item.deletedAt).length;
  const legalCurrent = Number(
    summary?.legalCurrent ?? buyers.filter((item) => item.legal?.legalCurrent).length
  );

  function selectBuyer(buyer: BuyerAdminItem, tab: BuyerAdminTab) {
    setSelectedBuyer(buyer);
    setActiveTab(tab);
  }

  function resetFilters() {
    setQuery("");
    setStatus("ALL");
    setPage(1);
    setLimit(10);
  }

  async function refreshAll() {
    await Promise.all([loadBuyers(), loadPlusApplications()]);
  }

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">KroniX Control Center</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Clientes
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Gestión profesional de compradores: perfil, wallet financiera y aprobación KroniX Plus para KroniX Envíos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {isGlobal ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                  Vista global activa
                </span>
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  Ciudad activa: {cityTitle}
                </span>
              )}

              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
                {plusLoading ? "Plus cargando..." : `${plusSummary.pending} solicitudes Plus pendientes`}
              </span>
            </div>
          </div>

          <BuyerTabs value={activeTab} onChange={setActiveTab} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <BuyerKpiCard label="Total clientes" value={total} helper={isGlobal ? "Vista global" : cityTitle} />
        <BuyerKpiCard label="Activos en vista" value={activeCount} helper="No eliminados" tone="emerald" />
        <BuyerKpiCard label="Legal OK" value={legalCurrent} helper="Términos y privacidad vigentes" tone="sky" />
        <BuyerKpiCard
          label="Plus pendientes"
          value={plusSummary.pending}
          helper={`${plusSummary.approved} aprobados`}
          tone={plusSummary.pending > 0 ? "amber" : "emerald"}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_120px_120px_120px]">
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Buscar cliente
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  loadBuyers();
                }
              }}
              placeholder="Nombre, teléfono, correo o userId..."
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Por página
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 10)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadBuyers();
              loadPlusApplications();
            }}
            className="mt-6 h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={loading || plusLoading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
        {plusError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {plusError}
          </div>
        ) : null}
      </section>

      <BuyersTable
        buyers={buyers}
        selectedBuyerId={selectedBuyer?.id || ""}
        loading={loading}
        plusByUserId={plusByUserId}
        onSelect={selectBuyer}
      />

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-xs font-bold text-slate-500">
          Página {page} · {buyers.length} registros en pantalla
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={buyers.length < limit || loading}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {selectedBuyer ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Cliente seleccionado
              </div>
              <div className="mt-1 text-xl font-black text-slate-950">
                {selectedBuyer.name || selectedBuyer.email || selectedBuyer.phone || selectedBuyer.id}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                {selectedBuyer.email || "Sin correo"} · {selectedBuyer.phone || "Sin teléfono"}
              </div>
            </div>
            <BuyerTabs value={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-4">
            {activeTab === "PROFILE" ? <BuyerProfilePanel buyer={selectedBuyer} /> : null}
            {activeTab === "WALLET" ? (
              <BuyerWalletPanel buyer={selectedBuyer} cityId={scopedCityId || undefined} />
            ) : null}
            {activeTab === "PLUS" ? (
              <BuyerPlusPanel
                buyer={selectedBuyer}
                application={selectedPlusApplication}
                onUpdated={refreshAll}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
