import { getCasablancaDataQuality, getCasablancaDrift, getCasablancaMarketAnalytics } from './casablanca';

export const cityAnalyticsRegistry = {
  casablanca: {
    market: getCasablancaMarketAnalytics,
    quality: getCasablancaDataQuality,
    drift: getCasablancaDrift,
  },
} as const;

export function analyticsForCity(city: string) {
  return cityAnalyticsRegistry[city.toLowerCase() as keyof typeof cityAnalyticsRegistry] || null;
}
