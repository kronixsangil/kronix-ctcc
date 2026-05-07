//app\(cc)\security\components\SecurityHeader.tsx
"use client";

import { useCtccCity } from "../../components/CtccCityContext";

type SecurityTabKey = "OVERVIEW" | "USERS" | "SESSIONS" | "AUDIT";

export default function SecurityHeader({
  activeTab,
  onTabChange,
}: {
  activeTab: SecurityTabKey;
  onTabChange: (tab: SecurityTabKey) => void;
}) {
  const { isGlobal, cityLabel } = useCtccCity();

  const tabs: Array<{ key: SecurityTabKey; label: string }> = isGlobal
    ? [
        { key: "OVERVIEW", label: "Resumen" },
        { key: "USERS", label: "Usuarios" },
        { key: "SESSIONS", label: "Sesiones" },
        { key: "AUDIT", label: "Auditoría" },
      ]
    : [
        { key: "OVERVIEW", label: "Resumen" },
        { key: "USERS", label: "Usuarios" },
      ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              Multi-ciudad · Seguridad y trazabilidad
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              Seguridad
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Control interno, permisos, sesiones activas y trazabilidad administrativa
              del sistema KroniX.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                {isGlobal ? "Vista global: todas las ciudades" : `Ciudad activa: ${cityLabel}`}
              </span>

              <span className="rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-400/20">
                Módulo sensible
              </span>

              <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20">
                Solo ADMIN
              </span>
            </div>

            {!isGlobal ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                En vista por ciudad, este módulo muestra seguridad vinculada operativamente a la ciudad seleccionada.
                Las pestañas de sesiones y auditoría se administran únicamente desde Vista Global.
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={[
                    "rounded-2xl border px-4 py-2 text-sm font-medium transition",
                    active
                      ? "border-white/10 bg-white text-slate-900 shadow-sm"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}