//app\(cc)\buyer\components\BuyersTable.tsx
import type { BuyerAdminItem, KronixPlusApplication } from "../lib/buyerAdminApi";
import { formatDate, getPersonLabel } from "../lib/buyerAdminApi";
import type { BuyerAdminTab } from "./BuyerTabs";

type Props = {
  buyers: BuyerAdminItem[];
  selectedBuyerId: string;
  loading: boolean;
  plusByUserId: Map<string, KronixPlusApplication>;
  onSelect: (buyer: BuyerAdminItem, tab: BuyerAdminTab) => void;
};

function statusChip(text: string, cls: string) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${cls}`}>{text}</span>;
}

export default function BuyersTable({ buyers, selectedBuyerId, loading, plusByUserId, onSelect }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <h2 className="text-base font-black text-slate-950">Listado de clientes</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Vista centralizada de compradores, wallet y KroniX Plus.</p>
        </div>
        <div className="text-xs font-bold text-slate-500">{loading ? "Cargando..." : `${buyers.length} en vista`}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Legal</th>
              <th className="px-4 py-3">KroniX Plus</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {buyers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                  No hay clientes para los filtros actuales.
                </td>
              </tr>
            ) : (
              buyers.map((buyer) => {
                const plus = plusByUserId.get(buyer.id);
                const plusStatus = String(plus?.status ?? "NONE").toUpperCase();
                const selected = selectedBuyerId === buyer.id;

                return (
                  <tr key={buyer.id} className={selected ? "bg-sky-50/55" : "bg-white"}>
                    <td className="px-4 py-4">
                      <div className="font-black text-slate-950">{getPersonLabel(buyer)}</div>
                      <div className="mt-1 text-xs text-slate-500">ID: {buyer.id}</div>
                      <div className="mt-1 text-xs text-slate-400">Creado: {formatDate(buyer.createdAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-slate-700">{buyer.email || "Sin correo"}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{buyer.phone || "Sin teléfono"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                      {buyer.city?.name ? `${buyer.city.name}${buyer.city.department ? `, ${buyer.city.department}` : ""}` : "Sin ciudad"}
                    </td>
                    <td className="px-4 py-4">
                      {buyer.legal?.legalCurrent
                        ? statusChip("Legal OK", "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200")
                        : buyer.legal?.hasOutdatedLegal
                          ? statusChip("Desactualizado", "bg-amber-50 text-amber-700 ring-1 ring-amber-200")
                          : statusChip("Pendiente", "bg-slate-100 text-slate-600 ring-1 ring-slate-200")}
                    </td>
                    <td className="px-4 py-4">
                      {plusStatus === "APPROVED"
                        ? statusChip("Aprobado", "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200")
                        : plusStatus === "PENDING"
                          ? statusChip("Pendiente", "bg-amber-50 text-amber-700 ring-1 ring-amber-200")
                          : plusStatus === "REJECTED"
                            ? statusChip("Rechazado", "bg-rose-50 text-rose-700 ring-1 ring-rose-200")
                            : statusChip("Sin solicitud", "bg-slate-100 text-slate-600 ring-1 ring-slate-200")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => onSelect(buyer, "PROFILE")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50">
                          Ver perfil
                        </button>
                        <button type="button" onClick={() => onSelect(buyer, "WALLET")} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 hover:bg-sky-100">
                          Wallet
                        </button>
                        <button type="button" onClick={() => onSelect(buyer, "PLUS")} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100">
                          Plus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
