// app/(cc)/drivers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
    <main className="p-2 md:p-2 space-y-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>            
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Trabajadores</h1>           
            <div className="mt-0 flex flex-wrap gap-2 text-xs">             
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

      {tab === "PAYOUTS" && <PayoutsTab />}
      {tab === "DRIVERS" && <DriversTab />}
      {tab === "REWARDS" && <RewardsTab />}
      {tab === "USERS" && isAdmin && <UsersTab />}
    </main>
  );
}