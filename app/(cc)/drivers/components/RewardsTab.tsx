//app\(cc)\drivers\components\RewardsTab.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getRewardProfiles,
  getRewardRules,
  getRewardSchedules,
  getRewardSettings,
  getRewardTiers,
} from "../lib/rewardsApi";

type RewardSettings = {
  rewardsEnabled: boolean;
  priorityEnabled: boolean;
  pioneerEnabled: boolean;
  maxLevelLossPerMonth: number;
};

type RewardTier = {
  id: string;
  code: string;
  name: string;
  priority: number;
  badgeColor?: string | null;
  isActive: boolean;
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
};

type RewardProfile = {
  id: string;
  currentPoints: number;
  currentMonthPoints: number;
  currentMonthDeliveries: number;
  reliabilityPercent: number;
  averageRating: number;
  isPioneer: boolean;
  driver?: {
    name?: string;
    phone?: string;
  };
  tier?: {
    name?: string;
  };
};

export default function RewardsTab() {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] =
    useState<RewardSettings | null>(null);

  const [tiers, setTiers] =
    useState<RewardTier[]>([]);

  const [rules, setRules] =
    useState<RewardRule[]>([]);

  const [schedules, setSchedules] =
    useState<RewardSchedule[]>([]);

  const [profiles, setProfiles] =
    useState<RewardProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        settingsData,
        tiersData,
        rulesData,
        schedulesData,
        profilesData,
      ] = await Promise.all([
        getRewardSettings(),
        getRewardTiers(),
        getRewardRules(),
        getRewardSchedules(),
        getRewardProfiles(),
      ]);

      setSettings(
  (settingsData as RewardSettings) ?? null
);
      setTiers(Array.isArray(tiersData) ? tiersData : []);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setSchedules(
        Array.isArray(schedulesData)
          ? schedulesData
          : []
      );
      setProfiles(
        Array.isArray(profilesData)
          ? profilesData
          : []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        Cargando sistema de recompensas...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* CONFIG */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Configuración General
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-4">

          <Card
            title="Rewards"
            value={
              settings?.rewardsEnabled
                ? "Activo"
                : "Inactivo"
            }
          />

          <Card
            title="Prioridad"
            value={
              settings?.priorityEnabled
                ? "Activa"
                : "Inactiva"
            }
          />

          <Card
            title="Pioneros"
            value={
              settings?.pioneerEnabled
                ? "Activos"
                : "Inactivos"
            }
          />

          <Card
            title="Máx. descenso"
            value={
              settings?.maxLevelLossPerMonth ??
              "-"
            }
          />
        </div>
      </section>

      {/* TIERS */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Niveles
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  Código
                </th>
                <th className="p-3 text-left">
                  Nombre
                </th>
                <th className="p-3 text-left">
                  Prioridad
                </th>
                <th className="p-3 text-left">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {tiers.map((tier) => (
                <tr
                  key={tier.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {tier.code}
                  </td>

                  <td className="p-3">
                    {tier.name}
                  </td>

                  <td className="p-3">
                    {tier.priority}
                  </td>

                  <td className="p-3">
                    {tier.isActive
                      ? "Activo"
                      : "Inactivo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* RULES */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Reglas de Puntos
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  Evento
                </th>

                <th className="p-3 text-left">
                  Puntos
                </th>

                <th className="p-3 text-left">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {rule.eventKey}
                  </td>

                  <td className="p-3">
                    {rule.points}
                  </td>

                  <td className="p-3">
                    {rule.isActive
                      ? "Activo"
                      : "Inactivo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SCHEDULES */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Ventanas de Prioridad
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  Nombre
                </th>

                <th className="p-3 text-left">
                  Inicio
                </th>

                <th className="p-3 text-left">
                  Fin
                </th>

                <th className="p-3 text-left">
                  Delay
                </th>
              </tr>
            </thead>

            <tbody>
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {schedule.name}
                  </td>

                  <td className="p-3">
                    {schedule.startTime}
                  </td>

                  <td className="p-3">
                    {schedule.endTime}
                  </td>

                  <td className="p-3">
                    {schedule.tierDelaySeconds}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DRIVERS */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Conductores
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  Nombre
                </th>

                <th className="p-3 text-left">
                  Nivel
                </th>

                <th className="p-3 text-left">
                  Puntos
                </th>

                <th className="p-3 text-left">
                  Entregas
                </th>

                <th className="p-3 text-left">
                  Rating
                </th>

                <th className="p-3 text-left">
                  Pionero
                </th>
              </tr>
            </thead>

            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {profile.driver?.name}
                  </td>

                  <td className="p-3">
                    {profile.tier?.name ?? "-"}
                  </td>

                  <td className="p-3">
                    {profile.currentPoints}
                  </td>

                  <td className="p-3">
                    {
                      profile.currentMonthDeliveries
                    }
                  </td>

                  <td className="p-3">
                    {profile.averageRating}
                  </td>

                  <td className="p-3">
                    {profile.isPioneer
                      ? "Sí"
                      : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}