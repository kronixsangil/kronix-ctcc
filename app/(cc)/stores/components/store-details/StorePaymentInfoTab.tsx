//app\(cc)\stores\components\store-details\StorePaymentInfoTab.tsx
"use client";

type Props = {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
};

function setValue(setForm: React.Dispatch<React.SetStateAction<any>>, key: string, value: any) {
  setForm((prev: any) => ({ ...prev, [key]: value }));
}

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-medium text-slate-600">{label}</div>
      {children}
      {helper ? <div className="mt-1 text-[11px] text-slate-500">{helper}</div> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: any;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: any;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    />
  );
}

function statusLabel(status: any) {
  const s = String(status ?? "NONE").toUpperCase();
  if (s === "PENDING") return "Pendiente aprobación";
  if (s === "APPROVED") return "Aprobada";
  if (s === "REJECTED") return "Rechazada";
  return "Sin configurar";
}

function statusClass(status: any) {
  const s = String(status ?? "NONE").toUpperCase();
  if (s === "PENDING") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (s === "APPROVED") return "bg-emerald-50 text-emerald-800 ring-emerald-100";
  if (s === "REJECTED") return "bg-rose-50 text-rose-800 ring-rose-100";
  return "bg-slate-50 text-slate-700 ring-slate-100";
}

export default function StorePaymentInfoTab({ form, setForm }: Props) {
  const method = String(form?.storePayoutMethod ?? "BANK_ACCOUNT").toUpperCase();
  const status = String(form?.storePayoutInfoStatus ?? "NONE").toUpperCase();

  function approve() {
    setForm((prev: any) => ({
      ...prev,
      storePayoutInfoStatus: "APPROVED",
      storePayoutInfoRejectedReason: "",
      storePayoutInfoReviewNotes:
        String(prev?.storePayoutInfoReviewNotes ?? "").trim() ||
        "Información validada por CTCC.",
    }));
  }

  function reject() {
    setForm((prev: any) => ({
      ...prev,
      storePayoutInfoStatus: "REJECTED",
      storePayoutInfoReviewNotes:
        String(prev?.storePayoutInfoReviewNotes ?? "").trim() ||
        "Información rechazada por CTCC.",
    }));
  }

  function markPending() {
    setForm((prev: any) => ({
      ...prev,
      storePayoutInfoStatus: "PENDING",
    }));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Información de pago</div>
            <div className="mt-1 text-xs text-slate-500">
              Validación de cuenta de pagos. No se administran pagos aquí; solo datos y aprobación.
            </div>
          </div>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-xs font-black ring-1",
              statusClass(status),
            ].join(" ")}
          >
            {statusLabel(status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <Field label="Medio de pago">
          <select
            value={method}
            onChange={(e) => setValue(setForm, "storePayoutMethod", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="BANK_ACCOUNT">Cuenta bancaria</option>
            <option value="NEQUI">Nequi</option>
            <option value="DAVIPLATA">Daviplata</option>
          </select>
        </Field>

        <Field label="Estado de validación">
          <select
            value={status}
            onChange={(e) => setValue(setForm, "storePayoutInfoStatus", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="NONE">Sin configurar</option>
            <option value="PENDING">Pendiente aprobación</option>
            <option value="APPROVED">Aprobada</option>
            <option value="REJECTED">Rechazada</option>
          </select>
        </Field>

        <Field label="Titular de la cuenta">
          <TextInput
            value={form.storePayoutAccountHolder}
            onChange={(v) => setValue(setForm, "storePayoutAccountHolder", v)}
            placeholder="Nombre de empresa o propietario"
          />
        </Field>

        <Field label="Documento / NIT titular">
          <TextInput
            value={form.storePayoutAccountDocument}
            onChange={(v) => setValue(setForm, "storePayoutAccountDocument", v)}
            placeholder="Documento o NIT"
          />
        </Field>

        <Field label="Email de facturación">
          <TextInput
            value={form.storePayoutBillingEmail}
            onChange={(v) => setValue(setForm, "storePayoutBillingEmail", v)}
            placeholder="facturacion@negocio.com"
          />
        </Field>

        <Field label="Responsabilidad tributaria">
          <TextInput
            value={form.storePayoutTaxResponsibility}
            onChange={(v) => setValue(setForm, "storePayoutTaxResponsibility", v)}
            placeholder="Ej: Régimen simple / responsable IVA"
          />
        </Field>

        {method === "BANK_ACCOUNT" ? (
          <>
            <Field label="Banco">
              <TextInput
                value={form.storePayoutBankName}
                onChange={(v) => setValue(setForm, "storePayoutBankName", v)}
                placeholder="Ej: Davivienda, Bancolombia"
              />
            </Field>

            <Field label="Tipo de cuenta">
              <select
                value={String(form.storePayoutAccountType ?? "AHORROS")}
                onChange={(e) => setValue(setForm, "storePayoutAccountType", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>
              </select>
            </Field>

            <Field label="Número de cuenta">
              <TextInput
                value={form.storePayoutAccountNumber}
                onChange={(v) => setValue(setForm, "storePayoutAccountNumber", v)}
                placeholder="Número de cuenta"
              />
            </Field>
          </>
        ) : null}

        {method === "NEQUI" ? (
          <Field label="Número Nequi">
            <TextInput
              value={form.storePayoutNequiPhone}
              onChange={(v) => setValue(setForm, "storePayoutNequiPhone", v)}
              placeholder="Celular Nequi"
            />
          </Field>
        ) : null}

        {method === "DAVIPLATA" ? (
          <Field label="Número Daviplata">
            <TextInput
              value={form.storePayoutDaviplataPhone}
              onChange={(v) => setValue(setForm, "storePayoutDaviplataPhone", v)}
              placeholder="Celular Daviplata"
            />
          </Field>
        ) : null}

        <div className="md:col-span-2">
          <Field label="Notas tributarias">
            <TextArea
              value={form.storePayoutTaxNotes}
              onChange={(v) => setValue(setForm, "storePayoutTaxNotes", v)}
              placeholder="Notas de facturación, impuestos o condiciones especiales..."
            />
          </Field>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Revisión CTCC</div>
          <div className="mt-1 text-xs text-slate-500">
            Antes de aprobar, confirma que la cuenta pertenece a la razón social o propietario registrado.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Revisado por">
              <TextInput
                value={form.storePayoutInfoReviewedBy}
                onChange={(v) => setValue(setForm, "storePayoutInfoReviewedBy", v)}
                placeholder="Nombre del asesor CTCC"
              />
            </Field>

            <Field label="Motivo rechazo">
              <TextInput
                value={form.storePayoutInfoRejectedReason}
                onChange={(v) => setValue(setForm, "storePayoutInfoRejectedReason", v)}
                placeholder="Solo si se rechaza"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Notas de revisión">
                <TextArea
                  value={form.storePayoutInfoReviewNotes}
                  onChange={(v) => setValue(setForm, "storePayoutInfoReviewNotes", v)}
                  placeholder="Notas internas de validación..."
                />
              </Field>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={approve}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Aprobar cuenta
            </button>

            <button
              type="button"
              onClick={reject}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700"
            >
              Rechazar
            </button>

            <button
              type="button"
              onClick={markPending}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Marcar pendiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
