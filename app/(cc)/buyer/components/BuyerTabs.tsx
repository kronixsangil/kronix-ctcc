//app\(cc)\buyer\components\BuyerTabs.tsx
export type BuyerAdminTab = "PROFILE" | "WALLET" | "PLUS";

export default function BuyerTabs({
  value,
  onChange,
}: {
  value: BuyerAdminTab;
  onChange: (tab: BuyerAdminTab) => void;
}) {
  const tabs: Array<{ value: BuyerAdminTab; label: string; helper: string }> = [
    { value: "PROFILE", label: "Ver perfil", helper: "Datos del cliente" },
    { value: "WALLET", label: "Wallet", helper: "Saldo y movimientos" },
    { value: "PLUS", label: "Plus", helper: "KroniX Envíos" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={[
              "rounded-2xl px-4 py-2 text-left text-xs font-extrabold transition",
              active
                ? "bg-slate-950 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <div>{tab.label}</div>
            <div className={active ? "text-white/65" : "text-slate-400"}>{tab.helper}</div>
          </button>
        );
      })}
    </div>
  );
}

