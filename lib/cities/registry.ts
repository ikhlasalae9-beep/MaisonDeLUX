import { CITY_REGISTRY, type CitySlug, type VerifiedCity } from '@/config/cities.config';
import type { Locale } from '@/lib/i18n/config';

export type BackendModelStatus = 'available' | 'prepared' | 'unavailable' | 'unknown';

export interface BackendCityAvailability {
  city: string;
  status: BackendModelStatus;
  modelVersion?: string;
}

export interface ResolvedEstimationAvailability {
  publicAvailable: boolean;
  frontendStatus: VerifiedCity['estimation']['status'];
  backendStatus: BackendModelStatus;
  reason: 'available' | 'frontend-disabled' | 'backend-unavailable';
}

const cityBySlug = new Map(CITY_REGISTRY.map((city) => [city.slug, city]));

/** Registry catalog order is shared by discovery surfaces; publication alone selects cities. */
export function getPublicCities(): readonly VerifiedCity[] {
  return CITY_REGISTRY.filter(city => city.cityPage.publicVisible);
}

const searchKey = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('fr');

export function getCityBySlug(slug: string): VerifiedCity | null {
  return cityBySlug.get(slug as CitySlug) ?? null;
}

export function searchCities(query: string): readonly VerifiedCity[] {
  const normalized = searchKey(query);
  if (!normalized) return CITY_REGISTRY;
  return CITY_REGISTRY.filter((city) =>
    city.searchAliases.some((alias) => searchKey(alias).includes(normalized))
  );
}

export function cityIndexPath(locale: Locale): string {
  return `/${locale}/cities`;
}

export function cityDetailPath(locale: Locale, slug: CitySlug): string {
  return `/${locale}/cities/${slug}`;
}

export function cityEstimatePath(locale: Locale, slug: CitySlug): string {
  return `/${locale}/cities/${slug}/estimate`;
}

export function cityMarketPath(locale: string, slug: CitySlug): string {
  return `/${locale}/cities/${slug}/market`;
}

export function cityCapabilityActions(locale: string, city: VerifiedCity) {
  if (!city.cityPage.publicVisible) return [];
  const actions: Array<{ kind: 'estimate' | 'market'; href: string; label: string }> = [];
  if (city.estimation.publicEnabled) actions.push({ kind: 'estimate', href: `/${locale}/cities/${city.slug}/estimate`, label: locale === 'ar' ? 'تقدير العقار' : 'Estimer un bien' });
  if (city.market.publicEnabled && city.market.analyticsRef) actions.push({ kind: 'market', href: cityMarketPath(locale, city.slug), label: locale === 'ar' ? 'استكشاف السوق' : 'Explorer le marché' });
  return actions;
}

export function publicCityPath(locale: Locale, city: VerifiedCity): string | null {
  return city.cityPage.publicVisible ? cityDetailPath(locale, city.slug) : null;
}

export function resolveEstimationAvailability(
  city: VerifiedCity,
  backend?: BackendCityAvailability
): ResolvedEstimationAvailability {
  const backendStatus = backend?.status ?? 'unknown';
  if (!city.estimation.publicEnabled) {
    return {
      publicAvailable: false,
      frontendStatus: city.estimation.status,
      backendStatus,
      reason: 'frontend-disabled',
    };
  }
  const backendMatches = backend?.city.trim().toLocaleLowerCase('fr') === city.nameFr.toLocaleLowerCase('fr');
  if (!backendMatches || backendStatus !== 'available') {
    return {
      publicAvailable: false,
      frontendStatus: city.estimation.status,
      backendStatus,
      reason: 'backend-unavailable',
    };
  }
  return {
    publicAvailable: true,
    frontendStatus: city.estimation.status,
    backendStatus,
    reason: 'available',
  };
}

export function publicEstimatePath(
  locale: Locale,
  city: VerifiedCity,
  backend?: BackendCityAvailability
): string | null {
  return resolveEstimationAvailability(city, backend).publicAvailable
    ? cityEstimatePath(locale, city.slug)
    : null;
}

/** Keeps the current national estimator isolated until the replacement flow is ready. */
export function legacyEstimationPath(locale: Locale, cityName?: string): string {
  const query = cityName ? `?ville=${encodeURIComponent(cityName)}` : '';
  return `/${locale}/estimation${query}`;
}

/** Public navigation uses the current city capability, never another city's estimator. */
export function publicNavigationEstimation(locale: string, pathname: string, defaultLabel: string): { href: string | null; label: string } {
  const slug = pathname.split('/')[2] === 'cities' ? pathname.split('/')[3] : '';
  const city = getCityBySlug(slug);
  if (city?.cityPage.publicVisible) {
    if (!city.estimation.publicEnabled) return { href: null, label: locale === 'ar' ? 'التقييم العقاري متاح قريباً' : 'Estimation bientôt disponible' };
    return { href: `/${locale}/cities/${city.slug}/estimate`, label: defaultLabel };
  }
  const available = CITY_REGISTRY.find(item => item.cityPage.publicVisible && item.estimation.publicEnabled);
  return { href: available ? `/${locale}/cities/${available.slug}/estimate` : null, label: defaultLabel };
}

export function globalEstimationLabel(locale: string, pathname: string, defaultLabel: string): string {
  return publicNavigationEstimation(locale, pathname, defaultLabel).label;
}
