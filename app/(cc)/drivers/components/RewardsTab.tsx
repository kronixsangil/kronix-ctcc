//app\(cc)\drivers\components\RewardsTab.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getRewardProfiles,
  getRewardRules,
  getRewardSchedules,
  getRewardSettings,
  getRewardTiers,
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
  currentPoints: number;
  currentMonthPoints: number;
  currentMonthDeliveries: number;
  reliabilityPercent: number;
  averageRating: number;
  isPioneer: boolean;
  driver?: { name?: string; phone?: string };
  tier?: { name?: string };
};

export default function RewardsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [schedules, setSchedules] = useState<RewardSchedule[]>([]);
  const [profiles, setProfiles] = useState<RewardProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
        Cargando sistema de recompensas...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Header
          title="Configuración General"
          subtitle="Activa o desactiva el programa, la prioridad y el máximo descenso mensual."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SwitchCard
            title="Rewards"
            checked={Boolean(settings?.rewardsEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), rewardsEnabled: v }))}
          />
          <SwitchCard
            title="Prioridad"
            checked={Boolean(settings?.priorityEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), priorityEnabled: v }))}
          />
          <SwitchCard
            title="Pioneros"
            checked={Boolean(settings?.pioneerEnabled)}
            onChange={(v) => setSettings((s) => ({ ...(s ?? defaultSettings()), pioneerEnabled: v }))}
          />

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <label className="text-xs font-bold text-slate-500">Máx. descenso mensual</label>
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
              value={settings?.maxLevelLossPerMonth ?? 1}
              onChange={(e) =>
                setSettings((s) => ({
                  ...(s ?? defaultSettings()),
                  maxLevelLossPerMonth: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <SaveButton onClick={saveSettings} saving={saving} label="Guardar configuración" />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Header title="Niveles y requisitos" subtitle="Edita nombres, prioridad operativa y metas de cada nivel." />

        <div className="mt-5 space-y-3">
          {tiers.map((tier) => {
            const req = tier.requirements?.[0] ?? {
              minimumPoints: 0,
              minimumDeliveries: 0,
              minimumRating: 0,
              minimumReliability: 0,
            };

            return (
              <div key={tier.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-8">
                  <Field label="Código" value={tier.code} readOnly />
                  <Field label="Nombre" value={tier.name} onChange={(v) => patchTier(tier.id, { name: v })} />
                  <NumberField label="Prioridad" value={tier.priority} onChange={(v) => patchTier(tier.id, { priority: v })} />
                  <NumberField label="Puntos" value={req.minimumPoints} onChange={(v) => patchRequirement(tier.id, { minimumPoints: v })} />
                  <NumberField label="Entregas" value={req.minimumDeliveries} onChange={(v) => patchRequirement(tier.id, { minimumDeliveries: v })} />
                  <NumberField label="Rating" value={req.minimumRating} step="0.1" onChange={(v) => patchRequirement(tier.id, { minimumRating: v })} />
                  <NumberField label="Confiabilidad" value={req.minimumReliability} onChange={(v) => patchRequirement(tier.id, { minimumReliability: v })} />

                  <div className="flex items-end justify-end gap-2">
                    <Toggle checked={tier.isActive} onChange={(v) => patchTier(tier.id, { isActive: v })} />
                    <SaveButton onClick={() => saveTier(tier)} saving={saving} compact label="Guardar" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Header title="Reglas de puntos" subtitle="Define cuántos puntos suma o resta cada evento." />

        <div className="mt-5 space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <Field label="Evento" value={rule.eventKey} readOnly />
              <NumberField label="Puntos" value={rule.points} onChange={(v) => patchRule(rule.id, { points: v })} />
              <div className="flex items-end">
                <Toggle checked={rule.isActive} onChange={(v) => patchRule(rule.id, { isActive: v })} />
              </div>
              <div className="flex items-end justify-end">
                <SaveButton onClick={() => saveRule(rule)} saving={saving} compact label="Guardar" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Header title="Ventanas de prioridad" subtitle="Controla días, horarios y segundos entre niveles." />

        <div className="mt-5 space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Field label="Nombre" value={schedule.name} onChange={(v) => patchSchedule(schedule.id, { name: v })} />
                <Field label="Inicio" value={schedule.startTime} onChange={(v) => patchSchedule(schedule.id, { startTime: v })} />
                <Field label="Fin" value={schedule.endTime} onChange={(v) => patchSchedule(schedule.id, { endTime: v })} />
                <NumberField label="Delay segundos" value={schedule.tierDelaySeconds} onChange={(v) => patchSchedule(schedule.id, { tierDelaySeconds: v })} />
                <div className="flex items-end justify-end gap-2">
                  <Toggle checked={schedule.isActive} onChange={(v) => patchSchedule(schedule.id, { isActive: v })} />
                  <SaveButton onClick={() => saveSchedule(schedule)} saving={saving} compact label="Guardar" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["monday", "Lun"],
                  ["tuesday", "Mar"],
                  ["wednesday", "Mié"],
                  ["thursday", "Jue"],
                  ["friday", "Vie"],
                  ["saturday", "Sáb"],
                  ["sunday", "Dom"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => patchSchedule(schedule.id, { [key]: !Boolean((schedule as any)[key]) } as any)}
                    className={[
                      "rounded-full border px-4 py-2 text-xs font-bold transition",
                      (schedule as any)[key]
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-500",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Header title="Conductores" subtitle="Resumen de perfiles Rewards creados para conductores." />

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Nivel</th>
                <th className="px-4 py-3 text-left">Puntos</th>
                <th className="px-4 py-3 text-left">Entregas</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Pionero</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm font-semibold text-slate-500" colSpan={6}>
                    Aún no hay perfiles Rewards creados para conductores.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-900">{profile.driver?.name ?? "—"}</td>
                    <td className="px-4 py-3">{profile.tier?.name ?? "—"}</td>
                    <td className="px-4 py-3">{profile.currentPoints}</td>
                    <td className="px-4 py-3">{profile.currentMonthDeliveries}</td>
                    <td className="px-4 py-3">{profile.averageRating}</td>
                    <td className="px-4 py-3">{profile.isPioneer ? "Sí" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
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

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          "mt-2 w-full rounded-[18px] border px-4 py-3 text-sm font-bold outline-none transition",
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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input
        type="number"
        step={step}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300"
      />
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "rounded-full px-4 py-3 text-xs font-black transition",
        checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
      ].join(" ")}
    >
      {checked ? "Activo" : "Inactivo"}
    </button>
  );
}

function SwitchCard({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "mt-3 rounded-full px-4 py-3 text-sm font-black transition",
          checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
        ].join(" ")}
      >
        {checked ? "Activo" : "Inactivo"}
      </button>
    </div>
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
        compact ? "px-4 py-3 text-xs" : "px-5 py-3 text-sm",
      ].join(" ")}
    >
      {saving ? "Guardando..." : label}
    </button>
  );
}