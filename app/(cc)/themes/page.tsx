//app\(cc)\themes\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminTheme,
  adminCreateTheme,
  adminDeleteTheme,
  adminDuplicateTheme,
  adminListThemes,
  adminUpdateTheme,
} from "./lib/themesApi";

const emptyTheme = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  sortOrder: 100,
  primaryColor: "#08b256",
  secondaryColor: "#0a3566",
  accentColor: "#f97316",
  pageBg: "#ffffff",
  textPrimary: "#020617",
  textSecondary: "#64748b",
  headerBg: "#0a3566",
  headerTextColor: "#ffffff",
  headerLogoUrl: "",
  bottomNavBg: "#0a3566",
  bottomNavActiveColor: "#ffffff",
  bottomNavInactiveColor: "#dbeafe",
  cardBg: "#ffffff",
  cardTextColor: "#020617",
  cardRadius: 14,
  buttonBg: "#08b256",
  buttonTextColor: "#ffffff",
  badgeBg: "#ef4444",
  badgeTextColor: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "#e2e8f0",
  gradientFrom: "",
  gradientTo: "",
  splashLogoUrl: "",
};

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-slate-200 bg-white"
        />
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
    </div>
  );
}

function ThemePreview({ theme }: { theme: any }) {
  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-sm"
      style={{
        background: theme.pageBg,
        color: theme.textPrimary,
        borderColor: theme.inputBorder,
      }}
    >
      <div
        className="flex h-20 items-center justify-between px-4"
        style={{
          background: `linear-gradient(135deg, ${theme.gradientFrom || theme.headerBg}, ${
            theme.gradientTo || theme.secondaryColor
          })`,
          color: theme.headerTextColor,
        }}
      >
        <div>
          <div className="text-xs font-bold opacity-80">Header</div>
          <div className="text-lg font-black">{theme.name || "Tema KroniX"}</div>
        </div>

        {theme.headerLogoUrl ? (
          <img
            src={theme.headerLogoUrl}
            alt="Logo"
            className="h-12 max-w-[150px] object-contain"
          />
        ) : (
          <div className="rounded-full bg-white/20 px-3 py-2 text-xs font-black">KroniX</div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div
          className="rounded-2xl p-3 shadow-sm"
          style={{
            background: theme.cardBg,
            color: theme.cardTextColor,
            borderRadius: theme.cardRadius,
            border: `1px solid ${theme.inputBorder}`,
          }}
        >
          <div className="font-black">Card de producto</div>
          <div style={{ color: theme.textSecondary }} className="mt-1 text-xs font-semibold">
            Vista previa del tema
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="font-black" style={{ color: theme.accentColor }}>
              $24.000
            </div>

            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm font-black"
              style={{
                background: theme.buttonBg,
                color: theme.buttonTextColor,
              }}
            >
              +
            </button>
          </div>
        </div>

        <div
          className="flex items-center justify-around rounded-2xl px-3 py-3 text-xs font-black"
          style={{
            background: theme.bottomNavBg,
            color: theme.bottomNavInactiveColor,
          }}
        >
          <span style={{ color: theme.bottomNavActiveColor }}>Inicio</span>
          <span>Pedidos</span>
          <span>Carrito</span>
          <span>Perfil</span>
        </div>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<AdminTheme[]>([]);
  const [selected, setSelected] = useState<any>(emptyTheme);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedThemes = useMemo(() => {
    return [...themes].sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
  }, [themes]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const rows = await adminListThemes();
      setThemes(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || "Error cargando temas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectTheme(theme: AdminTheme) {
    setSelectedId(theme.id);
    setSelected({
      ...emptyTheme,
      ...theme,
      headerLogoUrl: theme.headerLogoUrl ?? "",
      gradientFrom: theme.gradientFrom ?? "",
      gradientTo: theme.gradientTo ?? "",
      splashLogoUrl: theme.splashLogoUrl ?? "",
      description: theme.description ?? "",
    });
  }

  function newTheme() {
    setSelectedId(null);
    setSelected({ ...emptyTheme });
  }

  async function save() {
    setSaving(true);
    setError("");

    try {
      if (selectedId) {
        await adminUpdateTheme(selectedId, selected);
      } else {
        await adminCreateTheme(selected);
      }

      await load();
    } catch (e: any) {
      setError(e?.message || "Error guardando tema");
    } finally {
      setSaving(false);
    }
  }

  async function duplicate() {
    if (!selectedId) return;
    setSaving(true);

    try {
      await adminDuplicateTheme(selectedId);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm("¿Eliminar este tema?")) return;

    setSaving(true);

    try {
      await adminDeleteTheme(selectedId);
      setSelectedId(null);
      setSelected({ ...emptyTheme });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-4 md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="text-sm font-bold text-slate-500">KroniX CTCC</div>
          <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Temas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra la identidad visual reutilizable de las tiendas.
          </p>
        </div>

        <button
          type="button"
          onClick={newTheme}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          + Nuevo tema
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="xl:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 text-sm font-black text-slate-900">
              Temas disponibles
            </div>

            {loading ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Cargando...
              </div>
            ) : (
              <div className="space-y-2">
                {sortedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => selectTheme(theme)}
                    className={[
                      "w-full rounded-2xl border p-3 text-left transition",
                      selectedId === theme.id
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ background: theme.primaryColor }}
                      />
                      <span className="text-sm font-black">{theme.name}</span>
                    </div>
                    <div className="mt-1 text-[11px] font-bold opacity-70">
                      {theme.code}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="xl:col-span-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-950">
                  {selectedId ? "Editar tema" : "Nuevo tema"}
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Store App no puede modificar estos valores.
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                Activo
                <input
                  type="checkbox"
                  checked={Boolean(selected.isActive)}
                  onChange={(e) =>
                    setSelected((s: any) => ({ ...s, isActive: e.target.checked }))
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Code"
                value={selected.code}
                onChange={(v) => setSelected((s: any) => ({ ...s, code: v }))}
              />
              <Field
                label="Nombre"
                value={selected.name}
                onChange={(v) => setSelected((s: any) => ({ ...s, name: v }))}
              />
              <Field
                label="Descripción"
                value={selected.description}
                onChange={(v) => setSelected((s: any) => ({ ...s, description: v }))}
              />
              <Field
                label="Orden"
                type="number"
                value={selected.sortOrder}
                onChange={(v) => setSelected((s: any) => ({ ...s, sortOrder: v }))}
              />

              <ColorField label="Primary" value={selected.primaryColor} onChange={(v) => setSelected((s: any) => ({ ...s, primaryColor: v }))} />
              <ColorField label="Secondary" value={selected.secondaryColor} onChange={(v) => setSelected((s: any) => ({ ...s, secondaryColor: v }))} />
              <ColorField label="Accent" value={selected.accentColor} onChange={(v) => setSelected((s: any) => ({ ...s, accentColor: v }))} />
              <ColorField label="Page BG" value={selected.pageBg} onChange={(v) => setSelected((s: any) => ({ ...s, pageBg: v }))} />

              <ColorField label="Header BG" value={selected.headerBg} onChange={(v) => setSelected((s: any) => ({ ...s, headerBg: v }))} />
              <ColorField label="Header Text" value={selected.headerTextColor} onChange={(v) => setSelected((s: any) => ({ ...s, headerTextColor: v }))} />
              <Field label="Header Logo URL" value={selected.headerLogoUrl} onChange={(v) => setSelected((s: any) => ({ ...s, headerLogoUrl: v }))} />

              <ColorField label="BottomNav BG" value={selected.bottomNavBg} onChange={(v) => setSelected((s: any) => ({ ...s, bottomNavBg: v }))} />
              <ColorField label="BottomNav Active" value={selected.bottomNavActiveColor} onChange={(v) => setSelected((s: any) => ({ ...s, bottomNavActiveColor: v }))} />
              <ColorField label="BottomNav Inactive" value={selected.bottomNavInactiveColor} onChange={(v) => setSelected((s: any) => ({ ...s, bottomNavInactiveColor: v }))} />

              <ColorField label="Card BG" value={selected.cardBg} onChange={(v) => setSelected((s: any) => ({ ...s, cardBg: v }))} />
              <ColorField label="Card Text" value={selected.cardTextColor} onChange={(v) => setSelected((s: any) => ({ ...s, cardTextColor: v }))} />
              <Field label="Card Radius" type="number" value={selected.cardRadius} onChange={(v) => setSelected((s: any) => ({ ...s, cardRadius: v }))} />

              <ColorField label="Button BG" value={selected.buttonBg} onChange={(v) => setSelected((s: any) => ({ ...s, buttonBg: v }))} />
              <ColorField label="Button Text" value={selected.buttonTextColor} onChange={(v) => setSelected((s: any) => ({ ...s, buttonTextColor: v }))} />

              <ColorField label="Badge BG" value={selected.badgeBg} onChange={(v) => setSelected((s: any) => ({ ...s, badgeBg: v }))} />
              <ColorField label="Badge Text" value={selected.badgeTextColor} onChange={(v) => setSelected((s: any) => ({ ...s, badgeTextColor: v }))} />

              <ColorField label="Input BG" value={selected.inputBg} onChange={(v) => setSelected((s: any) => ({ ...s, inputBg: v }))} />
              <ColorField label="Input Border" value={selected.inputBorder} onChange={(v) => setSelected((s: any) => ({ ...s, inputBorder: v }))} />

              <ColorField label="Gradient From" value={selected.gradientFrom || "#000000"} onChange={(v) => setSelected((s: any) => ({ ...s, gradientFrom: v }))} />
              <ColorField label="Gradient To" value={selected.gradientTo || "#000000"} onChange={(v) => setSelected((s: any) => ({ ...s, gradientTo: v }))} />
              <Field label="Splash Logo URL" value={selected.splashLogoUrl} onChange={(v) => setSelected((s: any) => ({ ...s, splashLogoUrl: v }))} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-[#08b256] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar tema"}
              </button>

              {selectedId ? (
                <>
                  <button
                    type="button"
                    onClick={duplicate}
                    disabled={saving}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-800"
                  >
                    Duplicar
                  </button>

                  <button
                    type="button"
                    onClick={remove}
                    disabled={saving}
                    className="rounded-2xl border border-rose-200 px-5 py-3 text-sm font-black text-rose-700"
                  >
                    Eliminar
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="xl:col-span-3">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-black text-slate-900">
              Vista previa
            </div>
            <ThemePreview theme={selected} />
          </div>
        </section>
      </div>
    </main>
  );
}