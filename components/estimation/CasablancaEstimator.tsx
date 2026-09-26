'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { EstimationError, fetchCasablancaContext, predictCasablanca } from '@/lib/api/client';
import { PassportAccountCTA } from '@/components/auth/PassportAccountCTA';
import type { CasablancaMetadata, CasablancaPredictPayload, PredictResponse } from '@/lib/api/types';
import { Button } from '@/components/common/Button';
import { CardSurface, StatePanel } from '@/components/city/CityFoundation';

const CasablancaEstimateResult = dynamic(
  () => import('@/components/estimation/CasablancaEstimateResult').then((module) => module.CasablancaEstimateResult),
  { ssr: false },
);

const initialForm = { property_type: '', neighborhood: '', area: '', rooms: '', bedrooms: '', bathrooms: '', floor: '', current_state: '', age: '' };
export type CompletedCasablancaEstimation = { prediction: PredictResponse; inputFeatures: CasablancaPredictPayload; estimatedAt: string };

function scrollBelowNavbar(target: HTMLElement | null) {
  if (!target) return;
  const navbar = document.querySelector<HTMLElement>('[data-site-navbar]');
  const offset = (navbar?.getBoundingClientRect().height || 0) + 16;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function CasablancaEstimator({ locale, copy, metadata }: { locale: string; copy: any; metadata: CasablancaMetadata }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<CompletedCasablancaEstimation | null>(null);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const submittingRef = useRef(false);
  const pendingRequestRef = useRef<{input:string;id:string}|null>(null);
  const contextKeyRef = useRef('');
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), property = params.get('property'), estimation = params.get('estimation');
    const url = property && /^[0-9a-f-]{36}$/i.test(property) ? `/api/account/properties/${property}` : estimation && /^[1-9][0-9]{0,17}$/.test(estimation) ? `/api/account/estimations/${estimation}` : null;
    if (!url) return;
    let active = true;
    void fetch(url, { cache: 'no-store' }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => {
      if (active) setForm(Object.fromEntries(Object.keys(initialForm).map(key => [key, String(data.input_features[key] ?? '')])) as typeof initialForm);
    }).catch(() => { if (active) setError(locale === 'ar' ? 'تعذر تحميل العقار المحفوظ.' : 'Chargement du bien enregistré indisponible.'); });
    return () => { active = false; };
  }, [locale]);

  const update = (field: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const labelFor = (value: string) => locale !== 'ar' ? (value === 'appartement' ? 'Appartement' : value === 'villa' ? 'Villa' : value) : value === 'appartement' ? 'شقة' : value === 'villa' ? 'فيلا' : value;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError('');
    const required = ['property_type', 'neighborhood', 'area', 'rooms', 'bedrooms', 'bathrooms', 'floor'] as const;
    if (required.some((field) => form[field] === '') || Number(form.area) <= 0 || [form.rooms, form.bedrooms, form.bathrooms].some((value) => Number(value) < 1) || Number(form.floor) < 0) { setError(copy.requiredError); return; }
    submittingRef.current = true;
    setLoading(true);
    try {
      const inputFeatures: CasablancaPredictPayload = { city: 'Casablanca', property_type: form.property_type, neighborhood: form.neighborhood, area: Number(form.area), rooms: Number(form.rooms), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), floor: Number(form.floor), current_state: form.current_state || null, age: form.age || null };
      const serialized=JSON.stringify(inputFeatures);
      if(pendingRequestRef.current?.input!==serialized)pendingRequestRef.current={input:serialized,id:crypto.randomUUID()};
      const prediction = await predictCasablanca(inputFeatures, { locale, requestId: pendingRequestRef.current.id });
      pendingRequestRef.current=null;
      const estimatedAt = new Date().toISOString();
      contextKeyRef.current = estimatedAt;
      setResult({ prediction, inputFeatures, estimatedAt });
      setEditing(false);
      setContextLoading(true);
      void fetchCasablancaContext(inputFeatures, prediction.estimation_event_id).then((context) => {
        setResult((current) => current?.estimatedAt === estimatedAt
          ? { ...current, prediction: { ...current.prediction, explanation: context.explanation, comparables: context.comparables, market_context: context.market_context } }
          : current);
      }).catch((contextError) => console.warn('Optional estimation context unavailable:', contextError)).finally(() => {
        if (contextKeyRef.current === estimatedAt) setContextLoading(false);
      });
    }
    catch (reason) { if (reason instanceof EstimationError && reason.code === 'GUEST_TRIAL_CONSUMED') setAuthRequired(true); else setError(reason instanceof Error ? reason.message : copy.unavailable); }
    finally { submittingRef.current = false; setLoading(false); }
  }

  const resultTimestamp = result?.estimatedAt;
  useEffect(() => {
    if (!resultTimestamp || !resultRef.current || editing) return;
    requestAnimationFrame(() => scrollBelowNavbar(resultRef.current));
  }, [resultTimestamp, editing]);

  const fields = [
    { key: 'area', label: copy.area, min: 1, step: '0.1' }, { key: 'rooms', label: copy.rooms, min: 1, step: '1' },
    { key: 'bedrooms', label: copy.bedrooms, min: 1, step: '1' }, { key: 'bathrooms', label: copy.bathrooms, min: 1, step: '1' },
    { key: 'floor', label: copy.floor, min: 0, step: '1' },
  ] as const;

  const formCard = authRequired ? <PassportAccountCTA locale={locale} gated /> : <EstimatorForm form={form} fields={fields} metadata={metadata} copy={copy} loading={loading} error={error} labelFor={labelFor} update={update} submit={submit} />;
  const edit = () => { setEditing(true); requestAnimationFrame(() => scrollBelowNavbar(formRef.current)); };

  if (result) return <div className="space-y-5 sm:space-y-6">
    <div ref={formRef} className="scroll-target-offset">{editing ? formCard : <CardSurface className="hidden items-center justify-between gap-4 p-4 lg:flex"><div><p className="text-sm font-bold">{result.inputFeatures.neighborhood} · {labelFor(result.inputFeatures.property_type)}</p><p className="mt-1 text-xs text-text-secondary">{result.inputFeatures.area} m² · {result.inputFeatures.rooms} {copy.rooms.toLocaleLowerCase(locale)}</p></div><button type="button" onClick={edit} className="min-h-11 rounded-control border border-border-medium px-4 text-sm font-semibold text-brand-blue transition hover:border-brand-blue">← {copy.newEstimate}</button></CardSurface>}</div>
    <div ref={resultRef} className="scroll-target-offset"><CasablancaEstimateResult completed={result} supported={metadata.supported} contextLoading={contextLoading} locale={locale} copy={copy} onEdit={edit} /></div>
  </div>;

  return <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.45fr_.85fr] lg:items-start"><div ref={formRef} className="scroll-target-offset">{formCard}</div><div ref={resultRef} className="scroll-target-offset">{loading ? <ResultSkeleton copy={copy} /> : <StatePanel title={copy.resultTitle} description={copy.disclaimer} />}</div></div>;
}

