import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, MapPin } from 'lucide-react';
import { CITY_REGISTRY } from '@/config/cities.config';
import { getCityContent } from '@/config/city-content';
import { getCityMedia, localizedMediaText } from '@/config/city-media';
import { getCityBySlug } from '@/lib/cities/registry';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { CasablancaEditorialArticle } from '@/components/city/CasablancaEditorialArticle';
import { CardSurface, CityStatusBadge, PageContainer, Section, StatePanel, ZelligePattern } from '@/components/city/CityFoundation';
import { ThemeVideoBackground } from '@/components/media/ThemeVideoBackground';

export function generateStaticParams() { return CITY_REGISTRY.filter((city) => city.cityPage.publicVisible).map((city) => ({ citySlug: city.slug })); }

export function generateMetadata({ params }: { params: { locale: string; citySlug: string } }): Metadata {
  const city = getCityBySlug(params.citySlug);
  if (!city) return {};
  if (city.seoRef) { const content = getCityContent(city.seoRef, params.locale); return { title: content.seo.title, description: content.seo.description }; }
  const name = params.locale === 'ar' ? city.nameAr : city.nameFr;
  return { title: `${name} — MaisonDeLUX`, description: `${name}, ${params.locale === 'ar' ? city.regionAr : city.regionFr}` };
}

export default function CityPage({ params }: { params: { locale: string; citySlug: string } }) {
  const city = getCityBySlug(params.citySlug);
  if (!city || !city.cityPage.publicVisible) notFound();
  const locale = params.locale;
  const dict = getDictionary(locale);
  const labels = dict.phase3.city;
  const name = locale === 'ar' ? city.nameAr : city.nameFr;
  const region = locale === 'ar' ? city.regionAr : city.regionFr;
  const content = city.contentRef ? getCityContent(city.contentRef, locale) : null;
  const media = getCityMedia(city.mediaRef);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  const isCasablanca = city.slug === 'casablanca';

  return <div className="pb-10">
    <section className="relative isolate flex min-h-[clamp(34rem,78svh,46rem)] items-end overflow-hidden bg-[#08111f] pb-10 pt-28 text-white sm:pb-14 sm:pt-36 lg:min-h-[76svh]">
      {media?.hero ? <ThemeVideoBackground darkSrc={media.hero.src} sourceType={media.hero.type} fallbackSrc={media.hero.poster ?? media.fallback} className="z-0" videoClassName="object-cover object-center" /> : media?.gallery[0] ? <Image src={media.gallery[0].src} alt={localizedMediaText(media.gallery[0].alt, locale)} fill priority sizes="100vw" className="z-0 object-cover" /> : null}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#08111f] via-[#08111f]/55 to-[#08111f]/10" />
      <ZelligePattern className="z-10 opacity-15" />
      <PageContainer className="relative z-20">
        <Link href={`/${locale}/cities`} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-white/80 hover:text-white sm:mb-8"><Arrow className="h-4 w-4 rotate-180 rtl:rotate-180" />{labels.back}</Link>
        <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2.5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-200 sm:text-sm">{region}</p><CityStatusBadge status={city.estimation.publicEnabled ? 'available' : 'coming-soon'} className="border-white/20 bg-white/10 text-white">{city.estimation.publicEnabled ? dict.phase3.cities.available : dict.phase3.cities.comingSoon}</CityStatusBadge></div><h1 className="mt-3 text-[clamp(2.5rem,13vw,5rem)] leading-none tracking-[-.04em] text-white sm:mt-4">{name}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:mt-5 sm:text-lg sm:leading-8">{content?.subtitle ?? labels.genericIntro}</p>
          {isCasablanca ? <Link href={`/${locale}/cities/casablanca/estimate`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-white px-6 py-3 font-semibold text-[#101b2d] transition hover:bg-blue-50 min-[380px]:w-auto sm:mt-8">{content?.estimationCta ?? labels.estimate}<Arrow className="h-4 w-4" /></Link> : null}
        </div>
      </PageContainer>
    </section>

    {isCasablanca ? <CasablancaEditorialArticle locale={locale} /> : <>
      <Section><PageContainer><div className="grid gap-6 lg:grid-cols-2"><CardSurface className="p-7 sm:p-9"><Building2 className="h-6 w-6 text-brand-blue" /><h2 className="mt-5 text-2xl font-bold">{labels.architecture}</h2><p className="mt-4 leading-8 text-text-secondary">{content?.architecture ?? labels.genericIntro}</p></CardSurface><CardSurface className="p-7 sm:p-9"><MapPin className="h-6 w-6 text-brand-blue" /><h2 className="mt-5 text-2xl font-bold">{labels.context}</h2><p className="mt-4 leading-8 text-text-secondary">{content?.realEstateContext ?? labels.genericContext}</p></CardSurface></div></PageContainer></Section>
      <Section className="bg-surface-subtle"><PageContainer><StatePanel title={dict.phase3.cities.comingSoon} description={labels.unavailable} /></PageContainer></Section>
    </>}

    {isCasablanca ? <Section><PageContainer><div className="rounded-media bg-[#101b2d] p-6 text-white sm:p-12"><h2 className="text-[clamp(1.75rem,8vw,3.5rem)] leading-tight text-white">{content?.availabilityMessage ?? labels.estimate}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{dict.phase3.estimate.disclaimer}</p><Link href={`/${locale}/cities/${city.slug}/estimate`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-white px-6 py-3 font-semibold text-[#101b2d] min-[380px]:w-auto sm:mt-8">{content?.estimationCta ?? labels.estimate}<Arrow className="h-4 w-4" /></Link></div></PageContainer></Section> : null}
  </div>;
}
