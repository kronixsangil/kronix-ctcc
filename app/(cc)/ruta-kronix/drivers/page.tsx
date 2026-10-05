"use client";

import { useCallback, useEffect, useState } from "react";
import { CarpoolDriverApplication, listCarpoolDrivers, reviewCarpoolDriver, reviewCarpoolVehicle } from "./lib/driversApi";

const label: Record<string, string> = { DRIVER_LICENSE: "Licencia", SOAT: "SOAT", TECHNOMECHANICAL: "Tecnomecánica", VEHICLE_PHOTO: "Foto del vehículo" };
const tone: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-700", SUSPENDED: "bg-slate-200 text-slate-700" };

export default function CarpoolDriversPage() {
  const [rows, setRows] = useState<CarpoolDriverApplication[]>([]);
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
  return <main className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-600">Ruta KroniX</p><h1 className="text-3xl font-black text-slate-950">Conductores</h1><p className="mt-2 text-sm text-slate-500">Revisión manual de licencia, vehículo, SOAT y tecnomecánica.</p></div><a href="/ruta-kronix/routes" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Trayectos</a></header>
    {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
    {loading ? <div className="rounded-3xl bg-white p-8 text-slate-500">Cargando solicitudes…</div> : null}
    {!loading && rows.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center"><h2 className="font-bold text-slate-900">No hay solicitudes todavía</h2><p className="mt-2 text-sm text-slate-500">Aparecerán cuando una persona complete su registro como conductor.</p></div> : null}
    <section className="grid gap-5">{rows.map((row) => <article key={row.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">{row.user.name}</h2><p className="text-sm text-slate-500">{row.user.phone}{row.user.email ? " · " + row.user.email : ""}</p></div><span className={"rounded-full px-3 py-1 text-xs font-black " + (tone[row.driverApprovalStatus] || tone.PENDING)}>{row.driverApprovalStatus}</span></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><h3 className="font-bold text-slate-900">Documentos personales</h3><div className="mt-2 flex flex-wrap gap-2">{row.documents.map((doc) => <a key={doc.id} href={"/api/ctcc" + doc.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{label[doc.type] || doc.type}</a>)}</div></div>
        {row.user.carpoolVehicles.map((vehicle) => <div key={vehicle.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{vehicle.brand} {vehicle.line || ""} · {vehicle.plate}</h3><p className="text-xs text-slate-500">{vehicle.color} · {vehicle.layout === "SEVEN_SEATS" ? "7 puestos" : "5 puestos"}</p></div><span className={"rounded-full px-2 py-1 text-[10px] font-black " + (tone[vehicle.status] || tone.PENDING)}>{vehicle.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{vehicle.documents.map((doc) => <a key={doc.id} href={"/api/ctcc" + doc.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{label[doc.type] || doc.type}</a>)}</div><div className="mt-3 flex flex-wrap gap-2">{vehicle.status === "PENDING" ? <><button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "APPROVED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Aprobar vehículo</button><button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "REJECTED")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">Rechazar vehículo</button></> : null}{vehicle.status === "APPROVED" ? <button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "SUSPENDED")} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white">Suspender vehículo</button> : null}{["REJECTED", "SUSPENDED"].includes(vehicle.status) ? <button disabled={busy === vehicle.id} onClick={() => void decideVehicle(vehicle.id, "APPROVED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Aprobar nuevamente</button> : null}</div></div>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><button disabled={busy === row.id} onClick={() => void decide(row, "APPROVED")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Aprobar conductor</button><button disabled={busy === row.id} onClick={() => void decide(row, "REJECTED")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Rechazar</button>{row.driverApprovalStatus === "APPROVED" ? <button disabled={busy === row.id} onClick={() => void decide(row, "SUSPENDED")} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Suspender</button> : null}</div>
    </article>)}</section>
  </main>;
}
