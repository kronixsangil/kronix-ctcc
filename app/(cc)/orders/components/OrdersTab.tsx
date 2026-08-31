"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import OrdersTable, {
  type OrdersTableFilters,
} from "./OrdersTable";
import OrderDetailsModal from "./OrderDetailsModal";
import { useCtccCity } from "@/app/(cc)/components/CtccCityContext";
import {
  getOrderServiceMeta,
  listAdminOrders,
  type AdminOrderRow,
} from "../lib/ordersApi";

const EMPTY_TABLE_FILTERS: OrdersTableFilters = {
  id: "",
  serviceKey: "",
  city: "",
  status: "",
  flowStatus: "",
  paymentStatus: "",
  commission: "",
  driver: "",
  date: "",
};

function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("es");
}

function kpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone: "blue" | "green" | "amber" | "violet";
}) {
  const tones = {
    blue: {
      card: "border-blue-200 bg-blue-50/70",
      value: "text-blue-700",
    },
    green: {
      card: "border-emerald-200 bg-emerald-50/70",
      value: "text-emerald-700",
    },
    amber: {
      card: "border-amber-200 bg-amber-50/70",
      value: "text-amber-700",
    },
    violet: {
      card: "border-violet-200 bg-violet-50/70",
      value: "text-violet-700",
    },
  } as const;

  const selected = tones[tone];

  return (
    <div
      className={[
        "rounded-3xl border p-4 shadow-sm",
        selected.card,
      ].join(" ")}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div
        className={[
          "mt-2 text-3xl font-bold tracking-tight",
          selected.value,
        ].join(" ")}
      >
        {value}
      </div>

      {hint ? (
        <div className="mt-2 text-xs text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}


export default function OrdersTab() {
  const { mode, citySlug: globalCitySlug, cityLabel } = useCtccCity();

  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tableFilters, setTableFilters] =
    useState<OrdersTableFilters>(EMPTY_TABLE_FILTERS);

  const reqSeq = useRef(0);

  const isGlobalCityLocked = mode === "CITY" && !!globalCitySlug;
  const effectiveCitySlug = isGlobalCityLocked ? globalCitySlug : "";

  async function load() {
    const mySeq = ++reqSeq.current;
    setLoading(true);

    try {
      const r = await listAdminOrders({
        citySlug: effectiveCitySlug,
        page: 1,
        limit: 20,
      });

      if (mySeq === reqSeq.current) {
        setRows(r.items ?? []);
      }
    } finally {
      if (mySeq === reqSeq.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCitySlug]);

  const visibleRows = useMemo(() => {
    const f = tableFilters;

    return rows.filter((row) => {
      const service = getOrderServiceMeta(row);

      if (f.id && !normalize(row.id).includes(normalize(f.id))) {
        return false;
      }

      if (
        f.serviceKey &&
        String(service.key ?? "").trim().toUpperCase() !==
          String(f.serviceKey).trim().toUpperCase()
      ) {
        return false;
      }

      if (f.city) {
        const cityText = [
          row.city?.name,
          row.city?.department,
          row.city?.slug,
        ]
          .map(normalize)
          .join(" ");

        if (!cityText.includes(normalize(f.city))) return false;
      }

      if (
        f.status &&
        String(row.status ?? "").trim().toUpperCase() !==
          String(f.status).trim().toUpperCase()
      ) {
        return false;
      }

      if (
        f.flowStatus &&
        String(row.flowStatus ?? "").trim().toUpperCase() !==
          String(f.flowStatus).trim().toUpperCase()
      ) {
        return false;
      }

      if (
        f.paymentStatus &&
        String(row.paymentStatus ?? "").trim().toUpperCase() !==
          String(f.paymentStatus).trim().toUpperCase()
      ) {
        return false;
      }

      if (f.commission) {
        const commissionText = String(Number(row.workerCommissionCOP ?? 0));
        if (!commissionText.includes(String(f.commission).trim())) return false;
      }

      if (
        f.driver &&
        !normalize(row.driverSummary).includes(normalize(f.driver))
      ) {
        return false;
      }

      if (f.date) {
        const created = row.createdAt ? new Date(row.createdAt) : null;

        if (!created || Number.isNaN(created.getTime())) return false;

        const year = created.getFullYear();
        const month = String(created.getMonth() + 1).padStart(2, "0");
        const day = String(created.getDate()).padStart(2, "0");
        const localDate = `${year}-${month}-${day}`;

        if (localDate !== f.date) return false;
      }

      return true;
    });
  }, [rows, tableFilters]);

  const totalOrders = visibleRows.length;

  const deliveredOrders = visibleRows.filter(
    (row) => String(row.flowStatus ?? "").toUpperCase() === "DELIVERED"
  ).length;

  const paidOrders = visibleRows.filter(
    (row) => String(row.paymentStatus ?? "").toUpperCase() === "PAID"
  ).length;

  const salesTotal = visibleRows.reduce(
    (acc, row) => acc + Number(row.totalCOP ?? 0),
    0
  );

  const clearTableFilters = () => {
    setTableFilters(EMPTY_TABLE_FILTERS);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {kpiCard({
          label: "Órdenes en vista",
          value: loading ? "..." : totalOrders,
          hint: isGlobalCityLocked
            ? `Filtrado por ${cityLabel}`
            : "Resultado según filtros de tabla",
          tone: "blue",
        })}

        {kpiCard({
          label: "Entregadas",
          value: loading ? "..." : deliveredOrders,
          hint: "Flow status = DELIVERED",
          tone: "green",
        })}

        {kpiCard({
          label: "Pagadas",
          value: loading ? "..." : paidOrders,
          hint: "Payment status = PAID",
          tone: "amber",
        })}

        {kpiCard({
          label: "Ventas en vista",
          value: loading ? "..." : formatCOP(salesTotal),
          hint: "Suma de totalCOP del resultado actual",
          tone: "violet",
        })}
      </div>

      <OrdersTable
        rows={visibleRows}
        sourceRows={rows}
        loading={loading}
        selectedId={selectedId ?? undefined}
        filters={tableFilters}
        onFiltersChange={setTableFilters}
        onClearFilters={clearTableFilters}
        onRefresh={() => void load()}
        onActions={(id) => setSelectedId(id)}
      />

      {selectedId ? (
        <OrderDetailsModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={() => void load()}
        />
      ) : null}
    </div>
  );
}
