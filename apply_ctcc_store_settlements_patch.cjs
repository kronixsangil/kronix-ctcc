// apply_ctcc_store_settlements_patch.cjs
// Ejecuta este archivo desde la raíz del proyecto CTCC:
// node apply_ctcc_store_settlements_patch.cjs

const fs = require("fs");
const path = require("path");

const storesTabPath = path.join(process.cwd(), "app", "(cc)", "stores", "components", "StoresTab.tsx");

if (!fs.existsSync(storesTabPath)) {
  console.error("No encontré app/(cc)/stores/components/StoresTab.tsx. Ejecuta este script desde la raíz del CTCC.");
  process.exit(1);
}

let src = fs.readFileSync(storesTabPath, "utf8");
let changed = false;

function replaceOnce(label, from, to) {
  if (src.includes(to)) {
    console.log(`✓ ${label}: ya estaba aplicado`);
    return;
  }

  if (!src.includes(from)) {
    console.error(`\nNo pude aplicar: ${label}`);
    console.error("No encontré el bloque esperado. Revisa si StoresTab.tsx cambió.");
    process.exit(1);
  }

  src = src.replace(from, to);
  changed = true;
  console.log(`✓ ${label}: aplicado`);
}

replaceOnce(
  "Import StoreSettlementsTab",
  'import StoreDetailsModal from "./StoreDetailsModal";\n',
  'import StoreDetailsModal from "./StoreDetailsModal";\nimport StoreSettlementsTab from "./StoreSettlementsTab";\n'
);

replaceOnce(
  "Tipo StoresSectionTab",
  'type StoresSectionTab = "STORES" | "SYSTEM_FEES" | "ZONES" | "PROMOS";',
  'type StoresSectionTab = "STORES" | "SYSTEM_FEES" | "ZONES" | "PROMOS" | "SETTLEMENTS";'
);

replaceOnce(
  "Botón Pagos y Conciliaciones",
  `            <button
              onClick={() => setSectionTab("PROMOS")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "PROMOS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Promociones
            </button>`,
  `            <button
              onClick={() => setSectionTab("PROMOS")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "PROMOS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Promociones
            </button>

            <button
              onClick={() => setSectionTab("SETTLEMENTS")}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                sectionTab === "SETTLEMENTS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Pagos y Conciliaciones
            </button>`
);

replaceOnce(
  "Render Pagos y Conciliaciones",
  `      {selectedId ? (
        <StoreDetailsModal`,
  `      {sectionTab === "SETTLEMENTS" ? <StoreSettlementsTab /> : null}

      {selectedId ? (
        <StoreDetailsModal`
);

if (changed) {
  fs.writeFileSync(storesTabPath, src, "utf8");
  console.log("\nListo. StoresTab.tsx fue actualizado.");
} else {
  console.log("\nNo había cambios pendientes en StoresTab.tsx.");
}
