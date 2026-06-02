// app/(cc)/stores/components/store-details/StorePermissionsTab.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
type Props = {
  mode: "create" | "edit";
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
};

function PermissionRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}

export default function StorePermissionsTab({ mode, form, setForm }: Props) {
  const disabled = mode === "create";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Permisos catálogo / Store App</div>
        <div className="mt-1 text-xs text-slate-500">
          Controla qué puede hacer el comercio desde la Store App.
        </div>
      </div>

      {mode === "create" ? (
        <div className="border-b border-slate-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Los permisos se podrán ajustar después de crear la tienda.
        </div>
      ) : null}

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <PermissionRow
          label="Catálogo habilitado"
          checked={Boolean(form?.productsFeatureEnabled)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, productsFeatureEnabled: checked }))}
        />

        <PermissionRow
          label="Puede administrar productos"
          checked={Boolean(form?.storeAppCanManageProducts)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanManageProducts: checked }))}
        />

        <PermissionRow
          label="Puede crear productos"
          checked={Boolean(form?.storeAppCanCreateProducts)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanCreateProducts: checked }))}
        />

        <PermissionRow
          label="Puede editar productos"
          checked={Boolean(form?.storeAppCanEditProducts)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanEditProducts: checked }))}
        />

        <PermissionRow
          label="Puede eliminar productos"
          checked={Boolean(form?.storeAppCanDeleteProducts)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanDeleteProducts: checked }))}
        />

        <PermissionRow
          label="Puede cambiar precios"
          checked={Boolean(form?.storeAppCanChangeProductPrices)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanChangeProductPrices: checked }))}
        />

        <PermissionRow
          label="Puede usar imágenes"
          checked={Boolean(form?.storeAppCanUploadProductImages)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanUploadProductImages: checked }))}
        />

        <PermissionRow
          label="Puede usar cámara"
          checked={Boolean(form?.storeAppCanUseProductCamera)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanUseProductCamera: checked }))}
        />

        <PermissionRow
          label="Puede importar CSV"
          checked={Boolean(form?.storeAppCanImportProductsCsv)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanImportProductsCsv: checked }))}
        />

        <PermissionRow
          label="Puede activar / desactivar"
          checked={Boolean(form?.storeAppCanToggleProductActive)}
          disabled={disabled}
          onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanToggleProductActive: checked }))}
        />

        <div className="md:col-span-2">
          <PermissionRow
            label="Puede cambiar disponibilidad"
            checked={Boolean(form?.storeAppCanToggleProductAvailable)}
            disabled={disabled}
            onChange={(checked) => setForm((s: any) => ({ ...s, storeAppCanToggleProductAvailable: checked }))}
          />
        </div>
      </div>
    </div>
  );
}
