// app/(cc)/drivers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import PayoutsTab from "./components/PayoutsTab";
import DriversTab from "./components/DriversTab";
import UsersTab from "./components/UsersTab";

type Tab = "PAYOUTS" | "DRIVERS" | "USERS";

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
  const [meRole, setMeRole] = useState<string>("");

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

  return (
    <main className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm text-slate-500">KroniX Control Center</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Conductores</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestión operativa de conductores, pagos semanales, elegibilidad, documentos y usuarios internos.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                Módulo operativo
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                Rol actual: <span className="font-semibold text-slate-900">{meRole || "—"}</span>
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                Vista:{" "}
                <span className="font-semibold text-slate-900">
                  {tab === "PAYOUTS" ? "Pagos" : tab === "DRIVERS" ? "Conductores" : "Usuarios"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={tab === "PAYOUTS"} label="Pagos" onClick={() => setTab("PAYOUTS")} />
            <TabButton active={tab === "DRIVERS"} label="Conductores" onClick={() => setTab("DRIVERS")} />
            {isAdmin ? (
              <TabButton active={tab === "USERS"} label="Usuarios" onClick={() => setTab("USERS")} />
            ) : null}
          </div>
        </div>
      </div>

      {tab === "PAYOUTS" && <PayoutsTab />}
      {tab === "DRIVERS" && <DriversTab />}
      {tab === "USERS" && isAdmin && <UsersTab />}
    </main>
  );
}