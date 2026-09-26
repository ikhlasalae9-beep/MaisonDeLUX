'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Building2, CheckCircle2, GitCompareArrows } from 'lucide-react';
import { predictCasablanca } from '@/lib/api/client';
import type { CasablancaMetadata, CasablancaPredictPayload, PredictResponse } from '@/lib/api/types';
import type { CompletedCasablancaEstimation } from '@/components/estimation/CasablancaEstimator';
import { Button } from '@/components/common/Button';
import { CardSurface } from '@/components/city/CityFoundation';

const FACTOR_LABELS: Record<string, { fr: string; ar: string }> = {
  property_type: { fr: 'Type de bien', ar: 'نوع العقار' }, neighborhood: { fr: 'Quartier', ar: 'الحي' },
  area: { fr: 'Surface', ar: 'المساحة' }, rooms: { fr: 'Pièces', ar: 'الغرف' }, bedrooms: { fr: 'Chambres', ar: 'غرف النوم' },
  bathrooms: { fr: 'Salles de bain', ar: 'الحمامات' }, floor: { fr: 'Étage', ar: 'الطابق' },
  current_state: { fr: 'État du bien', ar: 'حالة العقار' }, age: { fr: 'Ancienneté', ar: 'عمر العقار' },
};

export function CasablancaEstimateResult({ completed, supported, locale, copy, onReset }: { completed: CompletedCasablancaEstimation; supported: CasablancaMetadata['supported']; locale: string; copy: any; onReset: () => void }) {
  const { prediction, inputFeatures, estimatedAt } = completed;
  const amount = useCountUp(prediction.estimated_price_mad);
  const money = (value: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', { maximumFractionDigits: 0 }).format(Math.round(value));
  const details = [
    [copy.cityLabel, 'Casablanca'], [copy.neighborhood, inputFeatures.neighborhood], [copy.propertyType, inputFeatures.property_type],
    [copy.area, `${inputFeatures.area} m²`], [copy.rooms, inputFeatures.rooms], [copy.bedrooms, inputFeatures.bedrooms],
    [copy.bathrooms, inputFeatures.bathrooms], [copy.floor, inputFeatures.floor],
    [copy.condition, inputFeatures.current_state || '—'], [copy.age, inputFeatures.age || '—'],
  ];

  return <div className="space-y-5">
    <CardSurface className="overflow-hidden">
      <div className="bg-[#101b2d] p-5 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-400" /><span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-white/60">{copy.passportTitle}</span></div>
        <p className="mt-5 text-sm text-white/60">{copy.resultTitle}</p>
        <p className="mt-2 break-words text-3xl font-bold tabular-nums sm:text-4xl">{money(amount)} <span className="text-base font-medium text-white/60">MAD</span></p>
        <p className="mt-4 text-xs text-white/55">{copy.modelLabel} · {prediction.model_version}</p>
      </div>
      <section className="p-5 sm:p-6" aria-labelledby="property-summary-title">
        <h2 id="property-summary-title" className="text-lg font-bold text-text-primary">{copy.propertySummary}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          {details.map(([label, value]) => <div key={String(label)}><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 break-words font-semibold text-text-primary">{value}</dd></div>)}
        </dl>
        <p className="mt-5 text-xs text-text-secondary">{copy.estimatedAt} {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(estimatedAt))}</p>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{copy.disclaimer}</p>
      </section>
    </CardSurface>

    <Explainability prediction={prediction} locale={locale} copy={copy} money={money} />
    <Comparables prediction={prediction} locale={locale} copy={copy} money={money} />
    <Simulator input={inputFeatures} supported={supported} original={prediction.estimated_price_mad} copy={copy} money={money} />
    <button type="button" onClick={onReset} className="min-h-11 text-sm font-semibold text-brand-blue">{copy.newEstimate}</button>
  </div>;
}

function Explainability({ prediction, locale, copy, money }: { prediction: PredictResponse; locale: string; copy: any; money: (value: number) => string }) {
  const factors = useMemo(() => [...(prediction.explanation?.factors || [])].sort((a, b) => Math.abs(b.contribution_mad) - Math.abs(a.contribution_mad)).slice(0, 6), [prediction]);
  const max = Math.max(...factors.map((factor) => Math.abs(factor.contribution_mad)), 1);
  return <CardSurface className="p-5 sm:p-6"><div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-brand-blue" /><h2 className="text-lg font-bold">{copy.understandTitle}</h2></div>
    <p className="mt-2 text-sm leading-6 text-text-secondary">{copy.understandIntro}</p>
    <div className="mt-5 space-y-4">{factors.map((factor) => {
      const positive = factor.contribution_mad >= 0; const label = FACTOR_LABELS[factor.key]?.[locale === 'ar' ? 'ar' : 'fr'] || factor.key;
      return <div key={factor.key}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{label}</span><span className={`flex items-center gap-1 tabular-nums ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{positive ? '+' : '−'}{money(Math.abs(factor.contribution_mad))} MAD</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.max(4, Math.abs(factor.contribution_mad) / max * 100)}%` }} /></div></div>;
    })}</div>
  </CardSurface>;
}

function Comparables({ prediction, locale, copy, money }: { prediction: PredictResponse; locale: string; copy: any; money: (value: number) => string }) {
  const comparables = prediction.comparables || [];
  return <CardSurface className="p-5 sm:p-6"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-brand-blue" /><h2 className="text-lg font-bold">{copy.comparablesTitle}</h2></div>
    <p className="mt-2 text-sm leading-6 text-text-secondary">{copy.comparablesDisclaimer}</p>
    <div className="mt-5 grid gap-3">{comparables.map((item, index) => <article key={`${item.neighborhood}-${item.area}-${item.listing_price_mad}-${index}`} className="rounded-control border border-border-medium p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.neighborhood} · {item.property_type}</p><p className="mt-1 text-xs text-text-secondary">{item.area} m² · {item.rooms} {copy.rooms.toLocaleLowerCase(locale)} · {item.bedrooms} {copy.bedrooms.toLocaleLowerCase(locale)}</p></div><p className="font-bold tabular-nums">{money(item.listing_price_mad)} MAD</p></div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-secondary">{item.same_neighborhood ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{copy.sameNeighborhood}</span> : null}<span className="rounded-full bg-slate-100 px-2.5 py-1">{copy.areaDifference}: {money(item.area_difference_m2)} m²</span></div>
    </article>)}</div>
  </CardSurface>;
}

function Simulator({ input, supported, original, copy, money }: { input: CasablancaPredictPayload; supported: CasablancaMetadata['supported']; original: number; copy: any; money: (value: number) => string }) {
  const [scenario, setScenario] = useState({ area: String(input.area), floor: String(input.floor), current_state: input.current_state || '', age: input.age || '' });
  const [simulated, setSimulated] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof typeof scenario, value: string) => setScenario((current) => ({ ...current, [key]: value }));
  async function run() {
    if (loading || Number(scenario.area) <= 0 || Number(scenario.floor) < 0) return;
    setLoading(true); setError('');
    try {
      const result = await predictCasablanca({ ...input, area: Number(scenario.area), floor: Number(scenario.floor), current_state: scenario.current_state || null, age: scenario.age || null }, { includeContext: false });
      setSimulated(result.estimated_price_mad);
    } catch (reason) { setError(reason instanceof Error ? reason.message : copy.unavailable); }
    finally { setLoading(false); }
  }
  return <CardSurface className="p-5 sm:p-6"><div className="flex items-center gap-3"><GitCompareArrows className="h-5 w-5 text-brand-blue" /><h2 className="text-lg font-bold">{copy.simulatorTitle}</h2></div><p className="mt-2 text-sm leading-6 text-text-secondary">{copy.simulatorIntro}</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><SmallInput label={copy.area} type="number" value={scenario.area} onChange={(value) => update('area', value)} /><SmallInput label={copy.floor} type="number" value={scenario.floor} onChange={(value) => update('floor', value)} /><SmallSelect label={copy.condition} value={scenario.current_state} onChange={(value) => update('current_state', value)} options={supported.current_states} /><SmallSelect label={copy.age} value={scenario.age} onChange={(value) => update('age', value)} options={supported.ages} /></div>
    {error ? <p role="alert" className="mt-4 text-sm text-status-danger">{error}</p> : null}<Button type="button" onClick={run} loading={loading} className="mt-5 w-full sm:w-auto">{loading ? copy.simulationLoading : copy.simulate}</Button>
    {simulated !== null ? <div className="mt-5 rounded-control bg-slate-50 p-4"><p className="text-sm text-text-secondary">{copy.simulationSentence}</p><dl className="mt-3 grid gap-3 sm:grid-cols-3"><Value label={copy.originalEstimate} value={`${money(original)} MAD`} /><Value label={copy.simulatedEstimate} value={`${money(simulated)} MAD`} /><Value label={copy.difference} value={`${money(Math.abs(simulated - original))} MAD`} /></dl></div> : null}
  </CardSurface>;
}

function SmallInput({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-xs font-semibold">{label}</span><input type={type} min="0" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-control border border-border-medium bg-background px-3 outline-none focus:border-brand-blue focus:shadow-focus" /></label>; }
function SmallSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label><span className="mb-2 block text-xs font-semibold">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-control border border-border-medium bg-background px-3 outline-none focus:border-brand-blue focus:shadow-focus"><option value="">—</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Value({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 font-bold tabular-nums">{value}</dd></div>; }

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    const started = performance.now(); const duration = 700;
    let frame = 0;
    const tick = (now: number) => { const progress = Math.min((now - started) / duration, 1); setValue(progress === 1 ? target : Math.round(target * (1 - Math.pow(1 - progress, 3)))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}
