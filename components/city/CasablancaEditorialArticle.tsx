import { CityEditorialArticle } from './CityEditorialArticle';
import { getCasablancaEditorial } from '@/config/casablanca-editorial';
import { getCityMedia } from '@/config/city-media';

/** Compatibility entry point; Casablanca's copy and rendered template are unchanged. */
export function CasablancaEditorialArticle({ locale }: { locale: string }) {
  return <CityEditorialArticle locale={locale} copy={getCasablancaEditorial(locale)} media={getCityMedia('casablanca')!} cityLabel="Casablanca" />;
}
