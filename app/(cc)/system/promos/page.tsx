//app/(cc)/system/promos/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function PromosPage() {
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/system/promos")
      .then(r => r.json())
      .then(setPromos);
  }, []);

  return (
    <div className="p-6">

      <h1 className="text-xl font-bold">
        Promociones
      </h1>

      <div className="mt-6 space-y-4">

        {promos.map(p => (
          <div
            key={p.id}
            className="border rounded p-4"
          >
            <div className="font-semibold">
              {p.title}
            </div>

            <div>
              Código: {p.code}
            </div>

            <div>
              Descuento: {p.discountValue}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}