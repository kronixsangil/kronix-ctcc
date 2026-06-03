// app/(cc)/stores/components/store-details/StoreOnboardingTab.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
import { AdminCityItem } from "../../lib/storesApi";

type Props = {
  mode: "create" | "edit";
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  cities: AdminCityItem[];
  citiesLoading: boolean;
};

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 disabled:bg-slate-50"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="md:col-span-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <textarea
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400"
      />
    </div>
  );
}

function Section({
  title,
  helper,
  children,
}: {
  title: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{helper}</div>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: any;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}

function toBoolString(value: any) {
  return String(Boolean(value));
}

export default function StoreOnboardingTab({
  mode,
  form,
  setForm,
  cities,
  citiesLoading,
}: Props) {
  return (
    <div className="space-y-4">
      <Section
        title="Información comercial"
        helper="Datos base de afiliación del establecimiento aliado."
      >
        <div>
          <label className="text-xs font-medium text-slate-600">Ciudad</label>
          <select
            value={String(form?.citySlug ?? "")}
            onChange={(e) => setForm((s: any) => ({ ...s, citySlug: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={citiesLoading}
          >
            <option value="">Selecciona una ciudad</option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.department}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Código tienda"
          value={form?.storeCode}
          disabled={mode === "edit"}
          onChange={(value) => setForm((s: any) => ({ ...s, storeCode: value }))}
        />

        <Field
          label="Nombre comercial"
          value={form?.name}
          onChange={(value) => setForm((s: any) => ({ ...s, name: value }))}
        />

        <Field
          label="Categoría"
          value={form?.category}
          onChange={(value) => setForm((s: any) => ({ ...s, category: value }))}
        />

        <Field
          label="Tipo de establecimiento"
          value={form?.storeType}
          onChange={(value) => setForm((s: any) => ({ ...s, storeType: value }))}
          placeholder="Ej: Restaurante, farmacia, boutique, supermercado"
        />

        <TextAreaField
          label="Descripción pública"
          value={form?.description}
          onChange={(value) => setForm((s: any) => ({ ...s, description: value }))}
          placeholder="Ej: Boutique de ropa, accesorios y moda femenina..."
        />
      </Section>

      <Section
        title="Información legal, propietario y contacto"
        helper="Datos revisados por KroniX durante la afiliación presencial."
      >
        <Field
          label="Razón social"
          value={form?.legalName}
          onChange={(value) => setForm((s: any) => ({ ...s, legalName: value }))}
        />

        <Field
          label="NIT / identificación negocio"
          value={form?.nit}
          onChange={(value) => setForm((s: any) => ({ ...s, nit: value }))}
        />

        <Field
          label="Nombre propietario / representante"
          value={form?.ownerName}
          onChange={(value) => setForm((s: any) => ({ ...s, ownerName: value }))}
        />

        <Field
          label="Documento propietario"
          value={form?.ownerDocument}
          onChange={(value) => setForm((s: any) => ({ ...s, ownerDocument: value }))}
        />

        <Field
          label="Email propietario"
          value={form?.ownerEmail}
          type="email"
          onChange={(value) => setForm((s: any) => ({ ...s, ownerEmail: value }))}
        />

        <Field
          label="Teléfono propietario"
          value={form?.ownerPhone}
          onChange={(value) => setForm((s: any) => ({ ...s, ownerPhone: value }))}
        />

        <Field
          label="Email comercial"
          value={form?.businessEmail}
          type="email"
          onChange={(value) => setForm((s: any) => ({ ...s, businessEmail: value }))}
        />

        <Field
          label="Celular principal"
          value={form?.cel1}
          onChange={(value) => setForm((s: any) => ({ ...s, cel1: value }))}
        />

        <Field
          label="Celular secundario"
          value={form?.cel2}
          onChange={(value) => setForm((s: any) => ({ ...s, cel2: value }))}
        />
      </Section>

      <Section
        title="Dirección y geopuntos KroniX"
        helper="Estos puntos los define KroniX en visita al establecimiento, no la tienda desde la Store App."
      >
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Dirección</label>
          <input
            value={form?.address ?? ""}
            onChange={(e) => setForm((s: any) => ({ ...s, address: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <TextAreaField
          label="Referencia de dirección"
          value={form?.addressReference}
          onChange={(value) => setForm((s: any) => ({ ...s, addressReference: value }))}
          placeholder="Ej: Local frente al parque, entrada por la carrera..."
        />

        <Field
          label="Latitud comercio"
          value={String(form?.lat ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, lat: value }))}
        />

        <Field
          label="Longitud comercio"
          value={String(form?.lng ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, lng: value }))}
        />

        <Field
          label="Latitud entrada principal"
          value={String(form?.mainEntranceLat ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, mainEntranceLat: value }))}
        />

        <Field
          label="Longitud entrada principal"
          value={String(form?.mainEntranceLng ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, mainEntranceLng: value }))}
        />

        <Field
          label="Latitud pickup drivers"
          value={String(form?.pickupLat ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, pickupLat: value }))}
        />

        <Field
          label="Longitud pickup drivers"
          value={String(form?.pickupLng ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, pickupLng: value }))}
        />
      </Section>

      <Section
        title="Visita, documentación y validación KroniX"
        helper="Control interno para afiliación presencial, revisión de documentos y aprobación."
      >
        <SelectField
          label="Estado de afiliación"
          value={form?.affiliateStatus ?? "PENDING_VISIT"}
          onChange={(value) => setForm((s: any) => ({ ...s, affiliateStatus: value }))}
        >
          <option value="PENDING_VISIT">Pendiente visita</option>
          <option value="VISITED">Visitado</option>
          <option value="DOCUMENTS_PENDING">Documentos pendientes</option>
          <option value="UNDER_REVIEW">En revisión</option>
          <option value="APPROVED">Aprobado</option>
          <option value="REJECTED">Rechazado</option>
        </SelectField>

        <Field
          label="Fecha de visita"
          type="date"
          value={form?.visitedAt}
          onChange={(value) => setForm((s: any) => ({ ...s, visitedAt: value }))}
        />

        <Field
          label="Visitado por"
          value={form?.visitedBy}
          onChange={(value) => setForm((s: any) => ({ ...s, visitedBy: value }))}
          placeholder="Ej: Blass / asesor KroniX"
        />

        <Field
          label="Aprobado por"
          value={form?.approvedBy}
          onChange={(value) => setForm((s: any) => ({ ...s, approvedBy: value }))}
        />

        <Field
          label="Fecha aprobación"
          type="date"
          value={form?.approvedAt}
          onChange={(value) => setForm((s: any) => ({ ...s, approvedAt: value }))}
        />

        <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-2">
          <CheckboxField
            label="Documentos físicos recibidos"
            checked={Boolean(form?.physicalDocumentsReceived)}
            onChange={(value) =>
              setForm((s: any) => ({ ...s, physicalDocumentsReceived: value }))
            }
          />

          <CheckboxField
            label="Documentos revisados"
            checked={Boolean(form?.documentsReviewed)}
            onChange={(value) => setForm((s: any) => ({ ...s, documentsReviewed: value }))}
          />

          <CheckboxField
            label="Documentos aprobados"
            checked={Boolean(form?.documentsApproved)}
            onChange={(value) => setForm((s: any) => ({ ...s, documentsApproved: value }))}
          />

          <CheckboxField
            label="Contrato / acuerdo firmado"
            checked={Boolean(form?.contractSigned)}
            onChange={(value) => setForm((s: any) => ({ ...s, contractSigned: value }))}
          />
        </div>

        <TextAreaField
          label="Observaciones de aprobación"
          value={form?.approvalNotes}
          onChange={(value) => setForm((s: any) => ({ ...s, approvalNotes: value }))}
          placeholder="Notas de aprobación, condiciones comerciales o validaciones finales..."
        />

        <TextAreaField
          label="Motivo de rechazo"
          value={form?.rejectedReason}
          onChange={(value) => setForm((s: any) => ({ ...s, rejectedReason: value }))}
          placeholder="Solo diligenciar si la afiliación fue rechazada..."
        />
      </Section>

      <Section
        title="Horarios, ETA y operación base"
        helper="Información operativa inicial visible para KroniX y para la experiencia Buyer."
      >
        <Field
          label="Horario apertura"
          value={form?.hrOp}
          onChange={(value) => setForm((s: any) => ({ ...s, hrOp: value }))}
          placeholder="Ej: 08:00 AM"
        />

        <Field
          label="Horario cierre"
          value={form?.hrCl}
          onChange={(value) => setForm((s: any) => ({ ...s, hrCl: value }))}
          placeholder="Ej: 09:00 PM"
        />

        <Field
          label="ETA min"
          value={String(form?.etaMin ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, etaMin: value }))}
        />

        <Field
          label="ETA max"
          value={String(form?.etaMax ?? "")}
          onChange={(value) => setForm((s: any) => ({ ...s, etaMax: value }))}
        />
      </Section>

      <Section
        title="Branding básico"
        helper="Identidad visual del comercio en Buyer App y Store App."
      >
        <Field
          label="Logo / imagen principal"
          value={form?.image}
          onChange={(value) => setForm((s: any) => ({ ...s, image: value }))}
        />

        <Field
          label="Portada"
          value={form?.coverImage}
          onChange={(value) => setForm((s: any) => ({ ...s, coverImage: value }))}
        />

        <Field
          label="Imagen 2"
          value={form?.image2}
          onChange={(value) => setForm((s: any) => ({ ...s, image2: value }))}
        />

        <Field
          label="Imagen 3"
          value={form?.image3}
          onChange={(value) => setForm((s: any) => ({ ...s, image3: value }))}
        />

        <Field
          label="Imagen 4"
          value={form?.image4}
          onChange={(value) => setForm((s: any) => ({ ...s, image4: value }))}
        />

        <Field
          label="Color primario"
          value={form?.primaryColor}
          onChange={(value) => setForm((s: any) => ({ ...s, primaryColor: value }))}
          placeholder="#111827"
        />

        <Field
          label="Color secundario"
          value={form?.secondaryColor}
          onChange={(value) => setForm((s: any) => ({ ...s, secondaryColor: value }))}
          placeholder="#f97316"
        />
      </Section>

      <Section
        title="Estado de onboarding"
        helper="Control interno de KroniX para saber si el comercio está listo para operar."
      >
        <Field
          label="Paso actual"
          value={String(form?.onboardingStep ?? 1)}
          onChange={(value) => setForm((s: any) => ({ ...s, onboardingStep: value }))}
        />

        <div>
          <label className="text-xs font-medium text-slate-600">Onboarding completado</label>
          <select
            value={toBoolString(form?.onboardingCompleted)}
            onChange={(e) =>
              setForm((s: any) => ({
                ...s,
                onboardingCompleted: e.target.value === "true",
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <TextAreaField
          label="Observaciones internas de onboarding"
          value={form?.onboardingNotes}
          onChange={(value) => setForm((s: any) => ({ ...s, onboardingNotes: value }))}
          placeholder="Notas internas del proceso de afiliación..."
        />

        <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          <b>Nota operativa:</b> la revisión documental física, visita comercial, entrada principal,
          punto pickup drivers y validación final se gestionan desde CTCC por el equipo KroniX.
        </div>
      </Section>
    </div>
  );
}
