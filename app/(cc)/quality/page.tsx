//app\(cc)\quality\page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCtccCity } from "../components/CtccCityContext";
import {
  getQualityOverview,
  getQualityReviews,
  type QualityOverview,
  type QualityReviewItem,
  type QualityReviewType,
  type QualityServiceType,
} from "./lib/qualityApi";

function formatCOP(value?: number | null) {
  const n = Number(value ?? 0);
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDateTime(value?: string | null) {
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

function ratingText(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toFixed(2);
}

function getServiceLabel(orderType?: string | null, courierServiceType?: string | null) {
  const ot = String(orderType ?? "").toUpperCase();
  const ct = String(courierServiceType ?? "").toUpperCase();

  if (ot !== "COURIER") return "Tienda";

  if (ct === "SEND_PACKAGE") return "KroniX Envíos";
  if (ct === "ERRAND") return "Domicilios y Diligencias";
  if (ct === "PICKUP_AND_DELIVERY") return "Domicilio Express";

  return "Courier";
}

function getTargetLabel(type: string) {
  return type === "DRIVER" ? "Conductor" : "Tienda";
}

function KpiCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "slate" | "green" | "blue" | "amber" | "rose";
}) {
  const toneClass =
    tone === "green"
      ? "from-emerald-50 to-white text-emerald-700"
      : tone === "blue"
      ? "from-blue-50 to-white text-blue-700"
      : tone === "amber"
      ? "from-amber-50 to-white text-amber-700"
      : tone === "rose"
      ? "from-rose-50 to-white text-rose-700"
      : "from-slate-50 to-white text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`rounded-2xl bg-gradient-to-br ${toneClass} p-4`}>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="mt-3 text-3xl font-black leading-none">{value}</div>
        <div className="mt-3 text-xs font-medium text-slate-500">{hint}</div>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < safe ? "text-amber-500" : "text-slate-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: QualityReviewItem }) {
  const isCritical = Number(review.rating ?? 0) <= 3;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                review.type === "DRIVER"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
              ].join(" ")}
            >
              {getTargetLabel(review.type)}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                isCritical
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
              ].join(" ")}
            >
              {review.rating}/5
            </span>

            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-100">
              {getServiceLabel(review.orderType, review.courierServiceType)}
            </span>
          </div>

          <div className="mt-3 text-sm font-black text-slate-900">
            {review.targetName || "—"}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Cliente: <span className="font-semibold">{review.customerName || "Cliente"}</span>
            {" · "}
            Orden: <span className="font-semibold">...{String(review.orderId).slice(-6)}</span>
          </div>

          {review.comment ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-100">
              “{review.comment}”
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400 ring-1 ring-slate-100">
              Sin comentario escrito.
            </div>
          )}
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <div className="flex lg:justify-end">
            <Stars rating={review.rating} />
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {formatDateTime(review.createdAt)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{review.cityLabel}</div>
          {review.totalCOP != null ? (
            <div className="mt-2 text-sm font-black text-slate-900">{formatCOP(review.totalCOP)}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function QualityPage() {
  const { mode, citySlug, cityLabel } = useCtccCity();

  const [overview, setOverview] = useState<QualityOverview | null>(null);
  const [reviews, setReviews] = useState<QualityReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);

  const [type, setType] = useState<QualityReviewType>("ALL");
  const [serviceType, setServiceType] = useState<QualityServiceType>("ALL");
  const [ratingMax, setRatingMax] = useState<string>("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const effectiveCitySlug = mode === "GLOBAL" ? "" : citySlug;

  const query = useMemo(
    () => ({
      citySlug: effectiveCitySlug,
      type,
      serviceType,
      ratingMax,
      q,
      from,
      to,
      page: 1,
      limit: 40,
    }),
    [effectiveCitySlug, type, serviceType, ratingMax, q, from, to]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const [overviewRes, reviewsRes] = await Promise.all([
        getQualityOverview(query),
        getQualityReviews(query),
      ]);

      setOverview(overviewRes);
      setReviews(Array.isArray(reviewsRes.items) ? reviewsRes.items : []);
      setTotalReviews(Number(reviewsRes.total ?? 0));
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar el módulo de calidad.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  function clearFilters() {
    setType("ALL");
    setServiceType("ALL");
    setRatingMax("");
    setQ("");
    setFrom("");
    setTo("");
  }

  const avgGeneral = overview?.totals?.avgRating ?? null;
  const avgDriver = overview?.drivers?.avgRating ?? null;
  const avgStore = overview?.stores?.avgRating ?? null;

  return (
    <main className="p-4 md:p-6">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 shadow-sm">
        <div className="relative p-6 text-white md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.18),transparent_34%)]" />

          <div className="relative">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.20em] text-white/80 ring-1 ring-white/10">
              Calidad · Experiencia del cliente
            </div>

            <div className="mt-5 text-3xl font-black tracking-tight">
              Control de Calidad
            </div>

            <div className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80">
              Revisa comentarios, calificaciones, alertas críticas y desempeño de tiendas y conductores
              desde el CTCC.
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/20">
                Ciudad activa: {mode === "GLOBAL" ? "Vista Global" : cityLabel}
              </span>
              <span className="rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-200 ring-1 ring-blue-400/20">
                {overview?.totals?.allReviews ?? 0} reviews analizadas
              </span>
            </div>
          </div>
        </div>
      </section>

      {err ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {err}
        </div>
      ) : null}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Rating general"
          value={ratingText(avgGeneral)}
          hint="Promedio ponderado tiendas + drivers"
          tone="blue"
        />
        <KpiCard
          label="Rating drivers"
          value={ratingText(avgDriver)}
          hint={`${overview?.drivers?.count ?? 0} calificaciones a conductores`}
          tone="green"
        />
        <KpiCard
          label="Rating tiendas"
          value={ratingText(avgStore)}
          hint={`${overview?.stores?.count ?? 0} calificaciones a tiendas`}
          tone="amber"
        />
        <KpiCard
          label="Alertas críticas"
          value={String(overview?.totals?.criticalReviews ?? 0)}
          hint="Reviews con rating menor o igual a 3"
          tone="rose"
        />
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-black text-slate-900">Filtros de calidad</div>
              <div className="mt-1 text-sm text-slate-500">
                Los filtros se aplican automáticamente según ciudad, tipo, rating y fechas.
              </div>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Buscar
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cliente, comentario, orden..."
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Evaluado
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QualityReviewType)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            >
              <option value="ALL">Todos</option>
              <option value="DRIVER">Conductores</option>
              <option value="STORE">Tiendas</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Servicio
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as QualityServiceType)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            >
              <option value="ALL">Todos</option>
              <option value="STORE">Tienda</option>
              <option value="COURIER">Courier</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Rating máximo
            </label>
            <select
              value={ratingMax}
              onChange={(e) => setRatingMax(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos</option>
              <option value="5">5 o menos</option>
              <option value="4">4 o menos</option>
              <option value="3">3 o menos</option>
              <option value="2">2 o menos</option>
              <option value="1">1</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Acciones
            </label>
            <button
              onClick={clearFilters}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Fecha desde
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Fecha hasta
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-black text-slate-900">Reviews recientes</div>
                <div className="mt-1 text-sm text-slate-500">
                  {totalReviews} resultado(s) encontrados.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                Cargando reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                No hay reviews con estos filtros.
              </div>
            ) : (
              reviews.map((review) => <ReviewCard key={`${review.type}:${review.id}`} review={review} />)
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="text-lg font-black text-slate-900">Alertas críticas</div>
            <div className="mt-1 text-sm text-slate-500">Últimas reviews con rating bajo.</div>
          </div>

          <div className="space-y-3 p-5">
            {loading ? (
              <div className="text-sm text-slate-500">Cargando alertas...</div>
            ) : !overview?.recentCritical?.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">
                No hay alertas críticas recientes.
              </div>
            ) : (
              overview.recentCritical.map((review) => (
                <div
                  key={`${review.type}:${review.id}`}
                  className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900">
                        {review.targetName}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-rose-700">
                        {getTargetLabel(review.type)} · {review.rating}/5
                      </div>
                    </div>
                    <Stars rating={review.rating} />
                  </div>

                  <div className="mt-3 text-sm leading-relaxed text-slate-700">
                    {review.comment || "Sin comentario escrito."}
                  </div>

                  <div className="mt-3 text-[11px] font-semibold text-slate-500">
                    Orden ...{String(review.orderId).slice(-6)} · {formatDateTime(review.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}