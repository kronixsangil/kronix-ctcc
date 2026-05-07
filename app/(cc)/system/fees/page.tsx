//app\(cc)\system\fees\page.tsx
"use client";

import { useEffect, useState } from "react";

export default function FeesPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/system/config")
      .then(r => r.json())
      .then(setConfig);
  }, []);

  if (!config) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Tarifas del sistema</h1>

      <div className="mt-6 space-y-4">

        <div>
          <label>Domicilio base</label>
          <input
            value={config.baseDeliveryCOP}
            className="border p-2"
          />
        </div>

        <div>
          <label>Tienda extra</label>
          <input
            value={config.extraStoreDeliveryCOP}
            className="border p-2"
          />
        </div>

        <div>
          <label>Service fee</label>
          <input
            value={config.serviceFeePercent}
            className="border p-2"
          />
        </div>

      </div>
    </div>
  );
}