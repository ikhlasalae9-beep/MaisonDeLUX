'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchCasablancaContext, fetchCasablancaMetadata, predictCasablanca } from '@/lib/api/client';
import type { CasablancaMetadata, CasablancaPredictPayload, PredictResponse } from '@/lib/api/types';
import { Button } from '@/components/common/Button';
import { CardSurface, StatePanel } from '@/components/city/CityFoundation';

const CasablancaEstimateResult = dynamic(
  () => import('@/components/estimation/CasablancaEstimateResult').then((module) => module.CasablancaEstimateResult),
  { ssr: false },
);

const initialForm = { property_type: '', neighborhood: '', area: '', rooms: '', bedrooms: '', bathrooms: '', floor: '', current_state: '', age: '' };
export type CompletedCasablancaEstimation = { prediction: PredictResponse; inputFeatures: CasablancaPredictPayload; estimatedAt: string };

export function CasablancaEstimator({ locale, copy }: { locale: string; copy: any }) {
  const [metadata, setMetadata] = useState<CasablancaMetadata | null>(null);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<CompletedCasablancaEstimation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const submittingRef = useRef(false);
  const contextKeyRef = useRef('');
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCasablancaMetadata().then((value) => { if (value.public_enabled && value.status === 'available') setMetadata(value); }).catch(() => undefined).finally(() => setMetadataLoading(false)); }, []);
  const update = (field: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const labelFor = (value: string) => locale !== 'ar' ? (value === 'appartement' ? 'Appartement' : value === 'villa' ? 'Villa' : value) : value === 'appartement' ? 'شقة' : value === 'villa' ? 'فيلا' : value;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError(''); setResult(null);
    const required = ['property_type', 'neighborhood', 'area', 'rooms', 'bedrooms', 'bathrooms', 'floor'] as const;
    if (required.some((field) => form[field] === '') || Number(form.area) <= 0 || [form.rooms, form.bedrooms, form.bathrooms].some((value) => Number(value) < 1) || Number(form.floor) < 0) { setError(copy.requiredError); return; }
    if (!metadata) { setError(copy.unavailable); return; }
    submittingRef.current = true;
    setLoading(true);
    try {
      const inputFeatures: CasablancaPredictPayload = { city: 'Casablanca', property_type: form.property_type, neighborhood: form.neighborhood, area: Number(form.area), rooms: Number(form.rooms), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), floor: Number(form.floor), current_state: form.current_state || null, age: form.age || null };
      const prediction = await predictCasablanca(inputFeatures);
      const estimatedAt = new Date().toISOString();
      contextKeyRef.current = estimatedAt;
      setResult({ prediction, inputFeatures, estimatedAt });
      setContextLoading(true);
      void fetchCasablancaContext(inputFeatures).then((context) => {
        setResult((current) => current?.estimatedAt === estimatedAt
          ? { ...current, prediction: { ...current.prediction, explanation: context.explanation, comparables: context.comparables } }
          : current);
      }).catch((contextError) => console.warn('Optional estimation context unavailable:', contextError)).finally(() => {
        if (contextKeyRef.current === estimatedAt) setContextLoading(false);
      });
      void fetch('/api/analytics/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_key: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
          city: inputFeatures.city, model_version: prediction.model_version || metadata.model_version,
          input_features: inputFeatures, estimated_price_mad: prediction.estimated_price_mad }),
      }).then((response) => response.json()).then((analytics) => {
        if (!analytics.stored) console.warn('Analytics persistence unavailable');
      }).catch((loggingError) => console.warn('Analytics persistence unavailable:', loggingError));
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : copy.unavailable); }
    finally { submittingRef.current = false; setLoading(false); }
  }

  useEffect(() => {
    if (!result || !resultRef.current || !window.matchMedia('(max-width: 1023px)').matches) return;
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [result]);

  if (metadataLoading) return <StatePanel title={copy.metadataLoading} busy />;
  if (!metadata) return <StatePanel title={copy.unavailable} description={copy.disclaimer} />;

  const fields = [
    { key: 'area', label: copy.area, min: 1, step: '0.1' }, { key: 'rooms', label: copy.rooms, min: 1, step: '1' },
    { key: 'bedrooms', label: copy.bedrooms, min: 1, step: '1' }, { key: 'bathrooms', label: copy.bathrooms, min: 1, step: '1' },
    { key: 'floor', label: copy.floor, min: 0, step: '1' },
  ] as const;

  return <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.45fr_.85fr] lg:items-start">
    <CardSurface className="p-4 min-[360px]:p-5 sm:p-8"><form onSubmit={submit} noValidate><fieldset disabled={loading} className="disabled:opacity-70">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <SelectField label={copy.propertyType} value={form.property_type} onChange={(value) => update('property_type', value)} options={metadata.supported.property_types} placeholder={copy.select} labelFor={labelFor} />
        <SelectField label={copy.neighborhood} value={form.neighborhood} onChange={(value) => update('neighborhood', value)} options={metadata.supported.neighborhoods} placeholder={copy.select} />
        {fields.map((field) => <label key={field.key}><span className="mb-2 block text-sm font-semibold">{field.label}</span><input type="number" inputMode={field.step === '1' ? 'numeric' : 'decimal'} min={field.min} step={field.step} value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} className="h-12 w-full rounded-control border border-border-medium bg-background px-4 text-base outline-none focus:border-brand-blue focus:shadow-focus" required /></label>)}
        <SelectField label={`${copy.condition} (${copy.optional})`} value={form.current_state} onChange={(value) => update('current_state', value)} options={metadata.supported.current_states} placeholder={copy.select} />
        <SelectField label={`${copy.age} (${copy.optional})`} value={form.age} onChange={(value) => update('age', value)} options={metadata.supported.ages} placeholder={copy.select} />
      </div>
      {error ? <div role="alert" className="mt-5 flex items-start gap-2 rounded-control border border-status-danger/25 bg-status-danger/10 p-4 text-sm text-status-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      <Button type="submit" size="lg" loading={loading} className="mt-6 min-h-12 w-full sm:w-auto">{loading ? copy.loading : copy.submit}</Button>
    </fieldset></form></CardSurface>
    <div ref={resultRef} className="scroll-mt-24">{loading ? <ResultSkeleton copy={copy} /> : result ? <CasablancaEstimateResult completed={result} supported={metadata.supported} contextLoading={contextLoading} locale={locale} copy={copy} onReset={() => { contextKeyRef.current = ''; setResult(null); setContextLoading(false); }} /> : <StatePanel title={copy.resultTitle} description={copy.disclaimer} />}</div>
  </div>;
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
