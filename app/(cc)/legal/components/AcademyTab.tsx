"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
type Option = { id: string; label: string };
type Question = { id: string; question: string; options: Option[]; correctOptionId: string };
type Module = { trainingType: string; version: string; title: string; subtitle: string; videoTitle: string; videoUrl: string; durationMinutes: number; checklist: string[]; quiz: Question[]; passingScore: number; isActive: boolean };
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{title}{children}</label>;
}
export default function AcademyTab() {
  const [modules, setModules] = useState<Module[]>([]), [draft, setDraft] = useState<Module | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);
  async function load() {
    setBusy(true); setError("");
    try { const data = await apiFetch<{ modules: Module[] }>("/legal/admin/academy"); setModules(data.modules); setDraft(data.modules[0] || null); setDirty(false); }
    catch (e: any) { setError(e.message || "No se pudo cargar la Academia."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  const patch = (value: Partial<Module>) => { setDraft(old => old ? { ...old, ...value } : old); setDirty(true); setSuccess(""); };
  function question(index: number, value: Partial<Question>) {
    if (!draft) return; patch({ quiz: draft.quiz.map((q, i) => i === index ? { ...q, ...value } : q) });
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const data = await apiFetch<{ ok: boolean; module: Module }>("/legal/admin/academy", { method: "POST", body: JSON.stringify({ ...draft, checklist: draft.checklist.map(x => x.trim()).filter(Boolean), expectedVersion: draft.version }) });
      setModules(old => old.map(m => m.trainingType === data.module.trainingType ? data.module : m));
      setDraft(data.module); setDirty(false); setSuccess("Módulo guardado. Los trabajadores recibirán la nueva versión al actualizar Academia.");
    } catch (e: any) { setError(e.message || "No se pudo guardar el módulo."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Academia KroniX Pro</h2>
      <p className="mt-1 text-sm text-slate-600">Videos y evaluaciones para todas las ciudades. La edición requiere un administrador global.</p></div>
      <button disabled={busy} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50" onClick={() => { if (!dirty || window.confirm("¿Descartar los cambios sin guardar?")) void load(); }}>Actualizar</button></div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</div>}
    {success && <div role="status" className="rounded-xl bg-green-50 p-3 text-green-800">{success}</div>}
    {!draft ? <p>{busy ? "Cargando módulos…" : "No hay módulos disponibles."}</p> : <>
      <div className="flex flex-wrap gap-2">{modules.map(m => <button disabled={busy} key={m.trainingType} onClick={() => {
        if (m.trainingType === draft.trainingType) return;
        if (dirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
        setDraft(structuredClone(m)); setDirty(false); setError(""); setSuccess("");
      }} className={`rounded-xl border px-4 py-2 text-sm ${draft.trainingType === m.trainingType ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700"}`}>{m.title}</button>)}</div>
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <div className="grid gap-4 md:grid-cols-2">
          <Field title="Título del módulo"><input className={input} value={draft.title} maxLength={150} onChange={e => patch({ title: e.target.value })} /></Field>
          <Field title="Título del video"><input className={input} value={draft.videoTitle} maxLength={150} onChange={e => patch({ videoTitle: e.target.value })} /></Field>
          <Field title="Ruta HTTPS del video"><input className={input} type="url" placeholder="https://…" value={draft.videoUrl} onChange={e => patch({ videoUrl: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field title="Duración (min)"><input type="number" min={1} max={180} className={input} value={draft.durationMinutes} onChange={e => patch({ durationMinutes: Number(e.target.value) })} /></Field>
          <Field title="Puntaje para aprobar (%)"><input type="number" min={1} max={100} className={input} value={draft.passingScore} onChange={e => patch({ passingScore: Number(e.target.value) })} /></Field></div>
        </div>
        <Field title="Descripción"><textarea className={input} rows={2} value={draft.subtitle} onChange={e => patch({ subtitle: e.target.value })} /></Field>
        <Field title="Verificaciones previas (una por línea)"><textarea className={input} rows={3} value={draft.checklist.join("\n")} onChange={e => patch({ checklist: e.target.value.split("\n") })} /></Field>
        <div><h3 className="font-bold text-slate-900">Evaluación: tres preguntas</h3><p className="text-sm text-slate-500">Escribe las opciones y marca una respuesta correcta por pregunta.</p></div>
        {draft.quiz.map((q, i) => <div key={q.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Field title={`Pregunta ${i + 1}`}><input className={input} value={q.question} maxLength={500} onChange={e => question(i, { question: e.target.value })} /></Field>
          {q.options.map((o, j) => <div key={o.id} className="flex items-center gap-3"><input type="radio" name={`correct-${q.id}`} aria-label={`Opción ${j + 1} correcta para pregunta ${i + 1}`} checked={q.correctOptionId === o.id} onChange={() => question(i, { correctOptionId: o.id })} />
            <input aria-label={`Opción ${j + 1} de pregunta ${i + 1}`} className={input} value={o.label} maxLength={400} onChange={e => question(i, { options: q.options.map((x, k) => k === j ? { ...x, label: e.target.value } : x) })} /></div>)}
        </div>)}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isActive} onChange={e => patch({ isActive: e.target.checked })} />Publicar módulo en Academia</label>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm text-slate-500">Al cambiar el contenido se genera una versión nueva. Los intentos anteriores se conservan y corresponden a su versión.</p>
          <button disabled={busy || !dirty} onClick={() => void save()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-40">{busy ? "Guardando…" : "Guardar módulo y evaluación"}</button></div>
      </fieldset>
    </>}
  </section>;
}
