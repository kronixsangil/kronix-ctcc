// app/(cc)/stores/components/store-details/StorePlanOperationTab.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
import { StorePremiumTier } from "../../lib/storesApi";

type Props = {
  mode: "create" | "edit";
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
};

export default function StorePlanOperationTab({ mode, form, setForm }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Plan y operación</div>
        <div className="mt-1 text-xs text-slate-500">
          Plan comercial, comisión, visibilidad Buyer, auto-confirmación y estado operativo.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-slate-600">Estado</label>
          <select
            value={String(Boolean(form?.isActive))}
            onChange={(e) =>
              setForm((s: any) => ({
                ...s,
                isActive: e.target.value === "true",
                isPaused: e.target.value === "true" ? Boolean(s.isPaused) : false,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={mode === "create"}
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Pausada</label>
          <select
            value={String(Boolean(form?.isPaused))}
            onChange={(e) => setForm((s: any) => ({ ...s, isPaused: e.target.value === "true" }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={mode === "create" || !Boolean(form?.isActive)}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Comisión (%)</label>
          <input
            value={String(form?.commissionRatePct ?? 8)}
            onChange={(e) => setForm((s: any) => ({ ...s, commissionRatePct: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Razón pausa</label>
          <input
            value={String(form?.pausedReason ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, pausedReason: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create" || !Boolean(form?.isActive) || !Boolean(form?.isPaused)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Plan</label>
          <select
            value={form?.premiumTier ?? "STANDARD"}
            onChange={(e) =>
              setForm((s: any) => ({
                ...s,
                premiumTier: e.target.value as StorePremiumTier,
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={mode === "create"}
          >
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="PREMIUM_PLUS">Premium+</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Auto-confirmación</label>
          <select
            value={form?.autoDecisionMode ?? "AUTO_REJECT"}
            onChange={(e) =>
              setForm((s: any) => ({
                ...s,
                autoDecisionMode:
                  e.target.value === "AUTO_CONFIRM" ? "AUTO_CONFIRM" : "AUTO_REJECT",
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={mode === "create"}
          >
            <option value="AUTO_REJECT">OFF</option>
            <option value="AUTO_CONFIRM">ON</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Minutos auto</label>
          <input
            value={String(form?.autoDecisionMinutes ?? 5)}
            onChange={(e) => setForm((s: any) => ({ ...s, autoDecisionMinutes: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Recomendada Buyer</label>
          <select
            value={String(Boolean(form?.isBuyerRecommended))}
            onChange={(e) =>
              setForm((s: any) => ({
                ...s,
                isBuyerRecommended: e.target.value === "true",
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={mode === "create"}
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Orden recomendado</label>
          <input
            value={String(form?.buyerRecommendedOrder ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerRecommendedOrder: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create" || !Boolean(form?.isBuyerRecommended)}
            placeholder="0, 1, 2..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Sticker emoji</label>
          <input
            value={String(form?.buyerCardStickerEmoji ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardStickerEmoji: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
            placeholder="🐾"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Título tarjeta override</label>
          <input
            value={String(form?.buyerCardTitleOverride ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardTitleOverride: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Subtítulo tarjeta override</label>
          <input
            value={String(form?.buyerCardSubtitleOverride ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardSubtitleOverride: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Badge texto</label>
          <input
            value={String(form?.buyerCardBadgeText ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardBadgeText: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Distancia texto</label>
          <input
            value={String(form?.buyerCardDistanceText ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardDistanceText: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
            placeholder="1.2 km"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Rating texto</label>
          <input
            value={String(form?.buyerCardRatingText ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardRatingText: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
            placeholder="4.8"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Orden imágenes tarjeta</label>
          <input
            value={String(form?.buyerCardImageOrder ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, buyerCardImageOrder: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={mode === "create"}
            placeholder="image,image3,image2,image4"
          />
        </div>
      </div>
    </div>
  );
}
