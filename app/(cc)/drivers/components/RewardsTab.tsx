//app\(cc)\drivers\components\RewardsTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addManualRewardPoints,
  getRewardProfiles,
  getRewardRules,
  getRewardSchedules,
  getRewardSettings,
  getRewardTiers,
  getRewardTransactions,
  setRewardPioneer,
  updateRewardRule,
  updateRewardSchedule,
  updateRewardSettings,
  updateRewardTier,
  updateRewardTierRequirements,
} from "../lib/rewardsApi";

type RewardSettings = {
  rewardsEnabled: boolean;
  priorityEnabled: boolean;
  pioneerEnabled: boolean;
  maxLevelLossPerMonth: number;
};

type Requirement = {
  minimumPoints: number;
  minimumDeliveries: number;
  minimumRating: number;
  minimumReliability: number;
};

type RewardTier = {
  id: string;
  code: string;
  name: string;
  priority: number;
  badgeColor?: string | null;
  isActive: boolean;
  requirements?: Requirement[];
};

type RewardRule = {
  id: string;
  eventKey: string;
  points: number;
  isActive: boolean;
};

type RewardSchedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  tierDelaySeconds: number;
  isActive: boolean;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
};

type RewardProfile = {
  id: string;
  driverId?: string;
  currentPoints: number;
  currentMonthPoints: number;
  currentMonthDeliveries: number;
  reliabilityPercent: number;
  averageRating: number;
  isPioneer: boolean;
  driver?: { id?: string; name?: string; phone?: string };
  tier?: { name?: string };
};

type RewardTransaction = {
  id: string;
  points: number;
  eventKey: string;
  notes?: string | null;
  createdAt: string;
  orderId?: string | null;
};

const DAY_OPTIONS: Array<[keyof RewardSchedule, string]> = [
  ["monday", "Lun"],
  ["tuesday", "Mar"],
  ["wednesday", "Mié"],
  ["thursday", "Jue"],
  ["friday", "Vie"],
  ["saturday", "Sáb"],
  ["sunday", "Dom"],
];

