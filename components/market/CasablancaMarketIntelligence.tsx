'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Building2, Database, MapPinned, Ruler } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MarketAnalytics } from '@/lib/analytics/types';
import { formatArea, formatCurrency, formatInteger, formatPricePerSquareMeter } from '@/lib/utils';
import { CardSurface, PageContainer, Section, SectionHeading } from '@/components/city/CityFoundation';
import { CityMarketMap } from './CityMarketMap';
import type { CityMapSummary } from '@/lib/analytics/market-map';

type SortKey = 'medianPricePerM2' | 'listingCount' | 'medianArea';

export function CasablancaMarketIntelligence({ data, locale, citySlug, mapSummary }: { data: MarketAnalytics; locale: string; citySlug: string; mapSummary: CityMapSummary | null }) {
  const [sort, setSort] = useState<SortKey>('medianPricePerM2');
  const rows = useMemo(() => data.neighborhoods.filter((item) => item.benchmarkEligible).sort((a, b) => b[sort] - a[sort]), [data.neighborhoods, sort]);
  const fr = locale !== 'ar';
  const copy = fr ? {
    eyebrow: 'Data Intelligence · Casablanca', title: 'Intelligence du marché — Casablanca',
    intro: "Une lecture descriptive du marché à partir du référentiel Casablanca. Tous les montants sont des prix affichés d’annonces, et non des prix de transaction confirmés.",
    listings: 'Annonces utilisables', medianPrice: 'Prix affiché médian', medianM2: 'Médiane MAD/m²', avgArea: 'Surface moyenne', neighborhoods: 'Quartiers représentés',
    chartsTitle: 'Structure du référentiel', chartsText: 'Distributions calculées côté serveur sur les observations réellement disponibles.',
    priceDist: 'Distribution des prix affichés au m²', volume: 'Volume d’annonces par quartier', types: 'Répartition par type de bien', benchmark: 'Médiane MAD/m² par quartier',
    ranking: 'Explorer les quartiers', rankingText: `Seuls les quartiers comptant au moins ${data.minimumNeighborhoodObservations} annonces sont présentés comme repères statistiques fiables.`,
    byM2: 'Médiane MAD/m²', byVolume: 'Volume d’annonces', byArea: 'Surface médiane', neighborhood: 'Quartier', count: 'Annonces', area: 'Surface médiane', mix: 'Types de biens',
  } : {
    eyebrow: 'ذكاء البيانات · الدار البيضاء', title: 'ذكاء السوق — الدار البيضاء',
    intro: 'قراءة وصفية للسوق انطلاقاً من مرجع الدار البيضاء. جميع المبالغ أسعار معروضة في الإعلانات وليست أسعار معاملات مؤكدة.',
    listings: 'إعلانات قابلة للاستخدام', medianPrice: 'السعر المعروض الوسيط', medianM2: 'وسيط درهم/م²', avgArea: 'متوسط المساحة', neighborhoods: 'الأحياء الممثلة',
    chartsTitle: 'بنية البيانات المرجعية', chartsText: 'توزيعات محسوبة على الخادم من الملاحظات المتاحة فعلياً.',
    priceDist: 'توزيع الأسعار المعروضة للمتر', volume: 'حجم الإعلانات حسب الحي', types: 'التوزيع حسب نوع العقار', benchmark: 'وسيط درهم/م² حسب الحي',
    ranking: 'استكشاف الأحياء', rankingText: `تُعرض فقط الأحياء التي تضم ${data.minimumNeighborhoodObservations} إعلانات على الأقل كمراجع إحصائية موثوقة.`,
    byM2: 'وسيط درهم/م²', byVolume: 'حجم الإعلانات', byArea: 'المساحة الوسيطة', neighborhood: 'الحي', count: 'الإعلانات', area: 'المساحة الوسيطة', mix: 'أنواع العقار',
  };
  const stats = [[copy.listings, formatInteger(data.kpis.usableListings, locale), Database], [copy.medianPrice, formatCurrency(data.kpis.medianListingPriceMad, locale), Building2],
    [copy.medianM2, formatPricePerSquareMeter(data.kpis.medianPricePerM2, locale), BarChart3], [copy.avgArea, formatArea(data.kpis.averageArea, locale), Ruler],
    [copy.neighborhoods, formatInteger(data.kpis.neighborhoodsRepresented, locale), MapPinned]] as const;
  return <div className="pb-16 pt-28 sm:pt-36">
    <PageContainer><Link href={`/${locale}/cities/${citySlug}`} className="mb-5 inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue">{fr ? `← Découvrir ${data.city}` : '→ صفحة المدينة'}</Link></PageContainer>
    <PageContainer><div className="rounded-media bg-[#101b2d] px-5 py-10 text-white sm:px-10 sm:py-14"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">{copy.eyebrow}</p><h1 className="mt-4 max-w-4xl text-[clamp(2.25rem,8vw,4.6rem)] leading-[1.02] tracking-[-.045em] text-white">{copy.title}</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 sm:text-lg sm:leading-8">{copy.intro}</p><p className="mt-5 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">Source : {data.dataset}</p></div></PageContainer>
    <Section><PageContainer><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{stats.map(([label,value,Icon])=><CardSurface key={label} className="p-4 sm:p-5"><Icon className="h-5 w-5 text-brand-blue"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-text-muted">{label}</p><p className="mt-2 break-words text-xl font-bold tracking-[-.03em] text-text-primary sm:text-2xl">{value}</p></CardSurface>)}</div></PageContainer></Section>
    {mapSummary ? <CityMarketMap summary={mapSummary} locale={locale}/> : null}
    <Section className="pt-0"><PageContainer><SectionHeading title={fr ? 'Quartiers les plus représentés' : 'الأحياء الأكثر تمثيلاً'} description={fr ? 'Les quartiers comptant le plus d’annonces dans notre référentiel.' : 'الأحياء التي تضم أكبر عدد من الإعلانات في بياناتنا.'}/><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.charts.topNeighborhoodVolumes.slice(0, 6).map(item => <CardSurface key={item.neighborhood} className="flex items-center justify-between gap-3 p-5"><h3 className="text-sm font-semibold">{item.neighborhood}</h3><p className="text-sm text-brand-blue">{formatInteger(item.count, locale)} {fr ? 'annonces' : 'إعلان'}</p></CardSurface>)}</div></PageContainer></Section>
    <Section className="bg-surface-subtle"><PageContainer><SectionHeading eyebrow={copy.eyebrow} title={copy.chartsTitle} description={copy.chartsText}/><div className="mt-8 grid gap-5 lg:grid-cols-2"><ChartCard title={copy.priceDist} data={data.charts.pricePerM2} dataKey="count" xKey="label"/><ChartCard title={copy.volume} data={data.charts.topNeighborhoodVolumes} dataKey="count" xKey="neighborhood" horizontal/><ChartCard title={copy.types} data={data.propertyTypes} dataKey="count" xKey="label"/><ChartCard title={copy.benchmark} data={data.charts.neighborhoodMedianPricePerM2} dataKey="medianPricePerM2" xKey="neighborhood" horizontal/></div></PageContainer></Section>
    <Section><PageContainer><div className="flex flex-wrap items-end justify-between gap-5"><SectionHeading title={copy.ranking} description={copy.rankingText}/><label className="text-xs font-bold text-text-secondary"><span className="sr-only">Classement</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="min-h-11 rounded-control border border-border-medium bg-surface px-4 text-sm text-text-primary"><option value="medianPricePerM2">{copy.byM2}</option><option value="listingCount">{copy.byVolume}</option><option value="medianArea">{copy.byArea}</option></select></label></div>
      <CardSurface className="mt-7 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-subtle text-[10px] uppercase tracking-[.12em] text-text-muted"><tr>{[copy.neighborhood,copy.count,copy.medianPrice,copy.medianM2,copy.area,copy.mix].map((label)=><th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody>{rows.map((item)=><tr key={item.neighborhood} className="border-t border-border-subtle"><td className="px-5 py-4 font-bold text-text-primary">{item.neighborhood}</td><td className="px-5 py-4">{formatInteger(item.listingCount,locale)}</td><td className="px-5 py-4">{formatCurrency(item.medianListingPriceMad,locale)}</td><td className="px-5 py-4 font-semibold text-brand-blue">{formatPricePerSquareMeter(item.medianPricePerM2,locale)}</td><td className="px-5 py-4">{formatArea(item.medianArea,locale)}</td><td className="px-5 py-4">{item.propertyTypes.map((type)=>`${type.label} ${type.share}%`).join(' · ')}</td></tr>)}</tbody></table></div></CardSurface>
      <p className="mt-4 text-xs leading-5 text-text-muted">{fr ? `Classements descriptifs du jeu d’annonces disponible. ${data.neighborhoods.length - rows.length} quartier(s) sous le seuil ne sont pas utilisés comme benchmark fiable.` : `تصنيفات وصفية لبيانات الإعلانات المتاحة. لا تُستخدم ${data.neighborhoods.length - rows.length} أحياء دون الحد الأدنى كمرجع موثوق.`}</p>
    </PageContainer></Section>
  </div>;
}

function ChartCard({ title, data, dataKey, xKey, horizontal = false }: { title: string; data: any[]; dataKey: string; xKey: string; horizontal?: boolean }) {
  return <CardSurface className="p-5 sm:p-6"><h2 className="font-bold text-text-primary">{title}</h2>{data.length ? <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 20 : 0, right: 10, bottom: horizontal ? 0 : 28 }}><CartesianGrid strokeDasharray="3 3" stroke="#dbe3ef" vertical={!horizontal}/>{horizontal ? <><XAxis type="number" tick={{fontSize:10}}/><YAxis type="category" dataKey={xKey} width={115} tick={{fontSize:10}}/></> : <><XAxis dataKey={xKey} angle={-28} textAnchor="end" interval={0} height={62} tick={{fontSize:9}}/><YAxis allowDecimals={false} tick={{fontSize:10}}/></>}<Tooltip formatter={(value:any)=>new Intl.NumberFormat('fr-FR').format(Number(value))}/><Bar dataKey={dataKey} fill="#2563eb" radius={horizontal ? [0,6,6,0] : [6,6,0,0]}/></BarChart></ResponsiveContainer></div> : <p className="mt-5 text-sm text-text-muted">Données insuffisantes.</p>}</CardSurface>;
}
