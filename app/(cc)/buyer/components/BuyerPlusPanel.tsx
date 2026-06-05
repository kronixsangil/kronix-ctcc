//app\(cc)\buyer\components\BuyerPlusPanel.tsx
import { useState } from "react";
import type { BuyerAdminItem, KronixPlusApplication } from "../lib/buyerAdminApi";
import { formatDate, getPersonLabel, updateKronixPlusApplicationStatus } from "../lib/buyerAdminApi";

type Props = {
  buyer: BuyerAdminItem | null;
  application?: KronixPlusApplication | null;
  onUpdated: () => void | Promise<void>;
};

export default function BuyerPlusPanel({ buyer, application, onUpdated }: Props) {
  const [reviewNotes, setReviewNotes] = useState(application?.reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function updateStatus(status: "APPROVED" | "REJECTED" | "PENDING") {
    if (!application?.id) {
      setMsg("Este cliente todavía no tiene solicitud KroniX Plus.");
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await updateKronixPlusApplicationStatus(application.id, {
        status,
        reviewNotes: reviewNotes.trim() || null,
      });
      setMsg(status === "APPROVED" ? "Cliente aprobado para KroniX Envíos." : status === "REJECTED" ? "Solicitud rechazada." : "Solicitud devuelta a pendiente.");
      await onUpdated();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo actualizar la solicitud KroniX Plus.");
    } finally {
      setSaving(false);
    }
  }

  if (!buyer) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Selecciona un cliente para revisar KroniX Plus.
      </div>
    );
  }

  const status = String(application?.status ?? "NONE").toUpperCase();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden p-5 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_34%),linear-gradient(135deg,#03102b_0%,#082b63_55%,#0f172a_100%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100 ring-1 ring-white/15">KroniX Plus · Cliente Buyer</div>
            <h2 className="mt-3 text-2xl font-black leading-tight">{getPersonLabel(buyer)}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/75">Aprueba o rechaza el acceso a KroniX Envíos para negocios, tiendas y clientes frecuentes.</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {!application ? (
        <div className="p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
            Este cliente todavía no ha enviado solicitud para KroniX Plus.
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Negocio / actividad" value={application.businessName} />
            <Info label="Tipo de cliente" value={application.businessType} />
            <Info label="Contacto" value={application.contactName} />
            <Info label="Teléfono" value={application.phone} />
            <Info label="Email" value={application.email} />
            <Info label="Ciudad" value={application.cityName || application.citySlug} />
            <Info label="Envíos estimados / mes" value={application.expectedShipmentsPerMonth != null ? String(application.expectedShipmentsPerMonth) : "—"} />
            <Info label="Fecha solicitud" value={formatDate(application.createdAt)} />
            <Info label="Última actualización" value={formatDate(application.updatedAt)} />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Detalle enviado por cliente</div>
            <div className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{application.notes || "Sin notas."}</div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Nota interna CTCC</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              placeholder="Ej: Aprobado por volumen recurrente, cliente validado por llamada, etc."
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-300 focus:bg-white"
            />

            {msg ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{msg}</div> : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => updateStatus("PENDING")} disabled={saving} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-60">Dejar pendiente</button>
              <button type="button" onClick={() => updateStatus("REJECTED")} disabled={saving} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-800 hover:bg-rose-100 disabled:opacity-60">Rechazar</button>
              <button type="button" onClick={() => updateStatus("APPROVED")} disabled={saving} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">Aprobar KroniX Plus</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "APPROVED" ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/25" : status === "PENDING" ? "bg-amber-400/15 text-amber-200 ring-amber-300/25" : status === "REJECTED" ? "bg-rose-400/15 text-rose-200 ring-rose-300/25" : "bg-white/10 text-white/75 ring-white/15";
  const label = status === "APPROVED" ? "Aprobado" : status === "PENDING" ? "Pendiente" : status === "REJECTED" ? "Rechazado" : "Sin solicitud";
  return <span className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black ring-1 ${cls}`}>{label}</span>;
}

function Info({ label, value }: { label: string; value?: any }) {
  const clean = String(value ?? "").trim();
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-black text-slate-900">{clean || "—"}</div>
    </div>
  );
}
