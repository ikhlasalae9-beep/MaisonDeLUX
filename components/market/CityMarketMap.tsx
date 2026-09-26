'use client';

import { useEffect, useMemo, useState } from 'react';
import { boundaryName, projectMarketBoundaries, selectMarketBoundaries } from '@/lib/analytics/market-geometry';
import { arrondissementColor } from '@/lib/analytics/arrondissement-market';
import type { BoundaryFeature, CityMapSummary } from '@/lib/analytics/market-map';
import { formatArea, formatCurrency, formatInteger, formatPricePerSquareMeter } from '@/lib/utils';
import { CardSurface, PageContainer, Section } from '@/components/city/CityFoundation';

export function CityMarketMap({ summary, locale }: { summary: CityMapSummary; locale: string }) {
  const ar = locale === 'ar';
  const [boundaries, setBoundaries] = useState<BoundaryFeature[]>([]);
  const [selected, setSelected] = useState('');
  const [hovered, setHovered] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(summary.geoJsonSource, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Geometry unavailable'); return response.json(); })
      .then(source => setBoundaries(selectMarketBoundaries(source.features, summary.boundaryLevel)))
      .catch(reason => { if (reason.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [summary.geoJsonSource, summary.boundaryLevel]);
  const outlines = useMemo(() => projectMarketBoundaries(boundaries), [boundaries]);
  const byId = new Map(summary.arrondissements.map(item => [item.boundaryId, item]));
  const activeId = hovered || selected || summary.arrondissements.find(item => item.eligible)?.boundaryId;
  const chosen = boundaries.find(feature => feature.id === activeId);
  const stats = activeId ? byId.get(activeId) : undefined;
  const covered = summary.arrondissements.filter(item => item.eligible).length;
  const name = (feature: BoundaryFeature) => boundaryName(feature, locale);
  const description = (feature: BoundaryFeature) => {
    const item = byId.get(feature.id);
    return `${name(feature)} — ${item?.eligible ? `${formatPricePerSquareMeter(item.medianPricePerM2!, locale)} · ${formatInteger(item.listingCount, locale)} ${ar ? 'إعلان' : 'annonces'}` : ar ? 'تغطية محدودة' : 'Couverture limitée'}`;
  };
  return <Section className="pt-0"><PageContainer><CardSurface className="overflow-hidden">
    <div className="border-b border-border-subtle p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">{ar ? 'أسعار معروضة · حسب المقاطعة' : 'Prix affichés · Par arrondissement'}</p>
      <h2 className="mt-2 text-2xl font-bold">{ar ? 'خريطة أسعار العقارات في الدار البيضاء' : 'Carte des prix immobiliers à Casablanca'}</h2>
      <p className="mt-2 text-sm text-text-secondary">{ar ? 'اكتشف فروق الأسعار المعروضة للمتر المربع بين المناطق التي تغطيها بياناتنا.' : 'Visualisez les écarts de prix affichés au m² entre les zones couvertes par nos données.'}</p>
    </div>
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-w-0 rounded-card border border-border-medium bg-surface-subtle p-3 sm:p-5">
        {outlines.length ? <svg viewBox="0 0 800 600" className="block w-full" role="group" aria-label={ar ? 'خريطة أسعار العقارات حسب المقاطعة' : 'Carte des prix par arrondissement'}>
          <title>{ar ? 'الأسعار المعروضة الوسيطة للمتر المربع' : 'Prix affichés médians au m²'}</title>
          {outlines.map(({ feature, path }) => <path key={feature.id} data-arrondissement={feature.id} d={path} fillRule="evenodd"
            fill={arrondissementColor(byId.get(feature.id), summary.bins)} fillOpacity={byId.get(feature.id)?.eligible ? 1 : 0.18} stroke={activeId === feature.id ? '#f59e0b' : '#64748b'} strokeWidth={activeId === feature.id ? 3 : 1.2} vectorEffect="non-scaling-stroke"
            role="button" tabIndex={0} aria-pressed={selected === feature.id} aria-label={description(feature)}
            onMouseEnter={() => setHovered(feature.id)} onMouseLeave={() => setHovered('')}
            onFocus={() => setHovered(feature.id)} onBlur={() => setHovered('')}
            onClick={() => setSelected(feature.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(feature.id); } }}
            className="cursor-pointer hover:opacity-90 focus:outline-none">
            <title>{description(feature)}</title>
          </path>)}
        </svg> : <p role="status" className="flex min-h-64 items-center justify-center text-sm text-text-secondary">{error ? (ar ? 'تعذر تحميل الخريطة.' : 'Chargement de la carte indisponible.') : (ar ? 'جارٍ تحميل الخريطة…' : 'Chargement de la carte…')}</p>}
      </div>
      <div className="min-w-0">
        <div aria-live="polite" className="rounded-card border border-border-medium bg-surface-subtle p-5">
          <h3 className="font-bold">{chosen ? name(chosen) : ar ? 'استكشف المقاطعات' : 'Explorez les arrondissements'}</h3>
          {stats?.eligible ? <>
            <p className="mt-4 text-2xl font-bold text-brand-blue">{formatPricePerSquareMeter(stats.medianPricePerM2!, locale)}</p>
            <p className="mt-1 text-xs text-text-muted">{ar ? 'السعر المعروض الوسيط للمتر المربع' : 'Prix affiché médian au m²'}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-text-muted">{ar ? 'الإعلانات' : 'Annonces'}</dt><dd className="mt-1 font-semibold">{formatInteger(stats.listingCount, locale)}</dd></div>
              <div><dt className="text-xs text-text-muted">{ar ? 'السعر المعروض الوسيط' : 'Prix affiché médian'}</dt><dd className="mt-1 font-semibold">{formatCurrency(stats.medianListingPriceMad!, locale)}</dd></div>
              <div><dt className="text-xs text-text-muted">{ar ? 'المساحة الوسيطة' : 'Surface médiane'}</dt><dd className="mt-1 font-semibold">{formatArea(stats.medianArea!, locale)}</dd></div>
              <div><dt className="text-xs text-text-muted">{ar ? 'الأحياء المغطاة' : 'Quartiers couverts'}</dt><dd className="mt-1 font-semibold">{stats.neighborhoods.length}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-text-secondary">{stats.neighborhoods.join(' · ')}</p>
          </> : <p className="mt-3 text-sm text-text-secondary">{ar ? 'تغطية محدودة' : 'Couverture limitée'}{stats?.listingCount ? ` · ${formatInteger(stats.listingCount, locale)} ${ar ? 'إعلان' : 'annonces'}` : ''}</p>}
        </div>
        <p className="mt-5 text-xs text-text-muted">{ar ? 'مرّر المؤشر أو اختر مقاطعة لعرض تفاصيلها.' : 'Survolez ou sélectionnez une zone pour explorer ses prix.'}</p>
        <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto p-1">{boundaries.map(feature => <button type="button" key={feature.id} aria-pressed={selected === feature.id} onClick={() => { setHovered(''); setSelected(feature.id); }} className={`flex min-h-11 items-center justify-between gap-3 rounded-control border px-3 py-2 text-start text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue ${activeId === feature.id ? 'border-brand-blue font-bold' : 'border-border-medium'}`}>
          <span>{name(feature)}</span><span className="h-3 w-3 shrink-0 rounded" style={{ background: arrondissementColor(byId.get(feature.id), summary.bins) }} />
        </button>)}</div>
      </div>
    </div>
    <div className="border-t border-border-subtle p-5 sm:p-7">
      <p className="text-xs font-bold">{ar ? 'السعر المعروض الوسيط · درهم/م²' : 'Prix affiché médian · MAD/m²'}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-xs">{summary.bins.map(bin => <span key={bin.max} className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded" style={{ background: bin.color }} />{bin.min === bin.max ? formatInteger(bin.min, locale) : `${formatInteger(bin.min, locale)}–${formatInteger(bin.max, locale)}`}</span>)}<span className="inline-flex items-center gap-2 text-text-muted"><span className="h-3 w-5 rounded border border-slate-400 bg-slate-200" />{ar ? 'تغطية محدودة' : 'Couverture limitée'}</span></div>
      <p className="mt-4 text-xs leading-6 text-text-secondary">{ar ? `${covered} مقاطعات مغطاة · ${formatInteger(summary.mappedListings, locale)} إعلان مرتبط. الأسعار تخص الأحياء المغطاة فقط، وليست جميع عقارات المقاطعة. الحد الأدنى: ${summary.minimumObservations} إعلانات. فئات لونية حسب أرباع توزيع الأسعار الوسيطة.` : `${covered} arrondissements couverts · ${formatInteger(summary.mappedListings, locale)} annonces rattachées. Prix des seuls quartiers couverts, pas de l’ensemble de l’arrondissement. Minimum : ${summary.minimumObservations} annonces. Classes par quantiles des médianes.`}</p>
      <p className="mt-3 text-[11px] text-text-muted">© <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap contributors</a> · ODbL · <a href="https://www.geonames.org/" className="underline">GeoNames</a> · CC BY 4.0 · <a href="https://www.casablancacity.ma/" className="underline">CasablancaCity</a></p>
    </div>
  </CardSurface></PageContainer></Section>;
}
