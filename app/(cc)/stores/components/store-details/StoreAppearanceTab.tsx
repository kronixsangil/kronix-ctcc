//app\(cc)\stores\components\store-details\StoreAppearanceTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AdminTheme, adminListThemes } from "../../../themes/lib/themesApi";

type Props = {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
};

export default function StoreAppearanceTab({ form, setForm }: Props) {
  const [themes, setThemes] = useState<AdminTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    adminListThemes()
      .then((rows) => {
        if (!alive) return;
        setThemes(Array.isArray(rows) ? rows.filter((t) => t.isActive) : []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const selectedTheme = useMemo(() => {
    return themes.find((t) => t.id === form.themeId) || null;
  }, [themes, form.themeId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Apariencia</div>
          <div className="mt-1 text-xs text-slate-500">
            Selecciona el tema visual que verá el cliente en Buyer App.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Tema seleccionado</label>

            <select
              value={form.themeId ?? ""}
              onChange={(e) =>
                setForm((s: any) => ({
                  ...s,
                  themeId: e.target.value || null,
                }))
              }
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 disabled:bg-slate-50"
            >
              <option value="">KroniX Original / Sin tema asignado</option>

              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} — {theme.code}
                </option>
              ))}
            </select>

            <div className="mt-2 text-xs text-slate-500">
              La Store App no puede cambiar este valor. Solo CTCC administra temas.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            {selectedTheme ? (
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: selectedTheme.primaryColor }}
                  />
                  <div className="text-sm font-black text-slate-900">
                    {selectedTheme.name}
                  </div>
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {selectedTheme.description || selectedTheme.code}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div
                    className="flex h-20 items-center justify-between px-4"
                    style={{
                      background: `linear-gradient(135deg, ${
                        selectedTheme.gradientFrom || selectedTheme.headerBg
                      }, ${selectedTheme.gradientTo || selectedTheme.secondaryColor})`,
                      color: selectedTheme.headerTextColor,
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold opacity-80">Header</div>
                      <div className="text-lg font-black">{form.name || "Tienda KroniX"}</div>
                    </div>

                    {selectedTheme.headerLogoUrl ? (
                      <img
                        src={selectedTheme.headerLogoUrl}
                        alt={selectedTheme.name}
                        className="h-12 max-w-[130px] object-contain"
                      />
                    ) : (
                      <div className="rounded-full bg-white/20 px-3 py-2 text-xs font-black">
                        KroniX
                      </div>
                    )}
                  </div>

                  <div
                    className="p-4"
                    style={{
                      background: selectedTheme.pageBg,
                      color: selectedTheme.textPrimary,
                    }}
                  >
                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: selectedTheme.cardBg,
                        color: selectedTheme.cardTextColor,
                        border: `1px solid ${selectedTheme.inputBorder}`,
                      }}
                    >
                      <div className="font-black">Producto ejemplo</div>
                      <div className="mt-1 text-xs" style={{ color: selectedTheme.textSecondary }}>
                        Vista previa del tema
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="font-black" style={{ color: selectedTheme.accentColor }}>
                          $24.000
                        </div>

                        <button
                          type="button"
                          className="rounded-xl px-3 py-2 text-sm font-black"
                          style={{
                            background: selectedTheme.buttonBg,
                            color: selectedTheme.buttonTextColor,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Selecciona un tema para ver la vista previa.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}