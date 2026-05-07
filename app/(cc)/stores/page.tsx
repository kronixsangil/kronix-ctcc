//app\(cc)\stores\page.tsx
"use client";

import StoresTab from "./components/StoresTab";

export default function StoresPage() {
  return (
    <main className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">
        Tiendas
      </h1>

      <StoresTab />
    </main>
  );
}