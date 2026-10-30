"use client";

import { useCallback, useEffect, useState } from "react";
import { CarpoolDocument, CarpoolDriverApplication, listCarpoolDrivers, reviewCarpoolDriver, reviewCarpoolVehicle } from "./lib/driversApi";

const label: Record<string, string> = { DRIVER_LICENSE: "Licencia", SOAT: "SOAT", TECHNOMECHANICAL: "Tecnomecánica", VEHICLE_PHOTO: "Foto del vehículo" };
const statusLabel: Record<string, string> = { PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado", SUSPENDED: "Suspendido" };
const tone: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-700", SUSPENDED: "bg-slate-200 text-slate-700" };
const documentUrl = (doc: CarpoolDocument) => "/api/ctcc" + doc.fileUrl;
const isImage = (doc: CarpoolDocument) => /\.(jpe?g|png|webp)$/i.test(doc.fileUrl);

export default function CarpoolDriversPage() {
  const [rows, setRows] = useState<CarpoolDriverApplication[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<CarpoolDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => { try { setError(""); setRows(await listCarpoolDrivers()); } catch (e: any) { setError(e?.message || "No fue posible cargar las solicitudes."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function decide(row: CarpoolDriverApplication, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    const reason = status === "APPROVED" ? undefined : window.prompt(status === "REJECTED" ? "Motivo del rechazo:" : "Motivo de suspensión:") || undefined;
    if (status !== "APPROVED" && !reason) return;
    try { setBusy(row.id); await reviewCarpoolDriver(row.id, status, reason); await load(); } catch (e: any) { setError(e?.message || "No fue posible actualizar la solicitud."); } finally { setBusy(""); }
  }
  async function decideVehicle(id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    const reason = status === "APPROVED" ? undefined : window.prompt(status === "REJECTED" ? "Motivo del rechazo del vehículo:" : "Motivo de suspensión del vehículo:") || undefined;
    if (status !== "APPROVED" && !reason) return;
    try { setBusy(id); await reviewCarpoolVehicle(id, status, reason); await load(); } catch (e: any) { setError(e?.message || "No fue posible actualizar el vehículo."); } finally { setBusy(""); }
  }
  function documents(items: CarpoolDocument[]) {
    return <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">{items.map((doc) => <button type="button" key={doc.id} onClick={() => setPreview(doc)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm hover:border-blue-400">
      {isImage(doc) ? <img src={documentUrl(doc)} alt={label[doc.type] || doc.type} className="h-24 w-full object-cover" /> : <div className="grid h-24 place-items-center bg-red-50 text-3xl">📄</div>}
      <span className="block truncate px-3 py-2 text-xs font-bold text-slate-700">{label[doc.type] || doc.type}</span>
    </button>)}</div>;
  }

  return <main className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-600">Ruta KroniX</p><h1 className="text-3xl font-black text-slate-950">Conductores</h1><p className="mt-2 text-sm text-slate-500">Solicitudes pendientes y conductores aprobados.</p></div><a href="/ruta-kronix/routes" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Trayectos</a></header>
    {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
    {loading ? <div className="rounded-3xl bg-white p-8 text-slate-500">Cargando solicitudes…</div> : null}
    {!loading && rows.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center"><h2 className="font-bold text-slate-900">No hay solicitudes todavía</h2></div> : null}
    <section className="grid gap-3">{rows.map((row) => {
      const open = row.driverApprovalStatus !== "APPROVED" || Boolean(expanded[row.id]);
      return <article key={row.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="font-black text-slate-950">{row.user.name}</h2><p className="text-sm text-slate-500">{row.user.phone}{row.user.email ? " · " + row.user.email : ""} · {row.user.carpoolVehicles.length} vehículo(s)</p></div><div className="flex items-center gap-2"><span className={"rounded-full px-3 py-1 text-xs font-black " + (tone[row.driverApprovalStatus] || tone.PENDING)}>{statusLabel[row.driverApprovalStatus] || row.driverApprovalStatus}</span><button type="button" onClick={() => setExpanded((old) => ({ ...old, [row.id]: !open }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">{open && row.driverApprovalStatus === "APPROVED" ? "Cerrar" : "Ver / gestionar"}</button></div></div>
        {open ? <div className="border-t border-slate-100 p-5"><div className="grid gap-5 lg:grid-cols-2"><div><h3 className="font-bold text-slate-900">Documentos personales</h3>{documents(row.documents)}</div><div className="space-y-3">{row.user.carpoolVehicles.map((vehicle) => <div key={vehicle.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{vehicle.brand} {vehicle.line || ""} · {vehicle.plate}</h3><p className="text-xs text-slate-500">{vehicle.color} · {vehicle.layout === "SEVEN_SEATS" ? "7 puestos" : "5 puestos"}</p></div><span className={"rounded-full px-2 py-1 text-[10px] font-black " + (tone[vehicle.status] || tone.PENDING)}>{statusLabel[vehicle.status] || vehicle.status}</span></div>{documents(vehicle.documents)}<div className="mt-3 flex flex-wrap gap-2">{vehicle.status === "PENDING" ? <><button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "APPROVED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Aprobar vehículo</button><button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "REJECTED")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">Rechazar vehículo</button></> : null}{vehicle.status === "APPROVED" ? <button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "SUSPENDED")} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white">Suspender vehículo</button> : null}{["REJECTED", "SUSPENDED"].includes(vehicle.status) ? <button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "APPROVED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Aprobar nuevamente</button> : null}</div></div>)}</div></div><div className="mt-5 flex flex-wrap gap-2">{row.driverApprovalStatus !== "APPROVED" ? <button disabled={busy === row.id} onClick={() => void decide(row, "APPROVED")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Aprobar conductor</button> : null}{row.driverApprovalStatus === "PENDING" ? <button disabled={busy === row.id} onClick={() => void decide(row, "REJECTED")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">Rechazar</button> : null}{row.driverApprovalStatus === "APPROVED" ? <button disabled={busy === row.id} onClick={() => void decide(row, "SUSPENDED")} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white">Suspender</button> : null}</div></div> : null}
      </article>;
    })}</section>
    {preview ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4" onClick={() => setPreview(null)}><div className="relative h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b px-4 py-3"><b>{label[preview.type] || preview.type}</b><div className="flex gap-2"><a href={documentUrl(preview)} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1 text-sm font-bold">Abrir aparte</a><button onClick={() => setPreview(null)} className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-bold text-white">Cerrar</button></div></div>{isImage(preview) ? <img src={documentUrl(preview)} alt={label[preview.type] || preview.type} className="h-[calc(85vh-57px)] w-full object-contain" /> : <iframe title={label[preview.type] || preview.type} src={documentUrl(preview)} className="h-[calc(85vh-57px)] w-full" />}</div></div> : null}
  </main>;
}
