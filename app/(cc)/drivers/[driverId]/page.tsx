// app/(cc)/drivers/[driverId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatCOP, toISODate } from "@/lib/format";
import { useCtccCity } from "../../components/CtccCityContext";

type WorkerTab = "GENERAL" | "TYPES" | "WALLET" | "VEHICLE" | "DOCUMENTS" | "HISTORY";

type WorkerTypeCode = "MOTORCYCLE" | "TAXI" | "MOTORCARGO";

type DriverDocumentCheck = {
  id?: string;
  type: string;
  status: string;
  documentNumber?: string | null;
  expiresAt?: string | null;
  internalNotes?: string | null;
  waiverReason?: string | null;
  waiverExpiresAt?: string | null;
};

type WorkerProfileResponse = {
  ok: true;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    profileImageUrl?: string | null;
  };
  driverProfile: any;
  vehicle: any | null;
  docs: any;
  inactiveInfo: any;
  history: {
    orders: any[];
    payouts: any[];
    bonuses?: any[];
    sanctions?: any[];
  };
};

const WORKER_TYPE_OPTIONS: Array<{
  value: WorkerTypeCode;
  label: string;
  hint: string;
  tone: string;
}> = [
  {
    value: "MOTORCYCLE",
    label: "Domiciliario",
    hint: "Delivery + Envíos",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "TAXI",
    label: "Taxista",
    hint: "Taxi",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    value: "MOTORCARGO",
    label: "Motocarguero",
    hint: "Motocarga",
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
];

const DOCUMENT_TYPES = [
  "ID_CARD",
  "DRIVER_LICENSE",
  "SELFIE_OR_PROFILE_PHOTO",
  "SOAT",
  "TECHNOMECHANICAL",
  "VEHICLE_OWNERSHIP_CARD",
  "VEHICLE_PHOTO_OR_INSPECTION",
  "BACKGROUND_CHECK",
] as const;

const DOCUMENT_LABELS: Record<string, string> = {
  ID_CARD: "Cédula",
  DRIVER_LICENSE: "Licencia de conducción",
  SELFIE_OR_PROFILE_PHOTO: "Selfie / Foto presencial",
  SOAT: "SOAT",
  TECHNOMECHANICAL: "Tecnomecánica",
  VEHICLE_OWNERSHIP_CARD: "Tarjeta de propiedad",
  VEHICLE_PHOTO_OR_INSPECTION: "Foto / Inspección vehículo",
  BACKGROUND_CHECK: "Antecedentes",
};

function isoToDateInput(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return toISODate(d);
}

function dateInputToIsoOrNull(v: string) {
  const x = String(v || "").trim();
  if (!x) return null;
  const d = new Date(`${x}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function driverPhotoFileNameFromUrl(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const clean = raw.replace(/^\/branding\/Driver_Pictures\//, "");
  return clean.split(/[\\/]/).pop() ?? "";
}

function buildDriverPhotoSrc(value?: string | null) {
  const file = driverPhotoFileNameFromUrl(value);
  if (!file) return "";
  return `/branding/Driver_Pictures/${file.split("/").map(encodeURIComponent).join("/")}`;
}

function levelLabel(lvl?: string | null) {
  const v = String(lvl ?? "").toUpperCase();
  if (v === "PLATINO") return "Platino";
  if (v === "ORO") return "Oro";
  if (v === "PLATA") return "Plata";
  return "Bronce";
}

function statusBadgeClass(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "APPROVED" || s === "VERIFIED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "TEMPORARY_APPROVED") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "REJECTED" || s === "EXPIRED" || s === "BLOCKED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm font-bold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function WorkerProfilePage() {
  const params = useParams<{ driverId: string }>();
  const router = useRouter();
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const driverId = String(params?.driverId ?? "").trim();
  const effectiveCitySlug = mode === "CITY" && globalCitySlug ? globalCitySlug : "";

  const [tab, setTab] = useState<WorkerTab>("GENERAL");
  const [profile, setProfile] = useState<WorkerProfileResponse | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [documentChecks, setDocumentChecks] = useState<DriverDocumentCheck[]>([]);
  const [workerTypesData, setWorkerTypesData] = useState<any | null>(null);
  const [workerWalletData, setWorkerWalletData] = useState<any | null>(null);
  const [selectedWorkerTypes, setSelectedWorkerTypes] = useState<string[]>(["MOTORCYCLE"]);

  const [loading, setLoading] = useState(true);
  const [savingTypes, setSavingTypes] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingDocument, setSavingDocument] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [walletAmountCOP, setWalletAmountCOP] = useState("");
  const [walletNote, setWalletNote] = useState("Recarga manual CTCC");

  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    brand: "",
    color: "",
    model: "",
    isActive: true,
    soatNumber: "",
    soatExpiresAt: "",
    tecnicomecanicaNumber: "",
    tecnicomecanicaExpiresAt: "",
  });

  const workerTypeHint = useMemo(() => {
    return WORKER_TYPE_OPTIONS.filter((option) => selectedWorkerTypes.includes(option.value))
      .map((option) => option.label)
      .join(" · ") || "Domiciliario";
  }, [selectedWorkerTypes]);

  const loadWallet = useCallback(async () => {
    if (!driverId) return;

    const qs = new URLSearchParams();
    if (effectiveCitySlug) qs.set("citySlug", effectiveCitySlug);
    qs.set("take", "20");

    const walletRes = await apiFetch<any>(
      `/drivers/admin/${driverId}/wallet${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    setWorkerWalletData(walletRes);
  }, [driverId, effectiveCitySlug]);

  const loadProfile = useCallback(async () => {
    if (!driverId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<WorkerProfileResponse>(`/drivers/admin/${driverId}`);
      setProfile(data);

      const v = data.vehicle || null;
      setVehicleForm({
        plate: String(v?.plate ?? ""),
        brand: String(v?.brand ?? ""),
        color: String(v?.color ?? ""),
        model: String(v?.model ?? ""),
        isActive: Boolean(v?.isActive ?? true),
        soatNumber: String(v?.soatNumber ?? ""),
        soatExpiresAt: isoToDateInput(v?.soatExpiresAt ?? null),
        tecnicomecanicaNumber: String(v?.tecnicomecanicaNumber ?? ""),
        tecnicomecanicaExpiresAt: isoToDateInput(v?.tecnicomecanicaExpiresAt ?? null),
      });

      const [el, docsRes, workerTypesRes] = await Promise.all([
        apiFetch<any>(`/drivers/admin/${driverId}/eligibility`),
        apiFetch<any>(`/drivers/admin/${driverId}/documents`),
        apiFetch<any>(
          `/drivers/admin/${driverId}/worker-types${effectiveCitySlug ? `?citySlug=${encodeURIComponent(effectiveCitySlug)}` : ""}`
        ),
      ]);

      setEligibility(el);
      setDocumentChecks(Array.isArray(docsRes?.documents) ? docsRes.documents : []);
      setWorkerTypesData(workerTypesRes);
      setSelectedWorkerTypes(
        Array.isArray(workerTypesRes?.workerTypes) && workerTypesRes.workerTypes.length
          ? workerTypesRes.workerTypes.map((item: any) => String(item ?? "").trim().toUpperCase())
          : ["MOTORCYCLE"]
      );

      await loadWallet();
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el perfil del worker");
    } finally {
      setLoading(false);
    }
  }, [driverId, effectiveCitySlug, loadWallet]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function toggleWorkerType(value: WorkerTypeCode) {
    setSelectedWorkerTypes((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      return [...current, value];
    });
  }

  async function saveWorkerTypes() {
    if (!driverId) return;

    setSavingTypes(true);
    setError(null);
    setMessage(null);

    try {
      const body: any = {
        workerTypes: selectedWorkerTypes.length ? selectedWorkerTypes : ["MOTORCYCLE"],
      };
      if (effectiveCitySlug) body.citySlug = effectiveCitySlug;

      const res = await apiFetch<any>(`/drivers/admin/${driverId}/worker-types`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setWorkerTypesData(res);
      setSelectedWorkerTypes(
        Array.isArray(res?.workerTypes) && res.workerTypes.length
          ? res.workerTypes.map((item: any) => String(item ?? "").trim().toUpperCase())
          : body.workerTypes
      );
      setMessage("Tipos autorizados guardados ✅");
    } catch (e: any) {
      setError(e?.message || "No se pudieron guardar los tipos autorizados");
    } finally {
      setSavingTypes(false);
    }
  }

  async function adjustWorkerWallet(multiplier: 1 | -1) {
    const rawAmount = Math.round(Number(walletAmountCOP || 0));
    const amountCOP = rawAmount * multiplier;

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      setMessage("Ingresa un valor mayor a cero.");
      return;
    }

    if (walletNote.trim().length < 5) {
      setMessage("La nota debe tener mínimo 5 caracteres.");
      return;
    }

    setSavingWallet(true);
    setError(null);
    setMessage(null);

    try {
      const body: any = {
        amountCOP,
        bucket: "CASH",
        note: walletNote.trim(),
      };
      if (effectiveCitySlug) body.citySlug = effectiveCitySlug;

      await apiFetch<any>(`/drivers/admin/${driverId}/wallet/adjust`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setWalletAmountCOP("");
      await loadWallet();
      setMessage(multiplier > 0 ? "Recarga aplicada ✅" : "Débito aplicado ✅");
    } catch (e: any) {
      setError(e?.message || "No se pudo ajustar la Wallet KRONIX");
    } finally {
      setSavingWallet(false);
    }
  }

  async function saveVehicle() {
    setSavingVehicle(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch(`/drivers/admin/${driverId}/vehicle`, {
        method: "PATCH",
        body: JSON.stringify({
          plate: vehicleForm.plate.trim() || null,
          brand: vehicleForm.brand.trim() || null,
          color: vehicleForm.color.trim() || null,
          model: vehicleForm.model.trim() || null,
          isActive: Boolean(vehicleForm.isActive),
          soatNumber: vehicleForm.soatNumber.trim() || null,
          soatExpiresAt: dateInputToIsoOrNull(vehicleForm.soatExpiresAt),
          tecnicomecanicaNumber: vehicleForm.tecnicomecanicaNumber.trim() || null,
          tecnicomecanicaExpiresAt: dateInputToIsoOrNull(vehicleForm.tecnicomecanicaExpiresAt),
        }),
      });

      setMessage("Vehículo/documentos guardados ✅");
      await loadProfile();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar vehículo/documentos");
    } finally {
      setSavingVehicle(false);
    }
  }

  async function saveDocumentCheck(
    type: string,
    payload: {
      status: string;
      documentNumber?: string | null;
      expiresAt?: string | null;
      internalNotes?: string | null;
      waiverReason?: string | null;
      waiverExpiresAt?: string | null;
    }
  ) {
    setSavingDocument(type);
    setError(null);
    setMessage(null);

    try {
      await apiFetch(`/drivers/admin/${driverId}/documents`, {
        method: "PATCH",
        body: JSON.stringify({
          type,
          ...payload,
          receivedAt: new Date().toISOString(),
        }),
      });

      const docsRes = await apiFetch<any>(`/drivers/admin/${driverId}/documents`);
      setDocumentChecks(Array.isArray(docsRes?.documents) ? docsRes.documents : []);
      setMessage("Aval documental guardado ✅");
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el aval documental");
    } finally {
      setSavingDocument(null);
    }
  }


  const photoSrc = buildDriverPhotoSrc(profile?.user?.profileImageUrl ?? null);

  return (
    <main className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/drivers")}
            className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            ← Volver a Workers
          </button>
          <div className="text-sm text-slate-500">KroniX Control Center</div>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Perfil del Worker</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administración completa de tipos autorizados, Wallet KRONIX, documentación y actividad.
          </p>
        </div>

        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
          {effectiveCitySlug ? `Ciudad activa: ${cityLabel}` : "Vista global"}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Cargando perfil del worker...
        </div>
      ) : profile ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-900 text-xl font-black text-white">
                  {String(profile.user?.name ?? "WK")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((x) => x[0]?.toUpperCase())
                    .join("") || "WK"}
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt="Foto oficial del worker"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black text-slate-950">{profile.user.name}</h2>
                  <div className="mt-1 text-sm text-slate-600">
                    {profile.user.phone} {profile.user.email ? `· ${profile.user.email}` : ""}
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-400">{profile.user.id}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {WORKER_TYPE_OPTIONS.filter((option) => selectedWorkerTypes.includes(option.value)).map((option) => (
                  <span key={option.value} className={["rounded-full border px-3 py-1.5 text-xs font-bold", option.tone].join(" ")}>{option.label}</span>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-6">
            <StatCard label="Nivel" value={levelLabel(profile.driverProfile?.level)} />
            <StatCard label="Rating" value={Number(profile.driverProfile?.rating ?? 0).toFixed(1)} />
            <StatCard label="Estado" value={profile.driverProfile?.isActive ? "Activo" : "Inactivo"} />
            <StatCard label="Tipos" value={String(selectedWorkerTypes.length || 1)} hint={workerTypeHint} />
            <StatCard label="Saldo KRONIX" value={formatCOP(Number(workerWalletData?.wallet?.totalAvailableCOP ?? 0))} />
            <StatCard label="Puede operar" value={eligibility?.canOperate ? "Sí" : "No"} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <TabButton active={tab === "GENERAL"} label="General" onClick={() => setTab("GENERAL")} />
              <TabButton active={tab === "TYPES"} label="Tipos autorizados" onClick={() => setTab("TYPES")} />
              <TabButton active={tab === "WALLET"} label="Wallet KRONIX" onClick={() => setTab("WALLET")} />
              <TabButton active={tab === "VEHICLE"} label="Vehículo" onClick={() => setTab("VEHICLE")} />
              <TabButton active={tab === "DOCUMENTS"} label="Documentos" onClick={() => setTab("DOCUMENTS")} />
              <TabButton active={tab === "HISTORY"} label="Historial" onClick={() => setTab("HISTORY")} />
            </div>
          </section>

          {tab === "GENERAL" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">General</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoRow label="Nombre" value={profile.user.name} />
                <InfoRow label="Teléfono" value={profile.user.phone} />
                <InfoRow label="Email" value={profile.user.email || "—"} />
                <InfoRow label="Ciudad" value={cityLabel || "—"} />
              </div>
              {eligibility?.reasons?.length ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <div className="font-black">Novedades de elegibilidad</div>
                  <ul className="mt-2 list-disc pl-5">
                    {eligibility.reasons.map((reason: string) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === "TYPES" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Tipos autorizados</h3>
              <p className="mt-1 text-sm text-slate-600">Controla qué servicios puede aceptar este Worker.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {WORKER_TYPE_OPTIONS.map((option) => {
                  const checked = selectedWorkerTypes.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={[
                        "cursor-pointer rounded-2xl border p-4 transition",
                        checked ? option.tone : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2 text-sm font-black">
                        <input type="checkbox" checked={checked} onChange={() => toggleWorkerType(option.value)} />
                        {option.label}
                      </div>
                      <div className="mt-1 text-xs opacity-80">{option.hint}</div>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={saveWorkerTypes}
                disabled={savingTypes}
                className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {savingTypes ? "Guardando..." : "Guardar tipos"}
              </button>
            </section>
          ) : null}

          {tab === "WALLET" ? (
            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-blue-950">Wallet KRONIX</h3>
                  <div className="mt-2 text-4xl font-black text-blue-950">
                    {formatCOP(Number(workerWalletData?.wallet?.totalAvailableCOP ?? 0))}
                  </div>
                  <div className="mt-1 text-sm text-blue-800">
                    Cash: {formatCOP(Number(workerWalletData?.wallet?.cashBalanceCOP ?? 0))} · Bonus: {formatCOP(Number(workerWalletData?.wallet?.bonusBalanceCOP ?? 0))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadWallet}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50"
                >
                  Refrescar
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Valor COP"
                  value={walletAmountCOP}
                  onChange={(e) => setWalletAmountCOP(e.target.value.replace(/\D/g, ""))}
                />
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm md:col-span-2"
                  placeholder="Nota de auditoría"
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => adjustWorkerWallet(1)}
                  disabled={savingWallet}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  + Recargar
                </button>
                <button
                  type="button"
                  onClick={() => adjustWorkerWallet(-1)}
                  disabled={savingWallet}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
                >
                  - Debitar
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100 bg-white">
                {(workerWalletData?.items ?? []).length ? (
                  (workerWalletData?.items ?? []).map((tx: any) => (
                    <div key={tx.id} className="border-b border-blue-50 px-4 py-3 text-sm last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-slate-900">{formatCOP(Number(tx.amountCOP ?? 0))}</span>
                        <span className="text-xs text-slate-500">{tx.type}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{tx.note || tx.reference || "Movimiento"}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-500">Sin movimientos todavía.</div>
                )}
              </div>
            </section>
          ) : null}

          {tab === "VEHICLE" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Vehículo</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Input label="Placa" value={vehicleForm.plate} onChange={(v) => setVehicleForm((p) => ({ ...p, plate: v }))} />
                <Input label="Marca" value={vehicleForm.brand} onChange={(v) => setVehicleForm((p) => ({ ...p, brand: v }))} />
                <Input label="Color" value={vehicleForm.color} onChange={(v) => setVehicleForm((p) => ({ ...p, color: v }))} />
                <Input label="Modelo / Año" value={vehicleForm.model} onChange={(v) => setVehicleForm((p) => ({ ...p, model: v }))} />
                <Input label="SOAT número" value={vehicleForm.soatNumber} onChange={(v) => setVehicleForm((p) => ({ ...p, soatNumber: v }))} />
                <Input label="SOAT vence" type="date" value={vehicleForm.soatExpiresAt} onChange={(v) => setVehicleForm((p) => ({ ...p, soatExpiresAt: v }))} />
                <Input label="Tecnomecánica número" value={vehicleForm.tecnicomecanicaNumber} onChange={(v) => setVehicleForm((p) => ({ ...p, tecnicomecanicaNumber: v }))} />
                <Input label="Tecnomecánica vence" type="date" value={vehicleForm.tecnicomecanicaExpiresAt} onChange={(v) => setVehicleForm((p) => ({ ...p, tecnicomecanicaExpiresAt: v }))} />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={vehicleForm.isActive} onChange={(e) => setVehicleForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Vehículo activo
              </label>
              <button
                type="button"
                onClick={saveVehicle}
                disabled={savingVehicle}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {savingVehicle ? "Guardando..." : "Guardar vehículo"}
              </button>
            </section>
          ) : null}

          {tab === "DOCUMENTS" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-950">Documentos</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Administra estado, número, vencimiento, notas internas y avales temporales de cada documento.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {DOCUMENT_TYPES.map((type) => {
                  const doc = documentChecks.find((item) => item.type === type) ?? null;

                  return (
                    <WorkerDocumentRow
                      key={type}
                      type={type}
                      label={DOCUMENT_LABELS[type] ?? type}
                      doc={doc}
                      saving={savingDocument === type}
                      onSave={saveDocumentCheck}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {tab === "HISTORY" ? (
            <section className="grid gap-4 lg:grid-cols-2">
              <HistoryTable title="Últimos pedidos" items={profile.history?.orders ?? []} />
              <HistoryTable title="Últimos payouts" items={profile.history?.payouts ?? []} />
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No se encontró el worker.
        </div>
      )}
    </main>
  );
}


function WorkerDocumentRow({
  type,
  label,
  doc,
  saving,
  onSave,
}: {
  type: string;
  label: string;
  doc: DriverDocumentCheck | null;
  saving: boolean;
  onSave: (
    type: string,
    payload: {
      status: string;
      documentNumber?: string | null;
      expiresAt?: string | null;
      internalNotes?: string | null;
      waiverReason?: string | null;
      waiverExpiresAt?: string | null;
    }
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(doc?.status ?? "PENDING");
  const [documentNumber, setDocumentNumber] = useState(doc?.documentNumber ?? "");
  const [expiresAt, setExpiresAt] = useState(isoToDateInput(doc?.expiresAt ?? null));
  const [internalNotes, setInternalNotes] = useState(doc?.internalNotes ?? "");
  const [waiverReason, setWaiverReason] = useState(doc?.waiverReason ?? "");
  const [waiverExpiresAt, setWaiverExpiresAt] = useState(
    isoToDateInput(doc?.waiverExpiresAt ?? null)
  );

  useEffect(() => {
    setStatus(doc?.status ?? "PENDING");
    setDocumentNumber(doc?.documentNumber ?? "");
    setExpiresAt(isoToDateInput(doc?.expiresAt ?? null));
    setInternalNotes(doc?.internalNotes ?? "");
    setWaiverReason(doc?.waiverReason ?? "");
    setWaiverExpiresAt(isoToDateInput(doc?.waiverExpiresAt ?? null));
  }, [doc]);

  const normalizedStatus = String(status ?? "PENDING").toUpperCase();
  const isTemporary = normalizedStatus === "TEMPORARY_APPROVED";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-black text-slate-950">{label}</div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-400">{type}</div>
          <span
            className={[
              "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold",
              statusBadgeClass(normalizedStatus),
            ].join(" ")}
          >
            {normalizedStatus}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {["PENDING", "RECEIVED", "APPROVED", "REJECTED", "TEMPORARY_APPROVED"].map(
            (nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onClick={() => setStatus(nextStatus)}
                disabled={saving}
                className={[
                  "rounded-xl border px-3 py-2 text-[11px] font-bold disabled:opacity-60",
                  normalizedStatus === nextStatus
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {nextStatus}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Número de documento</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            value={documentNumber}
            disabled={saving}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Ej: ASDFG123456"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-600">Fecha de vencimiento</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            value={expiresAt}
            disabled={saving}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs font-bold text-slate-600">Nota interna</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            value={internalNotes}
            disabled={saving}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Ej: documento revisado físicamente"
          />
        </label>

        {isTemporary ? (
          <>
            <label className="block xl:col-span-3">
              <span className="text-xs font-bold text-blue-700">Razón del aval temporal</span>
              <input
                className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                value={waiverReason}
                disabled={saving}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="Ej: documento físico pendiente de actualización"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-blue-700">Aval temporal hasta</span>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                value={waiverExpiresAt}
                disabled={saving}
                onChange={(e) => setWaiverExpiresAt(e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(type, {
              status: normalizedStatus,
              documentNumber: documentNumber.trim() || null,
              expiresAt: dateInputToIsoOrNull(expiresAt),
              internalNotes: internalNotes.trim() || null,
              waiverReason: isTemporary ? waiverReason.trim() || null : null,
              waiverExpiresAt: isTemporary ? dateInputToIsoOrNull(waiverExpiresAt) : null,
            })
          }
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar documento"}
        </button>
      </div>
    </div>
  );
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function HistoryTable({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-black text-slate-900">{title}</div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.slice(0, 20).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.id}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{String(item.status ?? item.type ?? "—")}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                  {formatCOP(Number(item.amountCOP ?? item.driverPayoutCOP ?? 0))}
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                  Sin historial todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
