import { NextResponse } from 'next/server';
import { getCasablancaDataQuality, getCasablancaDrift, getCasablancaMarketAnalytics } from '@/lib/analytics/casablanca';
import { getProductionInputFeatures } from '@/lib/admin/analytics';
import { databaseConfigured } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inputs = await getProductionInputFeatures();
    const market = getCasablancaMarketAnalytics();
    return NextResponse.json({ configured: databaseConfigured(), quality: getCasablancaDataQuality(), drift: getCasablancaDrift(inputs),
      market: { listingPriceLabel: market.listingPriceLabel, minimumNeighborhoodObservations: market.minimumNeighborhoodObservations,
        eligibleNeighborhoods: market.neighborhoods.filter((item) => item.benchmarkEligible).length } });
  } catch {
    return NextResponse.json({ error: 'DATA_INTELLIGENCE_UNAVAILABLE' }, { status: 500 });
  }
}
