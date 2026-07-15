"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";
import FinanceKpiCard from "./FinanceKpiCard";
import type { FinanceOverviewResponse } from "../lib/financeApi";

type TabKey = "cash" | "income" | "wallets" | "obligations" | "wompi";

function InfoBox({
  title,
  value,
  detail,
  tone = "slate",
}: {
  title: string;
  value: number;
  detail: string;
  tone?: "slate" | "emerald" | "blue" | "amber"| "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50"
          : tone === "red"
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
        {title}
      </div>
      <div className="mt-2 text-2xl font-black text-slate-950">
        {formatCOP(value)}
      </div>
      <div className="mt-2 text-xs leading-5 text-slate-600">{detail}</div>
    </div>
  );
}

export default function FinanceMoneyFlowSection({
  data,
}: {
  data: FinanceOverviewResponse | null;
}) {
  const [tab, setTab] = useState<TabKey>("cash");

  const cash = data?.cashFlow;
  const income = data?.income;
  const wallet = data?.walletActivity;
  const obligations = data?.obligations;
  const wompi = data?.wompi;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "cash", label: "Dinero recibido" },
    { key: "income", label: "Ingresos KRONIX" },
    { key: "wallets", label: "Wallets" },
    { key: "obligations", label: "Obligaciones" },
    { key: "wompi", label: "Wompi" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              tab === item.key
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "cash" ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FinanceKpiCard
                label="Bruto recibido Wompi"
                value={formatCOP(cash?.wompiGrossReceivedCOP ?? 0)}
                hint="Recargas aprobadas + pagos directos identificados"
                tone="blue"
              />
              <FinanceKpiCard
                label="Recargas Clientes"
                value={formatCOP(cash?.buyerWalletRechargesCOP ?? 0)}
                hint={`${cash?.buyerWalletRechargeCount ?? 0} recarga(s) aprobadas`}
                tone="emerald"
              />
              <FinanceKpiCard
                label="Recargas Trabajadores"
                value={formatCOP(cash?.workerWalletRechargesCOP ?? 0)}
                hint={`${cash?.workerWalletRechargeCount ?? 0} recarga(s) aprobadas`}
                tone="emerald"
              />
              <FinanceKpiCard
                label="Pagos directos Wompi"
                value={formatCOP(cash?.directWompiOrderPaymentsCOP ?? 0)}
                hint={`${cash?.directWompiOrderPaymentsCount ?? 0} orden(es) identificadas`}
                tone="amber"
              />
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <b>Importante:</b> una recarga entra a caja, pero no es ingreso de
              KRONIX todavía. Pasa a ser saldo pendiente de uso dentro de Wallet.
            </div>
          </div>
        ) : null}

        {tab === "income" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <InfoBox
              title="Comisión tiendas"
              value={income?.storeCommissionCOP ?? 0}
              detail="Porcentaje cobrado sobre productos vendidos."
              tone="emerald"
            />
            <InfoBox
              title="Servicio KRONIX"
              value={income?.serviceFeesCOP ?? 0}
              detail="Cargo de plataforma registrado en snapshots."
              tone="blue"
            />
            <InfoBox
              title="Comisiones Workers"
              value={income?.workerServiceCommissionsCOP ?? 0}
              detail="Debitado del saldo del trabajador al finalizar."
              tone="emerald"
            />
            <InfoBox
              title="Promociones asumidas"
              value={income?.promoCostCOP ?? 0}
              detail="Descuentos registrados en el período."
              tone="amber"
            />
            <InfoBox
              title="Ingreso neto KRONIX"
              value={income?.platformNetRevenueCOP ?? 0}
              detail="Ingreso reconocido, sin sumar recargas como ganancia."
              tone="blue"
            />
          </div>
        ) : null}

        {tab === "wallets" ? (
          <div className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
              <InfoBox
                title="Recargas Clientes"
                value={wallet?.buyerWalletRechargesCOP ?? 0}              
                detail="Entradas Wompi acreditadas a Wallet Buyer."
                tone="emerald"
              />
              <InfoBox
                title="Consumo Clientes"
                value={wallet?.buyerWalletOrderPaymentsCOP ?? 0}
                detail="Saldo utilizado para pagar órdenes."
                tone="blue"
              />
              <InfoBox
                title="Ajustes Clientes"
                value={wallet?.buyerWalletAdminAdjustmentsCOP ?? 0}
                detail="Ajustes administrativos netos."
              />
                <InfoBox
                title="Total en Saldo Clientes"
                value={(wallet?.buyerWalletRechargesCOP ?? 0) + (wallet?.buyerWalletAdminAdjustmentsCOP ?? 0) - (wallet?.buyerWalletOrderPaymentsCOP ?? 0)}
                detail="Valor total disponibles para Buyers."
                tone="red"
              />              
              <InfoBox
                title="Reembolsos"
                value={wallet?.walletRefundsCOP ?? 0}
                detail="Saldo devuelto durante el período."
                tone="amber"
              />                            
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <InfoBox
                title="Recargas Trabajadores"
                value={wallet?.workerWalletRechargesCOP ?? 0}
                detail="Entradas Wompi acreditadas a Wallet Worker."
                tone="emerald"
              />
              <InfoBox
                title="Consumo Trabajadores"
                value={wallet?.workerWalletOrderPaymentsCOP ?? 0}
                detail="Pagos internos realizados desde Wallet Worker."
                tone="blue"
              />
              <InfoBox
                title="Ajustes Trabajadores"
                value={wallet?.workerWalletAdminAdjustmentsCOP ?? 0}
                detail="Ajustes administrativos netos."
              />
              <InfoBox
                title="Total en Saldo Trabajadores"
                value={(wallet?.workerWalletAdminAdjustmentsCOP ?? 0) + (wallet?.workerWalletRechargesCOP ?? 0) - (wallet?.workerWalletOrderPaymentsCOP ?? 0)}
                detail="Valor total disponibles para Trabajadores."
                tone="red"
              />          

              <InfoBox
                title="Bonos"
                value={wallet?.walletBonusGrantedCOP ?? 0}
                detail="Créditos promocionales concedidos."
                tone="amber"
              />
            </div>
          </div>
        ) : null}

        {tab === "obligations" ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBox
                title="Saldo Clientes"
                value={
                  (obligations?.buyerWalletCashLiabilityCOP ?? 0) +
                  (obligations?.buyerWalletBonusLiabilityCOP ?? 0)
                }
                detail="Dinero y bonos aún disponibles para Buyers."
                tone="amber"
              />
              <InfoBox
                title="Saldo Trabajadores"
                value={
                  (obligations?.workerWalletCashLiabilityCOP ?? 0) +
                  (obligations?.workerWalletBonusLiabilityCOP ?? 0)
                }
                detail="Dinero y bonos aún disponibles para Workers."
                tone="amber"
              />
              <InfoBox
                title="Pendiente a Workers"
                value={obligations?.pendingDriverPayoutsCOP ?? 0}
                detail="Payouts operativos todavía pendientes."
                tone="blue"
              />
              <InfoBox
                title="Pendiente a Tiendas"
                value={obligations?.pendingStorePayoutsCOP ?? 0}
                detail="Obligación calculada desde snapshots de ventas."
                tone="blue"
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Pasivo total Wallet
              </div>
              <div className="mt-2 text-3xl font-black text-amber-900">
                {formatCOP(obligations?.totalWalletLiabilityCOP ?? 0)}
              </div>
              <div className="mt-2 text-xs text-amber-800">
                Es saldo que KRONIX mantiene a favor de usuarios; no debe
                reconocerse como ingreso.
              </div>
            </div>
          </div>
        ) : null}

        {tab === "wompi" ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <InfoBox
                title="Bruto identificado"
                value={wompi?.grossReceivedCOP ?? 0}
                detail="Total de entradas Wompi registradas."
                tone="blue"
              />
              <InfoBox
                title="Tarifa Wompi registrada"
                value={wompi?.recordedFeesCOP ?? 0}
                detail={
                  wompi?.feeDataComplete
                    ? "Leída desde metadata disponible."
                    : "Dato incompleto: aún no se almacena de forma garantizada."
                }
                tone="amber"
              />
              <InfoBox
                title="Neto registrado"
                value={wompi?.netRecordedCOP ?? 0}
                detail="Bruto menos tarifas de pasarela disponibles."
                tone="emerald"
              />
            </div>

            <div
              className={[
                "rounded-2xl border px-4 py-3 text-sm",
                wompi?.feeDataComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900",
              ].join(" ")}
            >
              {wompi?.note ??
                "No hay información de conciliación Wompi para este rango."}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
