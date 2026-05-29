//app\(cc)\legal\page.tsx
"use client";

import { useState } from "react";
import LegalDriversTab from "./components/LegalDriversTab";
import LegalStoresTab from "./components/LegalStoresTab";
import LegalDocumentsTab from "./components/LegalDocumentsTab";

type Tab = "DRIVERS" | "STORES" | "BUYERS" | "DOCUMENTS";

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
        "rounded-xl border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>("DRIVERS");

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm text-slate-500">
              KroniX Control Center
            </div>

            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Legal Center
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Auditoría legal, versiones documentales y cumplimiento normativo
              de conductores, comercios, clientes y personal administrativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TabButton
              active={tab === "DRIVERS"}
              label="Conductores"
              onClick={() => setTab("DRIVERS")}
            />

            <TabButton
              active={tab === "STORES"}
              label="Tiendas"
              onClick={() => setTab("STORES")}
            />

            <TabButton
              active={tab === "BUYERS"}
              label="Clientes"
              onClick={() => setTab("BUYERS")}
            />

            <TabButton
              active={tab === "DOCUMENTS"}
              label="Documentos"
              onClick={() => setTab("DOCUMENTS")}
            />
          </div>
        </div>
      </div>

      {tab === "DRIVERS" ? <LegalDriversTab /> : null}
      {tab === "STORES" ? <LegalStoresTab /> : null}
      {tab === "DOCUMENTS" ? <LegalDocumentsTab /> : null}

      {tab === "BUYERS" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Legal Clientes
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Aquí conectaremos la auditoría legal de clientes.
          </p>
        </div>
      ) : null}
    </main>
  );
}