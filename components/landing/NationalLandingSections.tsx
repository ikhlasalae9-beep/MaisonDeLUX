import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPinned } from 'lucide-react';
import { CITY_REGISTRY } from '@/config/cities.config';
import { cityImageSource, getCityMedia } from '@/config/city-media';
import { CardSurface, PageContainer, Section, SectionHeading, CityStatusBadge } from '@/components/city/CityFoundation';

export function NationalVision({ dict }: { dict: any }) {
  const copy = dict.phase3.landing;
  return <Section><PageContainer><div className="grid gap-10 lg:grid-cols-12 lg:items-end"><div className="lg:col-span-7"><SectionHeading eyebrow={copy.visionEyebrow} title={copy.visionTitle} /></div><p className="text-lg leading-8 text-text-secondary lg:col-span-5">{copy.visionBody}</p></div></PageContainer></Section>;
}

export function LandingCityPreview({ locale, dict }: { locale: string; dict: any }) {
  const copy = dict.phase3.landing;
  const cityCopy = dict.phase3.cities;
  const featured = CITY_REGISTRY.filter((city) => ['casablanca', 'marrakech', 'tanger'].includes(city.slug));
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  return <Section className="bg-surface-subtle"><PageContainer><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow={copy.citiesEyebrow} title={copy.citiesTitle} description={copy.citiesBody} /><Link href={`/${locale}/cities`} className="inline-flex shrink-0 items-center gap-2 font-semibold text-brand-blue">{copy.allCities}<Arrow className="h-4 w-4" /></Link></div><div className="mt-10 grid gap-5 md:grid-cols-3">{featured.map((city) => { const media = getCityMedia(city.mediaRef); const image = media ? cityImageSource(media, 0) : '/brand/logo/maisondelux-logo-primary.png'; return <Link key={city.slug} href={`/${locale}/cities/${city.slug}`} className="group"><CardSurface className="h-full overflow-hidden transition duration-standard hover:-translate-y-1 hover:shadow-elevated"><div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated"><Image src={image} alt={locale === 'ar' ? city.nameAr : city.nameFr} fill sizes="(max-width: 768px) 100vw, 33vw" className={media?.gallery.length ? 'object-cover transition duration-slow group-hover:scale-105' : 'object-contain p-14'} /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{locale === 'ar' ? city.nameAr : city.nameFr}</h3><p className="mt-1 text-sm text-text-muted">{locale === 'ar' ? city.regionAr : city.regionFr}</p></div><CityStatusBadge status={city.estimation.publicEnabled ? 'available' : 'coming-soon'}>{city.estimation.publicEnabled ? cityCopy.available : cityCopy.comingSoon}</CityStatusBadge></div></div></CardSurface></Link>; })}</div></PageContainer></Section>;
}

export function FinalCallToAction({ locale, dict }: { locale: string; dict: any }) {
  const copy = dict.phase3.landing;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  return <Section><PageContainer><div className="relative overflow-hidden rounded-media bg-[#101b2d] px-6 py-14 text-center text-white sm:px-12"><div className="zellige-pattern opacity-15" /><MapPinned className="relative mx-auto h-7 w-7 text-blue-300" /><h2 className="relative mx-auto mt-5 max-w-2xl text-heading text-white">{copy.finalTitle}</h2><p className="relative mx-auto mt-4 max-w-xl text-white/70">{copy.finalBody}</p><Link href={`/${locale}/cities`} className="relative mt-8 inline-flex items-center gap-2 rounded-control bg-white px-6 py-3 font-semibold text-[#101b2d]">{copy.primaryCta}<Arrow className="h-4 w-4" /></Link></div></PageContainer></Section>;
}
