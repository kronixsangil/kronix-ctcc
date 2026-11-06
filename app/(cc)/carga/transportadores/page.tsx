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

  return <main>
    <header><p>Carga KroniX</p><h1>Transportadores de muestra</h1><p>Consulta la aprobación, el vehículo y la vigencia documental.</p></header>
    {error && <p role="alert">{error}</p>}
    {!error && !carriers && <p>Cargando…</p>}
    {carriers?.length === 0 && <p>Sin transportadores de muestra.</p>}
    {carriers?.map(carrier => <article key={carrier.name}>
      <div><strong>{carrier.name}</strong><p>{carrier.vehicle?.label ?? "Sin vehículo"}</p></div><span className="carga-status" data-active={carrier.approved}>{carrier.approved ? "Aprobado" : "Pendiente"}</span>
      <details><summary>Documentos ({carrier.documents.length})</summary>
      <ul style={{ marginBlock: 4, paddingInlineStart: 18 }}>
        {carrier.documents.map(doc => <li key={doc.reference}>
          {doc.type} · {doc.reference} · Vence {doc.expiresOn} · {doc.label}
        </li>)}
      </ul></details>
    </article>)}
  </main>;
}
