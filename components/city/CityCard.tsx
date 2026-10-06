import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { VerifiedCity } from '@/config/cities.config';
import { cityImageSource, getCityMedia, localizedMediaText } from '@/config/city-media';
import { CardSurface, CityStatusBadge } from './CityFoundation';

export function CityCard({ city, locale, copy }: { city: VerifiedCity; locale: string; copy: { available: string; comingSoon: string; discover: string } }) {
  const media = getCityMedia(city.mediaRef);
  const name = locale === 'ar' ? city.nameAr : city.nameFr;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  return <Link href={`/${locale}/cities/${city.slug}`} data-city-card={city.slug} className="group block h-full rounded-card focus-visible:outline-none focus-visible:shadow-focus">
    <CardSurface className="flex h-full flex-col overflow-hidden transition duration-standard hover:-translate-y-1 hover:shadow-elevated">
      <div data-city-image className="relative aspect-[16/10] shrink-0 overflow-hidden bg-surface-subtle">
        <Image src={media ? cityImageSource(media, 0) : '/brand/logo/maisondelux-logo-primary.png'} alt={media?.gallery[0] ? localizedMediaText(media.gallery[0].alt, locale) : name} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className={media?.gallery.length ? 'object-cover transition duration-slow group-hover:scale-105' : 'object-contain p-12'} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold text-text-primary">{name}</h3>
        <p className="mt-1 min-h-10 text-sm leading-5 text-text-muted">{locale === 'ar' ? city.regionAr : city.regionFr}</p>
        <div className="mt-3"><CityStatusBadge status={city.estimation.publicEnabled ? 'available' : 'coming-soon'}>{city.estimation.publicEnabled ? copy.available : copy.comingSoon}</CityStatusBadge></div>
        <p className="mt-auto flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-brand-blue">{copy.discover}<Arrow className="h-4 w-4" /></p>
      </div>
    </CardSurface>
  </Link>;
}

export function CityCardGrid({ cities, locale, copy }: { cities: readonly VerifiedCity[]; locale: string; copy: Parameters<typeof CityCard>[0]['copy'] }) {
  return <div data-city-grid className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">{cities.map(city => <CityCard key={city.slug} city={city} locale={locale} copy={copy} />)}</div>;
}
