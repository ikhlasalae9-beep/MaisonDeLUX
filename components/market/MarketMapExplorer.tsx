'use client';

import { useId } from 'react';
import { Check, Layers3, MousePointer2 } from 'lucide-react';
import type { BoundaryFeature, CityMapSummary } from '@/lib/analytics/market-map';
import { boundaryName } from '@/lib/analytics/market-geometry';
import { formatArea, formatCurrency, formatInteger, formatPricePerSquareMeter } from '@/lib/utils';
import { CardSurface, PageContainer, Section } from '@/components/city/CityFoundation';

// Sequential prices and categorical administrative colors are deliberately separate.
const PRICE_COLORS = ['#bfdbfe', '#60a5fa', '#2563eb', '#172f78'];

type Props = {
  summary?: CityMapSummary | null;
  locale: string;
  cityName?: string;
  outlines: Array<{ feature: BoundaryFeature; path: string }>;
  selected: string;
  hovered: string;
  error: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string) => void;
};

export function MarketMapExplorer({ summary, locale, cityName, outlines, selected, hovered, error, onSelect, onHover }: Props) {
  const ar = locale === 'ar';
  const hatchId = `map-unavailable-${useId().replace(/:/g, '')}`;
  const administrative = !summary;
  const byId = new Map((summary?.arrondissements ?? []).map(item => [item.boundaryId, item]));
  const selectedId = selected || summary?.arrondissements.find(item => item.eligible)?.boundaryId || outlines[0]?.feature.id;
  const activeId = hovered || selectedId;
  const chosen = outlines.find(item => item.feature.id === activeId)?.feature;
  const stats = activeId ? byId.get(activeId) : undefined;
  const name = (feature: BoundaryFeature) => boundaryName(feature, locale);
  const binColor = (index: number) => PRICE_COLORS[summary?.bins.length === 1 ? 2 : Math.round(index * 3 / Math.max(1, (summary?.bins.length ?? 1) - 1))];
  const color = (id: string) => {
    if (administrative) return `url(#${hatchId})`;
    const item = byId.get(id);
    const index = summary.bins.findIndex(bin => item?.medianPricePerM2 != null && item.medianPricePerM2 <= bin.max);
    return item?.eligible && index >= 0 ? binColor(index) : `url(#${hatchId})`;
  };
  const description = (feature: BoundaryFeature) => {
    const item = byId.get(feature.id);
    return `${name(feature)} — ${administrative ? (ar ? 'منطقة إدارية؛ اللون لا يمثل سعراً' : 'zone administrative ; couleur sans valeur de prix') : item?.eligible ? `${formatPricePerSquareMeter(item.medianPricePerM2!, locale)} · ${formatInteger(item.listingCount, locale)} ${ar ? 'إعلان' : 'annonces'}` : (ar ? 'تغطية محدودة؛ لا ينشر سعر' : 'couverture limitée ; prix non publié')}`;
  };
  const limited = ar ? 'تغطية محدودة' : 'Couverture limitée';
  const metricClass = 'rounded-control border border-border-subtle bg-surface p-3';
  const Swatch = ({ fill, patterned = false }: { fill?: string; patterned?: boolean }) => <span aria-hidden="true" className={`h-3.5 w-5 shrink-0 rounded border border-slate-500/40 ${patterned ? 'bg-slate-200 dark:bg-slate-700' : ''}`} style={patterned ? { backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, #94a3b8 3px, #94a3b8 4px)' } : { backgroundColor: fill }} />;

  return <Section className="pt-0"><PageContainer><CardSurface className="overflow-hidden" >
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle p-5 sm:p-7">
      <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-wider text-brand-blue">{administrative ? (ar ? 'المجال الجغرافي · حسب المقاطعة' : 'Géographie · Par arrondissement') : (ar ? 'أسعار معروضة · حسب المقاطعة' : 'Prix affichés · Par arrondissement')}</p>
        <h2 className="mt-2 text-2xl font-bold">{administrative ? (ar ? `مقاطعات ${cityName}` : `Arrondissements de ${cityName}`) : (ar ? `خريطة أسعار العقارات في ${cityName}` : `Carte des prix immobiliers à ${cityName}`)}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{administrative ? (ar ? 'حدود إدارية؛ الأسعار غير متاحة دون إسناد جغرافي معتمد.' : 'Contours administratifs ; prix indisponibles sans attribution géographique validée.') : (ar ? 'قارن الأسعار المعروضة الوسيطة للمتر المربع في الأحياء المغطاة.' : 'Comparez les prix affichés médians au m² des quartiers couverts.')}</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-border-medium bg-surface-subtle px-3 py-2 text-xs font-semibold text-text-secondary"><Layers3 className="h-4 w-4 text-brand-blue" aria-hidden="true"/>{administrative ? (ar ? 'مناطق إدارية' : 'Zones administratives') : (ar ? `${summary.arrondissements.filter(item => item.eligible).length} مقاطعات مغطاة` : `${summary.arrondissements.filter(item => item.eligible).length} arrondissements couverts`)}</span>
    </header>
    <div className="grid items-start gap-6 p-5 sm:p-7 lg:grid-cols-[1.45fr_1fr]">
      <div className="min-w-0 rounded-card border border-border-medium bg-surface-subtle p-3 sm:p-5">
        {outlines.length ? <svg viewBox="0 0 800 600" className="block w-full" role="group" aria-label={administrative ? (ar ? 'المقاطعات الإدارية؛ ألوان غير إحصائية' : 'Arrondissements administratifs ; couleurs non statistiques') : (ar ? 'خريطة الأسعار المعروضة حسب المقاطعة' : 'Carte des prix affichés par arrondissement')}>
          <title>{administrative ? (ar ? 'حدود إدارية؛ لا توجد أسعار للمقاطعات' : 'Contours administratifs ; aucun prix par arrondissement') : (ar ? 'الأسعار المعروضة الوسيطة للمتر المربع' : 'Prix affichés médians au m²')}</title>
          <defs><pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" className="fill-slate-200 dark:fill-slate-700"/><path d="M-2 2L2-2M0 8L8 0M6 10L10 6" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1"/></pattern></defs>
          {outlines.map(({ feature, path }) => {
            const pinned = selectedId === feature.id;
            const preview = hovered === feature.id && !pinned;
            return <path key={feature.id} data-arrondissement={feature.id} data-map-state={pinned ? 'selected' : preview ? 'hovered' : 'idle'} d={path} fillRule="evenodd" fill={color(feature.id)} fillOpacity={administrative ? 0.85 : 1}
              stroke={pinned ? '#f59e0b' : preview ? '#38bdf8' : '#64748b'} strokeWidth={pinned ? 4 : preview ? 3 : 1.1} strokeDasharray={preview ? '5 3' : undefined} vectorEffect="non-scaling-stroke"
              role="button" tabIndex={0} aria-pressed={pinned} aria-label={description(feature)}
              onMouseEnter={() => onHover(feature.id)} onMouseLeave={() => onHover('')} onFocus={() => onHover(feature.id)} onBlur={() => onHover('')}
              onClick={() => onSelect(feature.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(feature.id); } }}
              className="cursor-pointer transition-[fill-opacity,stroke-width] duration-150 hover:brightness-110 focus:outline-none motion-reduce:transition-none"><title>{description(feature)}</title></path>;
          })}
        </svg> : <p role="status" className="flex min-h-64 items-center justify-center text-sm text-text-secondary">{error ? (ar ? 'تعذر تحميل الخريطة.' : 'Chargement de la carte indisponible.') : (ar ? 'جارٍ تحميل الخريطة…' : 'Chargement de la carte…')}</p>}
        <p className="mt-3 flex items-start gap-2 border-t border-border-medium pt-3 text-xs leading-5 text-text-secondary"><MousePointer2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>{ar ? 'اختر منطقة لتثبيتها. مرّر المؤشر أو استخدم Tab للمعاينة، وEnter أو المسافة للاختيار.' : 'Sélectionnez une zone pour la conserver. Survol ou Tab pour prévisualiser, Entrée ou Espace pour sélectionner.'}</p>
      </div>
      <div className="min-w-0">
        <div aria-live="polite" aria-atomic="true" className="rounded-card border border-border-medium bg-surface-subtle p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{hovered && hovered !== selectedId ? (ar ? 'معاينة' : 'Aperçu') : (ar ? 'المنطقة المحددة' : 'Zone sélectionnée')}</p>
          <h3 className="mt-2 text-lg font-bold leading-7">{chosen ? name(chosen) : (ar ? 'استكشف المقاطعات' : 'Explorez les arrondissements')}</h3>
          {stats?.eligible ? <>
            <div className="mt-4 border-s-4 border-brand-blue ps-4"><p className="text-[clamp(1.4rem,3vw,2rem)] font-bold tracking-tight text-brand-blue">{formatPricePerSquareMeter(stats.medianPricePerM2!, locale)}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{ar ? 'السعر المعروض الوسيط للمتر المربع' : 'Prix affiché médian au m²'}</p></div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className={metricClass}><dt className="text-xs text-text-secondary">{ar ? 'الإعلانات' : 'Annonces'}</dt><dd className="mt-2 font-bold">{formatInteger(stats.listingCount, locale)}</dd></div>
              <div className={metricClass}><dt className="text-xs text-text-secondary">{ar ? 'السعر المعروض الوسيط' : 'Prix affiché médian'}</dt><dd className="mt-2 break-words font-bold">{formatCurrency(stats.medianListingPriceMad!, locale)}</dd></div>
              <div className={metricClass}><dt className="text-xs text-text-secondary">{ar ? 'المساحة الوسيطة' : 'Surface médiane'}</dt><dd className="mt-2 font-bold">{formatArea(stats.medianArea!, locale)}</dd></div>
              <div className={metricClass}><dt className="text-xs text-text-secondary">{ar ? 'الأحياء المغطاة' : 'Quartiers couverts'}</dt><dd className="mt-2 font-bold">{formatInteger(stats.neighborhoods.length, locale)}</dd></div>
            </dl><p className="mt-4 text-xs leading-5 text-text-secondary">{stats.neighborhoods.join(' · ')}</p>{summary?.attribution ? <p className="mt-3 text-xs leading-5 text-text-secondary">{ar ? 'حصة الإعلانات المحتفظ بها في المدينة' : 'Part des annonces retenues de la ville'} : {new Intl.NumberFormat(ar ? 'ar-MA' : 'fr-MA', { maximumFractionDigits: 1 }).format(summary.attribution.arrondissementShares[stats.boundaryId])}%</p> : null}
          </> : administrative ? <>
            <div className="mt-4 rounded-control border border-border-medium bg-surface p-4"><p className="text-xs font-semibold text-text-secondary">{ar ? 'أسعار السوق حسب المقاطعة' : 'Prix du marché par arrondissement'}</p><p className="mt-2 text-xl font-bold">{ar ? 'غير متاح' : 'Non disponible'}</p><p className="mt-2 text-xs leading-5 text-text-secondary">{ar ? 'في انتظار مطابقة معتمدة بين الأحياء والمقاطعات. لا تُنسب أسعار أو إعلانات إلى هذه الحدود.' : 'En attente d’une correspondance validée entre quartiers et arrondissements. Aucun prix ni effectif attribué à ces contours.'}</p></div>
            {chosen ? <details className="mt-5 text-xs"><summary className="min-h-11 cursor-pointer py-3 font-semibold">{ar ? 'معلومات إدارية متاحة' : 'Informations administratives disponibles'}</summary><dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className={metricClass}><dt className="text-text-secondary">{ar ? 'معرّف OpenStreetMap' : 'Identifiant OpenStreetMap'}</dt><dd className="mt-2 break-all font-semibold"><bdi>{chosen.id}</bdi></dd></div>
              <div className={metricClass}><dt className="text-text-secondary">{ar ? 'رمز HCP في المصدر' : 'Code HCP dans la source'}</dt><dd className="mt-2 font-semibold"><bdi>{chosen.properties['ref:MA:HCP'] || '—'}</bdi></dd></div>
              <div className={metricClass}><dt className="text-text-secondary">{ar ? 'المستوى الإداري' : 'Niveau administratif'}</dt><dd className="mt-2 font-semibold">{chosen.properties.admin_level}</dd></div>
              <div className={metricClass}><dt className="text-text-secondary">{ar ? 'نطاق المعلومات' : 'Portée des informations'}</dt><dd className="mt-2 font-semibold">{ar ? 'حدود إدارية' : 'Contours administratifs'}</dd></div>
            </dl></details> : null}
          </> : <div className="mt-4 rounded-control border border-border-medium bg-surface p-4"><p className="font-bold">{limited}</p><p className="mt-2 text-sm leading-6 text-text-secondary">{ar ? `أقل من ${summary?.minimumObservations} إعلانات مرتبطة ومعتمدة؛ لا ينشر سعر للمقاطعة.` : `Moins de ${summary?.minimumObservations} annonces rattachées et validées ; aucun prix d’arrondissement publié.`}</p>{stats?.listingCount ? <p className="mt-2 text-xs font-semibold">{formatInteger(stats.listingCount, locale)} {ar ? 'إعلان مرتبط' : 'annonces rattachées'}</p> : null}</div>}
        </div>
        <p className="mb-3 mt-5 text-xs font-bold text-text-secondary">{ar ? 'اختيار مقاطعة' : 'Choisir un arrondissement'}</p>
        <div className="grid max-h-64 gap-2 overflow-y-auto overscroll-contain p-1" style={{ scrollbarWidth: 'thin', scrollbarGutter: 'stable', scrollbarColor: '#64748b transparent' }}>
          {outlines.map(({ feature }) => { const pinned = feature.id === selectedId; const item = byId.get(feature.id); return <button type="button" key={feature.id} aria-pressed={pinned} onClick={() => { onHover(''); onSelect(feature.id); }} onMouseEnter={() => onHover(feature.id)} onMouseLeave={() => onHover('')} onFocus={() => onHover(feature.id)} onBlur={() => onHover('')}
            className={`flex min-h-12 items-center gap-3 rounded-control border px-3 py-3 text-start text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue motion-reduce:transition-none ${pinned ? 'border-brand-blue bg-brand-blue/10 font-bold' : 'border-border-medium bg-surface hover:border-brand-blue hover:bg-brand-blue/5'}`}>
            <Swatch fill={item?.eligible ? color(feature.id) : undefined} patterned={administrative || !item?.eligible}/><span className="min-w-0 flex-1 leading-5">{name(feature)}{!administrative ? <span className="block text-[11px] font-normal text-text-secondary">{item?.eligible ? formatPricePerSquareMeter(item.medianPricePerM2!, locale) : limited}</span> : null}</span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${pinned ? 'border-brand-blue bg-brand-blue text-white' : 'border-border-medium'}`} aria-hidden="true">{pinned ? <Check className="h-3.5 w-3.5"/> : null}</span>
          </button>; })}
        </div>
      </div>
    </div>
    <div className="border-t border-border-subtle bg-surface-subtle/50 p-5 sm:p-7">
      <p className="text-xs font-bold">{administrative ? (ar ? 'حدود إدارية · أسعار غير متاحة' : 'Contours administratifs · prix indisponibles') : (ar ? 'السعر المعروض الوسيط · درهم/م²' : 'Prix affiché médian · MAD/m²')}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-xs text-text-secondary">{administrative ? <span className="inline-flex items-center gap-2"><Swatch patterned/>{ar ? 'أسعار غير متاحة' : 'Prix indisponibles'}</span> : <>{summary.bins.map((bin, index) => <span key={bin.max} className="inline-flex items-center gap-2"><Swatch fill={binColor(index)}/>{bin.min === bin.max ? formatInteger(bin.min, locale) : `${formatInteger(bin.min, locale)}–${formatInteger(bin.max, locale)}`}</span>)}<span className="inline-flex items-center gap-2"><Swatch patterned/>{limited}</span></>}</div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3.5 w-5 rounded border-[3px] border-amber-500"/>{ar ? 'محدد' : 'Sélection'}</span><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3.5 w-5 rounded border-2 border-dashed border-sky-400"/>{ar ? 'معاينة بالمرور أو لوحة المفاتيح' : 'Survol ou focus clavier'}</span></div>
      <p className="mt-4 max-w-4xl text-xs leading-6 text-text-secondary">{administrative ? (ar ? 'تعرض الخريطة مناطق إدارية فقط. الألوان لا تمثل أسعاراً. أسعار السوق حسب المقاطعة غير متاحة دون مطابقة معتمدة للأحياء.' : 'La carte présente des zones administratives. Les couleurs ne représentent pas des prix. Les prix par arrondissement restent indisponibles sans correspondance validée des quartiers.') : (ar ? `${formatInteger(summary.mappedListings, locale)} إعلان مرتبط. الأسعار تخص الأحياء المغطاة فقط، وليس كامل المقاطعة. الحد الأدنى ${summary.minimumObservations} إعلانات؛ ما دونه تغطية محدودة دون سعر منشور. فئات حسب أرباع الوسيط. أسعار معروضة وليست أسعار معاملات.` : `${formatInteger(summary.mappedListings, locale)} annonces rattachées. Prix des seuls quartiers couverts, pas de l’ensemble de l’arrondissement. Minimum : ${summary.minimumObservations} annonces ; en dessous, couverture limitée et prix non publié. Classes par quantiles des médianes. Prix affichés, et non prix de transaction.`)}</p>
      {summary?.attribution ? <p className="mt-3 text-xs leading-6 text-text-secondary">{ar ? `إسناد حسب أسماء الأحياء: ${formatInteger(summary.mappedListings, locale)} من ${formatInteger(summary.attribution.retainedListings, locale)} إعلان (${new Intl.NumberFormat('ar-MA').format(summary.attribution.mappedSharePercent)}%)؛ ${formatInteger(summary.attribution.unmappedListings, locale)} دون إسناد. لا تتوفر إحداثيات الإعلانات؛ هذه أسعار الأحياء المسندة فقط.` : `Attribution par quartier : ${formatInteger(summary.mappedListings, locale)} sur ${formatInteger(summary.attribution.retainedListings, locale)} annonces (${new Intl.NumberFormat('fr-MA').format(summary.attribution.mappedSharePercent)} %) ; ${formatInteger(summary.attribution.unmappedListings, locale)} non rattachées. Sans coordonnées individuelles ; prix des seuls quartiers attribués.`}</p> : null}
      <p className="mt-3 text-[11px] text-text-muted">© <a href="https://www.openstreetmap.org/copyright" className="underline">OpenStreetMap contributors</a> · ODbL{summary ? <> · <a href="https://www.geonames.org/" className="underline">GeoNames</a> · CC BY 4.0 · <a href={summary.citySlug === 'casablanca' ? 'https://www.casablancacity.ma/' : 'https://www.ville-marrakech.ma/'} className="underline">{summary.citySlug === 'casablanca' ? 'CasablancaCity' : (ar ? 'جماعة مراكش' : 'Commune de Marrakech')}</a></> : null}</p>
    </div>
  </CardSurface></PageContainer></Section>;
}
