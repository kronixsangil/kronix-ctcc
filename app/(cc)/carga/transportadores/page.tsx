"use client";

import { useEffect, useState } from "react";

type Carrier = {
  name: string;
  approved: boolean;
  vehicle: { label: string };
  documents: { type: string; reference: string; expiresOn: string; label: string }[];
};

export default function CargaCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/ctcc/admin/carga-kronix/test-carriers", { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "No se pudo consultar Carga.");
        setCarriers(data);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Error de conexión.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return <main style={{ display: "grid", gap: 8, maxWidth: 850 }}>
    <h1>Transportadores de muestra</h1>
    {error && <p role="alert">{error}</p>}
    {!error && !carriers && <p>Cargando…</p>}
    {carriers?.length === 0 && <p>Sin transportadores de muestra.</p>}
    {carriers?.map(carrier => <article key={carrier.name} style={{ padding: 8, border: "1px solid #dce5ee", borderRadius: 8 }}>
      <strong>{carrier.name} · {carrier.approved ? "Aprobado" : "Pendiente"}</strong>
      <div>{carrier.vehicle.label}</div>
      <ul style={{ marginBlock: 4, paddingInlineStart: 18 }}>
        {carrier.documents.map(doc => <li key={doc.reference}>
          {doc.type} · {doc.reference} · Vence {doc.expiresOn} · {doc.label}
        </li>)}
      </ul>
    </article>)}
  </main>;
}
