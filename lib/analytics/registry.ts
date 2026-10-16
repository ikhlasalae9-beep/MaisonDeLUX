import { getCasablancaDataQuality, getCasablancaDrift, getCasablancaMarketAnalytics } from './casablanca';
import { getMarrakechMarketAnalytics } from './marrakech';

export const cityAnalyticsRegistry = {
  marrakech: { market: getMarrakechMarketAnalytics },
  casablanca: {
    market: getCasablancaMarketAnalytics,
    quality: getCasablancaDataQuality,
    drift: getCasablancaDrift,
  },
} as const;

export function analyticsForCity(city: string) {
  return cityAnalyticsRegistry[city.toLowerCase() as keyof typeof cityAnalyticsRegistry] || null;
}
