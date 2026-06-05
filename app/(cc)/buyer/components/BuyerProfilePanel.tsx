//app\(cc)\buyer\components\BuyerProfilePanel.tsx
import type { BuyerAdminItem } from "../lib/buyerAdminApi";
import { formatDate, getPersonLabel } from "../lib/buyerAdminApi";

export default function BuyerProfilePanel({ buyer }: { buyer: BuyerAdminItem | null }) {
  if (!buyer) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Selecciona un cliente para ver su perfil.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Perfil Buyer</div>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{getPersonLabel(buyer)}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Datos principales del cliente comprador.</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">Rol: {buyer.role || "BUYER"}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Nombre" value={buyer.name} />
        <Info label="Nickname" value={buyer.nickname} />
        <Info label="Teléfono" value={buyer.phone} />
        <Info label="Email" value={buyer.email} />
        <Info label="Ciudad" value={buyer.city?.name ? `${buyer.city.name}${buyer.city.department ? `, ${buyer.city.department}` : ""}` : "Sin ciudad"} />
        <Info label="Creado" value={formatDate(buyer.createdAt)} />
        <Info label="Dirección predeterminada" value={buyer.defaultAddress} wide />
        <Info label="Coordenadas" value={buyer.defaultLat != null && buyer.defaultLng != null ? `${buyer.defaultLat}, ${buyer.defaultLng}` : "Sin coordenadas"} />
        <Info label="Estado" value={buyer.deletedAt ? "Inactivo / eliminado" : "Activo"} />
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-900">
        Próximo paso sugerido: conectar edición administrativa aquí cuando definamos qué datos podrá modificar CTCC sin afectar la cuenta del cliente.
      </div>
    </section>
  );
}

function Info({ label, value, wide }: { label: string; value?: any; wide?: boolean }) {
  const clean = String(value ?? "").trim();
  return (
    <div className={["rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3", wide ? "md:col-span-2" : ""].join(" ")}>
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-black text-slate-900">{clean || "—"}</div>
    </div>
  );
}
