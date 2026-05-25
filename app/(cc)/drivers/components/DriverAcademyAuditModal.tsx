//app\(cc)\drivers\components\DriverAcademyAuditModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Attempt = {
  id: string;
  trainingType: string;
  version: string;
  scorePercent: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: string;
};

const MODULES = [
  {
    trainingType: "ACADEMY_WELCOME",
    label: "Bienvenida KroniX",
    version: "academy-welcome-v1",
    icon: "👋",
  },
  {
    trainingType: "ACADEMY_ROAD_SAFETY",
    label: "Seguridad Vial",
    version: "academy-road-safety-v1",
    icon: "🛵",
  },
  {
    trainingType: "ACADEMY_APP_OPERATION",
    label: "Operación App",
    version: "academy-app-operation-v1",
    icon: "📱",
  },
  {
    trainingType: "ACADEMY_FRAUD_PREVENTION",
    label: "Antifraude",
    version: "academy-fraud-prevention-v1",
    icon: "🔐",
  },
];

function fmtDate(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DriverAcademyAuditModal({
  driverId,
  driverName,
  onClose,
}: {
  driverId: string;
  driverName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        `/legal/admin/users/${driverId}/training-attempts`
      );

      setAttempts(Array.isArray(res?.attempts) ? res.attempts : []);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar la academia.");
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const latestByType = useMemo(() => {
    const map = new Map<string, Attempt>();

    for (const item of attempts) {
      const prev = map.get(item.trainingType);

      if (
        !prev ||
        new Date(item.createdAt).getTime() >
          new Date(prev.createdAt).getTime()
      ) {
        map.set(item.trainingType, item);
      }
    }

    return map;
  }, [attempts]);

  const approvedCount = MODULES.filter((m) => {
    const x = latestByType.get(m.trainingType);
    return !!x?.passed;
  }).length;

  const progressPct = Math.round(
    (approvedCount / MODULES.length) * 100
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                KroniX Driver Academy
              </div>

              <div className="mt-2 text-2xl font-black">
                Auditoría de capacitación
              </div>

              <div className="mt-1 text-sm text-emerald-50">
                {driverName} · {driverId}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-emerald-50">
                Progreso Academia
              </span>

              <span className="text-lg font-black">
                {progressPct}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${progressPct}%`,
                }}
              />
            </div>

            <div className="mt-2 text-xs font-semibold text-emerald-50">
              {approvedCount} de {MODULES.length} módulos aprobados
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Cargando academia...
            </div>
          ) : (
            <div className="space-y-4">
              {MODULES.map((mod) => {
                const latest =
                  latestByType.get(mod.trainingType) ?? null;

                return (
                  <div
                    key={mod.trainingType}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-2xl ring-1 ring-slate-200">
                          {mod.icon}
                        </div>

                        <div>
                          <div className="text-base font-black text-slate-900">
                            {mod.label}
                          </div>

                          <div className="mt-1 text-xs font-mono text-slate-500">
                            {mod.trainingType}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Versión esperada: {mod.version}
                          </div>
                        </div>
                      </div>

                      {latest?.passed ? (
                        <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Puntaje
                        </div>

                        <div className="mt-2 text-2xl font-black text-slate-900">
                          {latest
                            ? `${latest.scorePercent}%`
                            : "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Resultado
                        </div>

                        <div className="mt-2 text-sm font-black text-slate-900">
                          {latest
                            ? latest.passed
                              ? "Aprobado"
                              : "Reprobado"
                            : "Sin intento"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Respuestas
                        </div>

                        <div className="mt-2 text-sm font-black text-slate-900">
                          {latest
                            ? `${latest.correctAnswers}/${latest.totalQuestions}`
                            : "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs text-slate-500">
                          Fecha
                        </div>

                        <div className="mt-2 text-sm font-black text-slate-900">
                          {fmtDate(latest?.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}