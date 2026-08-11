// app/(cc)/drivers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCtccCity } from "../components/CtccCityContext";

import PayoutsTab from "./components/PayoutsTab";
import DriversTab from "./components/DriversTab";
import UsersTab from "./components/UsersTab";
import RewardsTab from "./components/RewardsTab";

type Tab =
  | "PAYOUTS"
  | "DRIVERS"
  | "REWARDS"
  | "USERS";

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-medium border transition",
        active
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function DriversPage() {
  const [tab, setTab] = useState<Tab>("PAYOUTS");
  const { isGlobal, citySlug } = useCtccCity();
  const [meRole, setMeRole] = useState<string>("");
  const [rechargeConfig, setRechargeConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch<any>("/auth/me");
        const role = String(r?.user?.role ?? "").toUpperCase();
        setMeRole(role);
      } catch {
        setMeRole("");
      }
    })();
  }, []);

  const isAdmin = meRole === "ADMIN";

  useEffect(() => {
    if (isGlobal || !citySlug) {
      setRechargeConfig(null);
      return;
    }
    let alive = true;
    setConfigLoading(true);
    apiFetch<any>(`/wallet/admin/recharge-config?citySlug=${encodeURIComponent(citySlug)}`)
      .then((r) => { if (alive) setRechargeConfig(r?.config ?? null); })
      .catch(() => { if (alive) setRechargeConfig(null); })
      .finally(() => { if (alive) setConfigLoading(false); });
    return () => { alive = false; };
  }, [citySlug, isGlobal]);

  async function saveRechargeConfig(patch: Record<string, unknown>) {
    if (!citySlug || isGlobal) return;
    setConfigSaving(true);
    try {
      const r = await apiFetch<any>(`/wallet/admin/recharge-config?citySlug=${encodeURIComponent(citySlug)}`, {
        method: "POST",
        body: JSON.stringify({ ...rechargeConfig, ...patch }),
      });
      setRechargeConfig(r?.config ?? null);
    } finally {
      setConfigSaving(false);
    }
  }

  return (
    <main className="p-2 md:p-2 space-y-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>            
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Trabajadores</h1>           
            <div className="mt-0 flex flex-wrap gap-2 text-xs">             
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">Wompi Workers</span>
              <button
                type="button"
                disabled={isGlobal || !citySlug || configLoading || configSaving || !rechargeConfig}
                onClick={() => saveRechargeConfig({ wompiEnabled: !rechargeConfig?.wompiEnabled })}
                className={[
                  "relative h-6 w-11 rounded-full transition disabled:opacity-50",
                  rechargeConfig?.wompiEnabled ? "bg-emerald-500" : "bg-slate-300",
                ].join(" ")}
                title={isGlobal ? "Selecciona una ciudad" : "Activar o desactivar Wompi para trabajadores"}
              >
                <span className={[
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition",
                  rechargeConfig?.wompiEnabled ? "left-6" : "left-1",
                ].join(" ")} />
              </button>
              <button type="button" onClick={() => setConfigOpen((v) => !v)} disabled={isGlobal || !rechargeConfig} className="text-xs font-bold text-blue-700 disabled:opacity-40">Configurar</button>
            </div>
            <TabButton active={tab === "PAYOUTS"} label="Pagos" onClick={() => setTab("PAYOUTS")} />
            <TabButton active={tab === "DRIVERS"} label="Trabajadores" onClick={() => setTab("DRIVERS")} />
              <TabButton
  active={tab === "REWARDS"}
  label="Recompensas"
  onClick={() => setTab("REWARDS")}
/>
            {isAdmin ? (
              <TabButton active={tab === "USERS"} label="Usuarios" onClick={() => setTab("USERS")} />
            ) : null}
          </div>
        </div>
      </div>

      {configOpen && rechargeConfig ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recargas de trabajadores</h2>
              <p className="mt-1 text-xs text-slate-500">Configura el canal manual que reemplaza temporalmente a Wompi.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={Boolean(rechargeConfig.manualRechargeEnabled)} onChange={(e) => setRechargeConfig((c: any) => ({ ...c, manualRechargeEnabled: e.target.checked }))} />
              Recarga manual activa
            </label>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr_auto]">
            <input value={rechargeConfig.whatsappNumber ?? ""} onChange={(e) => setRechargeConfig((c: any) => ({ ...c, whatsappNumber: e.target.value }))} placeholder="WhatsApp: 573113868898" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input value={rechargeConfig.whatsappMessage ?? ""} onChange={(e) => setRechargeConfig((c: any) => ({ ...c, whatsappMessage: e.target.value }))} placeholder="Mensaje inicial" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button type="button" disabled={configSaving} onClick={() => saveRechargeConfig(rechargeConfig)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{configSaving ? "Guardando..." : "Guardar"}</button>
          </div>
        </section>
      ) : null}

      {tab === "PAYOUTS" && <PayoutsTab />}
      {tab === "DRIVERS" && <DriversTab />}
      {tab === "REWARDS" && <RewardsTab />}
      {tab === "USERS" && isAdmin && <UsersTab />}
    </main>
  );
}