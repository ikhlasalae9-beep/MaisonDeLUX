import type { CasablancaEditorialCopy, EditorialSection } from './casablanca-editorial';
import { getCasablancaEditorial } from './casablanca-editorial';
import { MARRAKECH_EDITORIAL } from './marrakech-editorial';
import { RABAT_EDITORIAL } from './rabat-editorial';
import type { CityContentKey } from './city-content';

export type CityEditorialCopy = Omit<CasablancaEditorialCopy, 'sections'> & {
  sections: readonly (EditorialSection & { imageIndex?: number })[];
};
export function getCityEditorial(city: CityContentKey, locale: string): CityEditorialCopy {
  const editorial: Record<CityContentKey, CityEditorialCopy> = {
    casablanca: getCasablancaEditorial(locale),
    rabat: RABAT_EDITORIAL[locale === 'ar' ? 'ar' : 'fr'],
    marrakech: MARRAKECH_EDITORIAL[locale === 'ar' ? 'ar' : 'fr'],
  };
  return editorial[city];
}
