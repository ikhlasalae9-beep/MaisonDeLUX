'use client';

import { useMemo, useRef, useState } from 'react';
import { BarChart3, Building2, Database, MapPinned, Ruler } from 'lucide-react';
import type { CityMapSummary } from '@/lib/analytics/market-map';
import type { MarrakechMarket } from '@/lib/analytics/marrakech';
import type { RabatMarket } from '@/lib/analytics/rabat';
import { CITY_MARKET_MAPS } from '@/config/city-market';
import { CardSurface, PageContainer, Section, SectionHeading, StatePanel } from '@/components/city/CityFoundation';
import { formatArea, formatCurrency, formatInteger, formatPricePerSquareMeter } from '@/lib/utils';
import { CityMarketMap } from './CityMarketMap';
import { MarketHeading, MarketKpiOverview, MarketNeighborhoodHighlights, ChartCard, MarketAnalyticsSection, MarketNeighborhoodTable } from './CityMarketIntelligence';
import { selectNeighborhoods, type NeighborhoodSort } from '@/lib/analytics/neighborhood-presentation';

export function MarrakechMarketIntelligence({ data, locale, mapSummary, citySlug = 'marrakech' }: { data: MarrakechMarket | RabatMarket | null; locale: string; mapSummary?: CityMapSummary | null; citySlug?: 'marrakech' | 'rabat' }) {
  const ar = locale === 'ar';
  const rabat = citySlug === 'rabat';
  const cityName = rabat ? 'Rabat' : 'Marrakech';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<NeighborhoodSort>('medianPricePerM2');
  const [chartSort, setChartSort] = useState<NeighborhoodSort>('medianPricePerM2');
  const medians = selectNeighborhoods(data?.neighborhoods ?? [], data?.minimumNeighborhoodObservations ?? 8, chartSort).slice(0, 12).map(row => ({ neighborhood: row.neighborhood, medianPricePerM2: row.medianPricePerM2, count: row.listingCount }));
  const searchInput = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => selectNeighborhoods(data?.neighborhoods ?? [], data?.minimumNeighborhoodObservations ?? 8, sort, query), [data, query, sort]);
  const explore = (name: string) => {
    setQuery(name);
    searchInput.current?.focus({ preventScroll: true });
    searchInput.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
  };
  const title = rabat ? (ar ? 'ذكاء السوق — الرباط' : 'Intelligence du marché — Rabat') : ar ? 'ذكاء السوق — مراكش' : 'Intelligence du marché — Marrakech';
  const integer = (value: number) => formatInteger(value, locale);
  const unavailable = ar ? 'البيانات غير متاحة حالياً' : 'Données momentanément indisponibles';
  return <div className="pb-16 pt-28 sm:pt-36">
    <MarketHeading locale={locale} citySlug={citySlug} cityName={cityName} eyebrow={rabat ? (ar ? 'ذكاء البيانات · الرباط' : 'Data Intelligence · Rabat') : ar ? 'ذكاء البيانات · مراكش' : 'Data Intelligence · Marrakech'} title={title}
      intro={rabat ? (ar ? 'قراءة وصفية لأسعار الإعلانات المعروضة في مرجع الرباط، وليست أسعار معاملات. العينة المنقحة لإعداد النموذج متعددة الأنواع ولا تمثل السوق كاملاً؛ تواريخ النشر غير متاحة وربط بعض المواقع جغرافياً غير مؤكد.' : 'Prix affichés d’annonces du référentiel Rabat, et non de transactions. Cohorte nettoyée pour la modélisation, tous types confondus, sans garantie de représentativité ; dates de publication absentes et localisations partiellement vérifiées.') : ar ? 'قراءة وصفية للسوق انطلاقاً من مرجع شقق للبيع في مراكش. جميع المبالغ أسعار معروضة في الإعلانات وليست أسعار معاملات مؤكدة.' : 'Une lecture descriptive des appartements à vendre du référentiel Marrakech. Tous les montants sont des prix affichés d’annonces, et non des prix de transaction confirmés.'}
      source={data ? `Source : ${data.dataset}` : unavailable} showSource={false} />
    {!data ? <Section><PageContainer><StatePanel title={unavailable} description={ar ? 'تعذر اعتماد المرجع. يرجى إعادة المحاولة لاحقاً.' : 'Le référentiel ne peut pas être validé. Réessayez ultérieurement.'} /></PageContainer></Section> : <>
      <MarketKpiOverview stats={[
        [ar ? 'إعلانات قابلة للاستخدام' : 'Annonces utilisables', integer(data.kpis.usableListings), Database],
        [ar ? 'السعر المعروض الوسيط' : 'Prix affiché médian', formatCurrency(data.kpis.medianListingPriceMad, locale), Building2],
        [ar ? 'وسيط درهم/م²' : 'Médiane MAD/m²', formatPricePerSquareMeter(data.kpis.medianPricePerM2, locale), BarChart3],
        [ar ? 'متوسط المساحة' : 'Surface moyenne', formatArea(data.kpis.averageArea, locale), Ruler],
        [ar ? 'الأحياء الممثلة' : 'Quartiers représentés', integer(data.kpis.neighborhoodsRepresented), MapPinned],
      ]} />
      <CityMarketMap summary={mapSummary} geography={CITY_MARKET_MAPS[citySlug]} locale={locale} administrativeDetails />
      <MarketNeighborhoodHighlights items={data.charts.topNeighborhoodVolumes} locale={locale} onSelect={explore} />
      <MarketAnalyticsSection eyebrow={rabat ? (ar ? 'ذكاء البيانات · الرباط' : 'Data Intelligence · Rabat') : ar ? 'ذكاء البيانات · مراكش' : 'Data Intelligence · Marrakech'} title={ar ? 'بنية البيانات المرجعية' : 'Structure du référentiel'} description={rabat ? (ar ? 'توزيعات محسوبة من 700 ملاحظة منقحة، من أصل 1165 سجلاً. الأنواع النادرة لا تسمح بمقارنات موثوقة.' : 'Distributions de 700 observations nettoyées sur 1 165 lignes initiales. Les types rares ne permettent pas de comparaison fiable.') : ar ? 'توزيعات محسوبة على الخادم من الملاحظات المتاحة فعلياً. شقق للبيع فقط.' : 'Distributions calculées côté serveur sur les observations réellement disponibles. Appartements à vendre uniquement.'}
        extra={<div className="mt-5 space-y-4">
          <label className="flex flex-wrap items-center gap-3 text-xs font-bold text-text-secondary">{ar ? 'ترتيب رسم الوسيط' : 'Ordre du graphique des médianes'}<select value={chartSort} onChange={event => setChartSort(event.target.value as NeighborhoodSort)} className="min-h-11 rounded-control border border-border-medium bg-surface px-4 text-sm text-text-primary"><option value="medianPricePerM2">{ar ? 'وسيط درهم/م²' : 'Médiane MAD/m²'}</option><option value="listingCount">{ar ? 'عدد الإعلانات' : 'Volume d’annonces'}</option><option value="medianArea">{ar ? 'المساحة الوسيطة' : 'Surface médiane'}</option></select></label>
          <p className="text-xs leading-6 text-text-muted">{ar ? `الأحجام هي أعداد في العينة (${integer(data.kpis.usableListings)} إعلان)، وليست معاملات أو حصص السوق. الأسعار وصفية وتخص الأحياء المنشورة فقط (n ≥ ${data.minimumNeighborhoodObservations}).` : `Volumes du référentiel (${integer(data.kpis.usableListings)} annonces), sans mesure des transactions ni des parts de marché. Médianes descriptives, quartiers publiés uniquement (n ≥ ${data.minimumNeighborhoodObservations}).`}</p>
          <details className="text-xs text-text-secondary"><summary className="min-h-11 cursor-pointer py-3">{ar ? 'عرض القيم في جداول' : 'Voir les valeurs en tableaux'}</summary><div className="grid gap-5 lg:grid-cols-2">
            <ChartValues title={ar ? 'توزيع الأسعار المعروضة للمتر' : 'Distribution des prix affichés au m²'} rows={data.charts.pricePerM2.map(row => ({ label: row.label, value: row.count }))} locale={locale}/>
            <ChartValues title={ar ? 'حجم الإعلانات حسب الحي' : 'Volume d’annonces par quartier'} rows={data.charts.topNeighborhoodVolumes.map(row => ({ label: row.neighborhood, value: row.count }))} locale={locale}/>
            {rabat ? <ChartValues title={ar ? 'التوزيع حسب نوع العقار' : 'Répartition par type de bien'} rows={data.propertyTypes.map(row => ({label: row.label, value: row.count}))} locale={locale}/> : <ChartValues title={ar ? 'توزيع المساحات المعلنة · م²' : 'Distribution des surfaces déclarées · m²'} rows={data.charts.surface.map(row => ({ label: row.label, value: row.count }))} locale={locale}/>}
            <ChartValues title={ar ? 'وسيط درهم/م² حسب الحي' : 'Médiane MAD/m² par quartier'} rows={medians.map(row => ({ label: row.neighborhood, value: row.medianPricePerM2, count: row.count }))} locale={locale} unit={ar ? 'درهم/م²' : 'MAD/m²'}/>
          </div></details>
        </div>}>
        <ChartCard title={ar ? 'توزيع الأسعار المعروضة للمتر' : 'Distribution des prix affichés au m²'} data={data.charts.pricePerM2} dataKey="count" xKey="label" locale={locale}/>
        <ChartCard title={ar ? 'حجم الإعلانات حسب الحي' : 'Volume d’annonces par quartier'} data={data.charts.topNeighborhoodVolumes} dataKey="count" xKey="neighborhood" horizontal locale={locale}/>
        {rabat ? <ChartCard title={ar ? 'التوزيع حسب نوع العقار' : 'Répartition par type de bien'} data={data.propertyTypes} dataKey="count" xKey="label" locale={locale}/> : <ChartCard title={ar ? 'توزيع المساحات المعلنة · م²' : 'Distribution des surfaces déclarées · m²'} data={data.charts.surface} dataKey="count" xKey="label" locale={locale}/>}
        <ChartCard title={ar ? 'وسيط درهم/م² حسب الحي' : 'Médiane MAD/m² par quartier'} data={medians} dataKey="medianPricePerM2" xKey="neighborhood" horizontal locale={locale} unit={ar ? 'درهم/م²' : 'MAD/m²'}/>
      </MarketAnalyticsSection>
      <Section><PageContainer>
        <div className="flex flex-wrap items-end justify-between gap-5"><SectionHeading title={ar ? 'استكشاف الأحياء' : 'Explorer les quartiers'} description={ar ? `الأحياء التي تضم ${data.minimumNeighborhoodObservations} إعلانات على الأقل. الوسيط وصفي ولا يضمن التمثيل الإحصائي.` : `Quartiers comptant au moins ${data.minimumNeighborhoodObservations} annonces. Médianes descriptives, sans garantie de représentativité.`}/>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-text-secondary"><span className="sr-only">{ar ? 'البحث عن حي' : 'Rechercher un quartier'}</span><input ref={searchInput} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={ar ? 'البحث عن حي' : 'Rechercher un quartier'} className="min-h-11 w-48 max-w-full rounded-control border border-border-medium bg-surface px-4 text-sm font-normal text-text-primary" /></label>
            <label className="text-xs font-bold text-text-secondary"><span className="sr-only">{ar ? 'الترتيب التنازلي' : 'Trier par ordre décroissant'}</span><select value={sort} onChange={event => setSort(event.target.value as NeighborhoodSort)} className="min-h-11 rounded-control border border-border-medium bg-surface px-4 text-sm text-text-primary"><option value="medianPricePerM2">{ar ? 'وسيط درهم/م²' : 'Médiane MAD/m²'}</option><option value="listingCount">{ar ? 'حجم الإعلانات' : 'Volume d’annonces'}</option><option value="medianArea">{ar ? 'المساحة الوسيطة' : 'Surface médiane'}</option></select></label>
            {query ? <button type="button" onClick={() => { setQuery(''); searchInput.current?.focus(); }} className="min-h-11 rounded-control border border-border-medium bg-surface px-4 text-sm font-semibold text-brand-blue">{ar ? 'عرض جميع الأحياء' : 'Afficher tous les quartiers'}</button> : null}
          </div>
        </div>
        <p role="status" aria-live="polite" className="mt-4 text-xs text-text-muted">{ar ? `${integer(rows.length)} أحياء معروضة` : `${integer(rows.length)} quartiers affichés`}</p>
        <MarketNeighborhoodTable rows={rows} locale={locale} caption={rabat ? (ar ? 'الأسعار المعروضة حسب الحي — أنواع مختلطة' : 'Prix affichés par quartier — types de biens mixtes') : ar ? 'الأسعار المعروضة حسب الحي — شقق للبيع' : 'Prix affichés par quartier — appartements à vendre'} labels={[ar ? 'الحي' : 'Quartier', ar ? 'الإعلانات' : 'Annonces', ar ? 'السعر المعروض الوسيط' : 'Prix affiché médian', ar ? 'وسيط درهم/م²' : 'Médiane MAD/m²', ar ? 'المساحة الوسيطة' : 'Surface médiane', ar ? 'أنواع العقار' : 'Types de biens']} />
        {!rows.length ? <p className="mt-5 text-sm text-text-muted" role="status">{ar ? 'لا يوجد حي يطابق البحث وحد العرض.' : 'Aucun quartier ne correspond à la recherche et au seuil de publication.'}</p> : null}
        <p className="mt-4 text-xs leading-6 text-text-secondary">{ar ? `${integer(data.suppressedNeighborhoods)} أحياء دون الحد الأدنى. البحث والترتيب يخصان الجدول فقط؛ المؤشرات والتوزيعات تخص العينة الكاملة.` : `${integer(data.suppressedNeighborhoods)} quartiers sous le seuil. Recherche et tri concernent le tableau ; les indicateurs et distributions portent sur la cohorte complète.`}</p>
      </PageContainer></Section>


    </>}
  </div>;
}

function ChartValues({ title, rows, locale, unit }: { title: string; rows: Array<{ label: string; value: number; count?: number }>; locale: string; unit?: string }) {
  const ar = locale === 'ar';
  return <CardSurface className="overflow-x-auto p-5"><table className="w-full text-start text-xs"><caption className="mb-3 text-start font-bold">{title}</caption><thead><tr><th scope="col" className="py-3 text-start">{ar ? 'الفئة / الحي' : 'Classe / quartier'}</th><th scope="col" className="text-start">{ar ? 'القيمة' : 'Valeur'}{unit ? ` · ${unit}` : ''}</th>{unit ? <th scope="col" className="text-start">n</th> : null}</tr></thead><tbody>{rows.map(row => <tr key={row.label} className="border-t border-border-subtle"><th scope="row" className="py-3 text-start font-normal"><bdi>{row.label}</bdi></th><td>{formatInteger(row.value, locale)}</td>{unit ? <td>{row.count == null ? '—' : formatInteger(row.count, locale)}</td> : null}</tr>)}</tbody></table></CardSurface>;
}