const TIER_ACCENTS: Record<string, string> = {
  PIONERO: "bg-violet-50 text-violet-700 border-violet-200",
  ELITE: "bg-slate-950 text-white border-slate-950",
  ORO: "bg-amber-50 text-amber-700 border-amber-200",
  PLATA: "bg-slate-100 text-slate-700 border-slate-200",
  BRONCE: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function RewardsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [schedules, setSchedules] = useState<RewardSchedule[]>([]);
  const [profiles, setProfiles] = useState<RewardProfile[]>([]);

  const [selectedDriver, setSelectedDriver] =
    useState<RewardProfile | null>(null);
  const [manualPoints, setManualPoints] = useState(0);
  const [manualNotes, setManualNotes] = useState("");
  const [transactions, setTransactions] =
    useState<RewardTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const activeTiers = useMemo(
    () => tiers.filter((tier) => tier.isActive).length,
    [tiers]
  );

  const pioneerProfiles = useMemo(
    () => profiles.filter((profile) => profile.isPioneer).length,
    [profiles]
  );

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.isActive).length,
    [rules]
  );

  const activeSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.isActive).length,
    [schedules]
  );

  async function loadData() {
    try {
      setLoading(true);
      const [settingsData, tiersData, rulesData, schedulesData, profilesData] =
        await Promise.all([
          getRewardSettings(),
          getRewardTiers(),
          getRewardRules(),
          getRewardSchedules(),
          getRewardProfiles(),
        ]);

      setSettings((settingsData as RewardSettings) ?? null);
      setTiers(Array.isArray(tiersData) ? (tiersData as RewardTier[]) : []);
      setRules(Array.isArray(rulesData) ? (rulesData as RewardRule[]) : []);
      setSchedules(Array.isArray(schedulesData) ? (schedulesData as RewardSchedule[]) : []);
      setProfiles(Array.isArray(profilesData) ? (profilesData as RewardProfile[]) : []);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateRewardSettings(settings);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function saveTier(tier: RewardTier) {
    setSaving(true);
    try {
      await updateRewardTier(tier.id, {
        name: tier.name,
        priority: Number(tier.priority),
        badgeColor: tier.badgeColor,
        isActive: Boolean(tier.isActive),
      });

      const req = tier.requirements?.[0];
      if (req) {
        await updateRewardTierRequirements(tier.id, {
          minimumPoints: Number(req.minimumPoints ?? 0),
          minimumDeliveries: Number(req.minimumDeliveries ?? 0),
          minimumRating: Number(req.minimumRating ?? 0),
          minimumReliability: Number(req.minimumReliability ?? 0),
        });
      }

      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function saveRule(rule: RewardRule) {
    setSaving(true);
    try {
      await updateRewardRule(rule.id, {
        points: Number(rule.points),
        isActive: Boolean(rule.isActive),
      });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function saveSchedule(schedule: RewardSchedule) {
    setSaving(true);
    try {
      await updateRewardSchedule(schedule.id, {
        name: schedule.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        tierDelaySeconds: Number(schedule.tierDelaySeconds),
        isActive: Boolean(schedule.isActive),
        monday: Boolean(schedule.monday),
        tuesday: Boolean(schedule.tuesday),
        wednesday: Boolean(schedule.wednesday),
        thursday: Boolean(schedule.thursday),
        friday: Boolean(schedule.friday),
        saturday: Boolean(schedule.saturday),
        sunday: Boolean(schedule.sunday),
      });
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  function driverIdOf(profile: RewardProfile) {
    return String(profile.driverId ?? profile.driver?.id ?? "").trim();
  }

  async function togglePioneer(profile: RewardProfile) {
    const driverId = driverIdOf(profile);

    if (!driverId) {
      return;
    }

    setSaving(true);

    try {
      await setRewardPioneer(driverId, !profile.isPioneer);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function openDriverPanel(profile: RewardProfile) {
    const driverId = driverIdOf(profile);

    setSelectedDriver(profile);
    setManualPoints(0);
    setManualNotes("");
    setTransactions([]);

    if (!driverId) {
      return;
    }

    setTransactionsLoading(true);

    try {
      const res = (await getRewardTransactions(driverId, 80)) as any;
      setTransactions(Array.isArray(res?.transactions) ? res.transactions : []);
    } finally {
      setTransactionsLoading(false);
    }
  }

  async function saveManualPoints() {
    if (!selectedDriver) {
      return;
    }

    const driverId = driverIdOf(selectedDriver);

    if (!driverId) {
      return;
    }

    setSaving(true);

    try {
      await addManualRewardPoints(driverId, {
        points: Number(manualPoints),
        notes: manualNotes.trim() || "Ajuste manual CTCC",
      });

      await loadData();
      await openDriverPanel(selectedDriver);
    } finally {
      setSaving(false);
    }
  }

  function patchTier(id: string, patch: Partial<RewardTier>) {
    setTiers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function patchRequirement(tierId: string, patch: Partial<Requirement>) {
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.id !== tierId) return tier;
        const current = tier.requirements?.[0] ?? {
          minimumPoints: 0,
          minimumDeliveries: 0,
          minimumRating: 0,
          minimumReliability: 0,
        };

        return {
          ...tier,
          requirements: [{ ...current, ...patch }],
        };
      })
    );
  }

  function patchRule(id: string, patch: Partial<RewardRule>) {
    setRules((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function patchSchedule(id: string, patch: Partial<RewardSchedule>) {
    setSchedules((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
        Cargando sistema de recompensas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold text-cyan-200">KroniX Control Center</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Driver Rewards</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-300">
              Configura niveles, puntos, prioridad operativa, pioneros y ajustes manuales desde una sola vista compacta.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill label="Rewards" active={Boolean(settings?.rewardsEnabled)} dark />
              <StatusPill label="Prioridad" active={Boolean(settings?.priorityEnabled)} dark />
              <StatusPill label="Pioneros" active={Boolean(settings?.pioneerEnabled)} dark />
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-200">
                Máx. descenso mensual: {settings?.maxLevelLossPerMonth ?? 1}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveSettings}
            className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStatCard label="Conductores" value={profiles.length} helper={`${pioneerProfiles} pionero(s)`} />
        <MiniStatCard label="Niveles activos" value={activeTiers} helper={`${tiers.length} configurados`} />
        <MiniStatCard label="Reglas activas" value={activeRules} helper={`${rules.length} reglas`} />
        <MiniStatCard label="Ventanas activas" value={activeSchedules} helper={`${schedules.length} horarios`} />
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Descenso</div>
          <div className="mt-2 flex items-end gap-2">
            <input
              type="number"
              min={0}
              className="h-10 w-20 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none transition focus:border-blue-300"
              value={settings?.maxLevelLossPerMonth ?? 1}
              onChange={(e) =>
                setSettings((s) => ({
                  ...(s ?? defaultSettings()),
                  maxLevelLossPerMonth: Number(e.target.value),
                }))
              }
            />
            <span className="pb-2 text-xs font-bold text-slate-500">nivel(es) / mes</span>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <CompactSectionHeader
          title="Configuración general"
          subtitle="Control rápido del programa de recompensas."
        />
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3">
          <InlineSwitch
            title="Rewards"
            description="Activa puntos y niveles"
            checked={Boolean(settings?.rewardsEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), rewardsEnabled: v }))}
          />
          <InlineSwitch
            title="Prioridad"
            description="Ordena ofertas por nivel"
            checked={Boolean(settings?.priorityEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), priorityEnabled: v }))}
          />
          <InlineSwitch
            title="Pioneros"
            description="Control manual CTCC"
            checked={Boolean(settings?.pioneerEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), pioneerEnabled: v }))}
          />
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <CompactSectionHeader
          title="Niveles y requisitos"
          subtitle="Requisitos compactos por nivel. Al guardar, el API recalcula los perfiles existentes."
        />

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-3 py-3 text-left">Nombre</th>
                <th className="px-3 py-3 text-left">Prioridad</th>
                <th className="px-3 py-3 text-left">Puntos</th>
                <th className="px-3 py-3 text-left">Entregas</th>
                <th className="px-3 py-3 text-left">Rating</th>
                <th className="px-3 py-3 text-left">Confiabilidad</th>
                <th className="px-3 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tiers.map((tier) => {
                const req = tier.requirements?.[0] ?? {
                  minimumPoints: 0,
                  minimumDeliveries: 0,
                  minimumRating: 0,
                  minimumReliability: 0,
                };

                return (
                  <tr key={tier.id} className="align-middle hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <TierBadge tier={tier} />
                    </td>
                    <td className="px-3 py-3">
                      <Field value={tier.name} onChange={(v) => patchTier(tier.id, { name: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={tier.priority} onChange={(v) => patchTier(tier.id, { priority: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={req.minimumPoints} onChange={(v) => patchRequirement(tier.id, { minimumPoints: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={req.minimumDeliveries} onChange={(v) => patchRequirement(tier.id, { minimumDeliveries: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={req.minimumRating} step="0.1" onChange={(v) => patchRequirement(tier.id, { minimumRating: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={req.minimumReliability} onChange={(v) => patchRequirement(tier.id, { minimumReliability: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <Toggle checked={tier.isActive} onChange={(v) => patchTier(tier.id, { isActive: v })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SaveButton onClick={() => saveTier(tier)} saving={saving} compact label="Guardar" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.75fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CompactSectionHeader title="Reglas de puntos" subtitle="Eventos que suman o descuentan puntos." />

          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-3 py-3 text-left">Puntos</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        {rule.eventKey}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <NumberField value={rule.points} onChange={(v) => patchRule(rule.id, { points: v })} />
                    </td>
                    <td className="px-3 py-3">
                      <Toggle checked={rule.isActive} onChange={(v) => patchRule(rule.id, { isActive: v })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SaveButton onClick={() => saveRule(rule)} saving={saving} compact label="Guardar" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <CompactSectionHeader title="Ventanas de prioridad" subtitle="Días, horarios y segundos entre niveles." />

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field value={schedule.name} onChange={(v) => patchSchedule(schedule.id, { name: v })} />
                  <NumberField value={schedule.tierDelaySeconds} onChange={(v) => patchSchedule(schedule.id, { tierDelaySeconds: v })} suffix="seg" />
                  <Field value={schedule.startTime} onChange={(v) => patchSchedule(schedule.id, { startTime: v })} />
                  <Field value={schedule.endTime} onChange={(v) => patchSchedule(schedule.id, { endTime: v })} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_OPTIONS.map(([key, label]) => (
                      <button
                        key={String(key)}
                        type="button"
                        onClick={() => patchSchedule(schedule.id, { [key]: !Boolean(schedule[key]) } as Partial<RewardSchedule>)}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-black transition",
                          schedule[key]
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-500",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Toggle checked={schedule.isActive} onChange={(v) => patchSchedule(schedule.id, { isActive: v })} />
                    <SaveButton onClick={() => saveSchedule(schedule)} saving={saving} compact label="Guardar" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <CompactSectionHeader
          title="Conductores"
          subtitle="Marca pioneros, ajusta puntos y revisa historial sin salir del módulo."
        />

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Conductor</th>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Puntos</th>
                <th className="px-4 py-3 text-left">Entregas</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Confiabilidad</th>
                <th className="px-4 py-3 text-left">Pionero</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm font-semibold text-slate-500" colSpan={8}>
                    Aún no hay perfiles Rewards creados para conductores.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">
                        {profile.driver?.name ?? "—"}
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        {profile.driver?.phone ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        {profile.tier?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">{profile.currentPoints}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{profile.currentMonthDeliveries}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatNumber(profile.averageRating)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{formatNumber(profile.reliabilityPercent)}%</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => togglePioneer(profile)}
                        className={[
                          "rounded-full px-3 py-1.5 text-xs font-black transition disabled:opacity-50",
                          profile.isPioneer
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {profile.isPioneer ? "Pionero" : "No"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDriverPanel(profile)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                      >
                        Ajustar / Historial
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 md:items-center">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Rewards Driver</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {selectedDriver.driver?.name ?? "Conductor"}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Ajuste manual de puntos e historial Rewards.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <NumberField
                  label="Puntos (+/-)"
                  value={manualPoints}
                  onChange={setManualPoints}
                />

                <label className="block md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Nota del ajuste
                  </span>
                  <input
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Ej: Bono por apoyo operativo / ajuste por incidente..."
                    className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <SaveButton
                  onClick={saveManualPoints}
                  saving={saving}
                  label="Guardar ajuste manual"
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                  Historial de puntos
                </div>

                {transactionsLoading ? (
                  <div className="p-4 text-sm font-semibold text-slate-500">
                    Cargando historial...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-4 text-sm font-semibold text-slate-500">
                    Sin movimientos registrados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-4">
                        <div className="font-bold text-slate-900">{tx.eventKey}</div>
                        <div className={tx.points >= 0 ? "font-black text-emerald-700" : "font-black text-rose-700"}>
                          {tx.points >= 0 ? "+" : ""}
                          {tx.points}
                        </div>
                        <div className="text-slate-500">{formatDate(tx.createdAt)}</div>
                        <div className="text-slate-600">{tx.notes ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultSettings(): RewardSettings {
  return {
    rewardsEnabled: true,
    priorityEnabled: true,
    pioneerEnabled: true,
    maxLevelLossPerMonth: 1,
  };
}

function CompactSectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-500">{helper}</div>
    </div>
  );
}

function StatusPill({ label, active, dark }: { label: string; active: boolean; dark?: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-black",
        active
          ? dark
            ? "bg-emerald-400/15 text-emerald-200"
            : "bg-emerald-100 text-emerald-700"
          : dark
            ? "bg-rose-400/15 text-rose-200"
            : "bg-rose-100 text-rose-700",
      ].join(" ")}
    >
      {label}: {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function InlineSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <div className="text-sm font-black text-slate-950">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "rounded-full px-3 py-1.5 text-xs font-black transition",
          checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
        ].join(" ")}
      >
        {checked ? "Activo" : "Inactivo"}
      </button>
    </div>
  );
}

function TierBadge({ tier }: { tier: RewardTier }) {
  const accent = TIER_ACCENTS[tier.code] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="flex items-center gap-2">
      <span className={["rounded-full border px-3 py-1.5 text-xs font-black", accent].join(" ")}>
        {tier.code}
      </span>
      <span className="text-xs font-bold text-slate-400">#{tier.priority}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      ) : null}
      <input
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          "w-full rounded-2xl border px-3 text-sm font-bold outline-none transition",
          label ? "mt-2 h-10" : "h-9",
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-900 focus:border-blue-300",
        ].join(" ")}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
  suffix,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      ) : null}
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={[
            "w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300",
            label ? "mt-2 h-10" : "h-9",
            suffix ? "pr-11" : "",
          ].join(" ")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-black transition",
        checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
      ].join(" ")}
    >
      {checked ? "Activo" : "Inactivo"}
    </button>
  );
}

function SaveButton({
  onClick,
  saving,
  label,
  compact,
}: {
  onClick: () => void;
  saving: boolean;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className={[
        "rounded-full bg-slate-950 font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50",
        compact ? "px-4 py-2 text-xs" : "px-5 py-3 text-sm",
      ].join(" ")}
    >
      {saving ? "Guardando..." : label}
    </button>
  );
}

function formatDate(value: string) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number) {
  if (!Number.isFinite(Number(value))) {
    return "0";
  }

  return Number(value).toLocaleString("es-CO", {
    maximumFractionDigits: 1,
  });
}