function EstimatorForm({ form, fields, metadata, copy, loading, error, labelFor, update, submit }: { form: typeof initialForm; fields: ReadonlyArray<{ key: keyof typeof initialForm; label: string; min: number; step: string }>; metadata: CasablancaMetadata; copy: any; loading: boolean; error: string; labelFor: (value: string) => string; update: (field: keyof typeof initialForm, value: string) => void; submit: (event: FormEvent) => void }) {
  return <CardSurface className="p-4 min-[360px]:p-5 sm:p-8"><form onSubmit={submit} noValidate><fieldset disabled={loading} className="disabled:opacity-70"><div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
    <SelectField label={copy.propertyType} value={form.property_type} onChange={(value) => update('property_type', value)} options={metadata.supported.property_types} placeholder={copy.select} labelFor={labelFor} />
    <SelectField label={copy.neighborhood} value={form.neighborhood} onChange={(value) => update('neighborhood', value)} options={metadata.supported.neighborhoods} placeholder={copy.select} />
    {fields.map((field) => <label key={field.key}><span className="mb-2 block text-sm font-semibold">{field.label}</span><input type="number" inputMode={field.step === '1' ? 'numeric' : 'decimal'} min={field.min} step={field.step} value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} className="h-12 w-full rounded-control border border-border-medium bg-background px-4 text-base outline-none focus:border-brand-blue focus:shadow-focus" required /></label>)}
    <SelectField label={`${copy.condition} (${copy.optional})`} value={form.current_state} onChange={(value) => update('current_state', value)} options={metadata.supported.current_states} placeholder={copy.select} />
    <SelectField label={`${copy.age} (${copy.optional})`} value={form.age} onChange={(value) => update('age', value)} options={metadata.supported.ages} placeholder={copy.select} />
  </div>{error ? <div role="alert" className="mt-5 flex items-start gap-2 rounded-control border border-status-danger/25 bg-status-danger/10 p-4 text-sm text-status-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}<Button type="submit" size="lg" loading={loading} className="mt-6 min-h-12 w-full sm:w-auto">{loading ? copy.loading : copy.submit}</Button></fieldset></form></CardSurface>;
}

function ResultSkeleton({ copy }: { copy: any }) {
  return <CardSurface className="overflow-hidden" aria-live="polite" aria-busy="true">
    <div className="bg-[#101b2d] p-5 text-white sm:p-7"><p className="text-sm text-white/70">{copy.processing}</p><div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-white/15" /><div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-white/10" /></div>
    <div className="space-y-4 p-5 sm:p-6"><div className="h-4 w-full animate-pulse rounded bg-slate-200" /><div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" /><div className="h-20 w-full animate-pulse rounded-control bg-slate-100" /></div>
  </CardSurface>;
}

function SelectField({ label, value, onChange, options, placeholder, labelFor = (item: string) => item }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string; labelFor?: (value: string) => string }) {
  return <label><span className="mb-2 block text-sm font-semibold">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full min-w-0 rounded-control border border-border-medium bg-background px-3 text-base outline-none focus:border-brand-blue focus:shadow-focus sm:px-4"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{labelFor(option)}</option>)}</select></label>;
}
