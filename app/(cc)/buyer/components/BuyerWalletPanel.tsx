//app\(cc)\buyer\components\BuyerWalletPanel.tsx
import { useEffect, useMemo, useState } from "react";
import type { BuyerAdminItem, WalletDetailResponse } from "../lib/buyerAdminApi";
import { adjustWallet, formatCOP, formatDate, getPersonLabel, loadWalletDetail } from "../lib/buyerAdminApi";

type Props = {
  buyer: BuyerAdminItem | null;
  cityId?: string;
};

type TxFilter = "ALL" | "INCOME" | "OUTCOME" | "RECHARGES" | "ORDERS" | "ADJUSTMENTS";

export default function BuyerWalletPanel({ buyer, cityId }: Props) {
  const [detail, setDetail] = useState<WalletDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<"CASH" | "BONUS">("CASH");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txFilter, setTxFilter] = useState<TxFilter>("ALL");

  async function refresh() {
    if (!buyer?.id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await loadWalletDetail(buyer.id, { cityId, limit: 80 });
      setDetail(res);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el wallet del cliente.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer?.id, cityId]);

  const stats = useMemo(() => {
    const items = detail?.items ?? [];
    return items.reduce(
      (acc, item) => {
        const n = Number(item.amountCOP ?? 0);
        const type = String(item.type ?? "").toUpperCase();
        if (n > 0) acc.income += n;
        if (n < 0) acc.outcome += Math.abs(n);
        if (type.includes("RECHARGE")) acc.recharges += Math.abs(n);
        if (type === "ORDER_PAYMENT") acc.orders += Math.abs(n);
        if (type === "ADMIN_ADJUSTMENT") acc.adjustments += Math.abs(n);
        return acc;
      },
      { income: 0, outcome: 0, recharges: 0, orders: 0, adjustments: 0 }
    );
  }, [detail]);

  const filtered = useMemo(() => {
    const items = detail?.items ?? [];
    return items.filter((item) => {
      const n = Number(item.amountCOP ?? 0);
      const type = String(item.type ?? "").toUpperCase();
      if (txFilter === "INCOME") return n > 0;
      if (txFilter === "OUTCOME") return n < 0;
      if (txFilter === "RECHARGES") return type.includes("RECHARGE");
      if (txFilter === "ORDERS") return type === "ORDER_PAYMENT";
      if (txFilter === "ADJUSTMENTS") return type === "ADMIN_ADJUSTMENT";
      return true;
    });
  }, [detail, txFilter]);

  async function submitAdjust() {
    if (!buyer?.id) return;
    const amountCOP = Math.round(Number(amount || 0));
    if (!Number.isFinite(amountCOP) || amountCOP === 0) {
      setMsg("Escribe un valor distinto de 0.");
      return;
    }
    if (note.trim().length < 5) {
      setMsg("Escribe una nota mínima de 5 caracteres.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await adjustWallet({ userId: buyer.id, cityId, bucket, amountCOP, note: note.trim() });
      setAmount("");
      setNote("");
      setMsg("Ajuste aplicado correctamente.");
      await refresh();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo aplicar el ajuste.");
    } finally {
      setSaving(false);
    }
  }

  if (!buyer) return <Empty text="Selecciona un cliente para ver su wallet." />;
  if (loading) return <Empty text="Cargando wallet del cliente..." />;
  if (error) return <Empty text={error} tone="rose" />;
  if (!detail) return <Empty text="Este cliente todavía no tiene wallet para la ciudad seleccionada." />;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Wallet KroniX</div>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{getPersonLabel(detail.user)}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Control financiero del cliente seleccionado.</p>
        </div>
        <button type="button" onClick={refresh} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 hover:bg-slate-50">Actualizar</button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Card label="Total" value={formatCOP(detail.wallet.totalAvailableCOP)} />
        <Card label="Cash" value={formatCOP(detail.wallet.cashBalanceCOP)} />
        <Card label="Bono" value={formatCOP(detail.wallet.bonusBalanceCOP)} />
        <Card label="Actualizado" value={formatDate(detail.wallet.updatedAt)} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Card label="Ingresos" value={formatCOP(stats.income)} tone="emerald" />
        <Card label="Salidas" value={formatCOP(stats.outcome)} tone="rose" />
        <Card label="Recargas" value={formatCOP(stats.recharges)} tone="sky" />
        <Card label="Ajustes" value={formatCOP(stats.adjustments)} tone="amber" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-base font-black text-slate-900">Ajuste manual</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select value={bucket} onChange={(e) => setBucket(e.target.value as any)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none">
            <option value="CASH">CASH</option>
            <option value="BONUS">BONUS</option>
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 10000 o -5000" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota obligatoria" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none md:col-span-1" />
          <button type="button" onClick={submitAdjust} disabled={saving} className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60">{saving ? "Aplicando..." : "Aplicar ajuste"}</button>
        </div>
        {msg ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{msg}</div> : null}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-base font-black text-slate-900">Movimientos</div>
            <div className="mt-1 text-sm text-slate-500">Últimas transacciones del wallet.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["ALL","Todo"],["RECHARGES","Recargas"],["ORDERS","Pedidos"],["ADJUSTMENTS","Ajustes"],["INCOME","Ingresos"],["OUTCOME","Salidas"]].map(([v,l]) => (
              <button key={v} type="button" onClick={() => setTxFilter(v as TxFilter)} className={["rounded-full px-3 py-1.5 text-[11px] font-black", txFilter === v ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"].join(" ")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? <Empty text="No hay movimientos para este filtro." compact /> : filtered.map((item) => {
            const n = Number(item.amountCOP ?? 0);
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-slate-900">{String(item.type || "Movimiento")}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)} · {String(item.bucket || "").toUpperCase()}</div>
                    {item.note ? <div className="mt-2 text-sm text-slate-700">{item.note}</div> : null}
                  </div>
                  <div className={n < 0 ? "text-sm font-black text-rose-700" : "text-sm font-black text-emerald-700"}>{n < 0 ? "-" : "+"}{formatCOP(Math.abs(n))}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Empty({ text, tone = "slate", compact = false }: { text: string; tone?: "slate" | "rose"; compact?: boolean }) {
  return <div className={["rounded-3xl border px-4 text-center text-sm font-semibold", compact ? "py-6" : "bg-white py-10", tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-500"].join(" ")}>{text}</div>;
}

function Card({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "emerald" | "rose" | "sky" | "amber" }) {
  const cls = tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-800" : tone === "sky" ? "border-sky-200 bg-sky-50 text-sky-800" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-900";
  return <div className={`rounded-2xl border px-4 py-3 ${cls}`}><div className="text-[11px] font-black uppercase tracking-[0.14em] opacity-70">{label}</div><div className="mt-1 text-base font-black">{value}</div></div>;
}
