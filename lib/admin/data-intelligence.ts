import 'server-only';
import { getCasablancaDataQuality, getCasablancaDrift, getCasablancaMarketAnalytics } from '@/lib/analytics/casablanca';
import { getMarrakechMarketAudit, getMarrakechMarketRows } from '@/lib/analytics/marrakech';
import { getProductionInputFeatures } from './analytics';
import { databaseConfigured } from './db';

export type IntelligenceCity = 'casablanca' | 'marrakech';
export function isIntelligenceCity(value: string): value is IntelligenceCity {
  return value === 'casablanca' || value === 'marrakech';
}

function distribution(field: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (p: number) => {
    const index = (sorted.length - 1) * p, lower = Math.floor(index);
    return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
  };
  return { field, count: sorted.length, min: sorted[0], q05: quantile(.05), median: quantile(.5),
    q95: quantile(.95), max: sorted[sorted.length - 1], mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length };
}

export async function getDataIntelligence(city: IntelligenceCity) {
  if (city === 'casablanca') {
    const market = getCasablancaMarketAnalytics();
    const inputs = await getProductionInputFeatures('Casablanca', 'casablanca-catboost-v1');
    return { city, configured: databaseConfigured(), quality: getCasablancaDataQuality(),
      drift: databaseConfigured() ? getCasablancaDrift(inputs) : null,
      driftUnavailableReason: 'La base des événements de production est indisponible.',
      market: { listingPriceLabel: market.listingPriceLabel, minimumNeighborhoodObservations: market.minimumNeighborhoodObservations,
        eligibleNeighborhoods: market.neighborhoods.filter(item => item.benchmarkEligible).length } };
  }
  const { analytics: market, missing, propertyTypes } = getMarrakechMarketAudit();
  if (!market) throw new Error('Marrakech market unavailable');
  const rows = getMarrakechMarketRows();
  const excludedRows = Object.values(market.coverage.excluded).reduce((sum, count) => sum + count, 0);
  return { city, configured: databaseConfigured(), drift: null,
    driftUnavailableReason: 'Marrakech : aucun référentiel de surveillance compatible avec les entrées du modèle n’est connecté. La cohorte Market historique d’appartements ne représente pas sa cohorte d’entraînement. Les événements restent consultables dans Estimations; aucune dérive ni précision en production n’est calculée.',
    quality: { city: market.city, dataset: market.dataset, totalRows: market.coverage.sourceRows, usableRows: rows.length,
      excludedRows, missingByField: missing, invalidByRule: market.coverage.excluded,
      validationRate: rows.length / market.coverage.sourceRows * 100,
      neighborhoodCoverage: { distinct: market.kpis.neighborhoodsRepresented,
        eligible: market.neighborhoods.length, suppressed: market.suppressedNeighborhoods },
      referenceDistributions: { numeric: [distribution('Prix affiché (MAD)', rows.map(row => row.price)),
        distribution('Surface annoncée (m²)', rows.map(row => row.area)), distribution('Prix affiché / m²', rows.map(row => row.pricePerM2))] },
      propertyTypeCoverage: Object.entries(propertyTypes).map(([label, count]) => ({ label, count })),
      description: `Marrakech · cohorte historique d’appartements à vendre, collectée du ${market.coverage.collectedFrom.slice(0, 10)} au ${market.coverage.collectedTo.slice(0, 10)}. Prix affichés, pas de transactions ni d’activité en temps réel. Taux de rétention : ${(rows.length / market.coverage.sourceRows * 100).toFixed(1)} %.`,
      missingDescription: `Comptages et taux sur les ${market.coverage.sourceRows} lignes sources, avant exclusions.`,
      rulesDescription: 'Exclusions exclusives et ordonnées : risque de doublon, périmètre non pris en charge, anomalie de lot, valeur extrême incertaine. Un risque de doublon n’est pas un doublon exact.',
      distributionDescription: `Descriptif des ${rows.length} observations retenues uniquement; aucune transformation du modèle.`,
      typesDescription: `Catégories des ${market.coverage.sourceRows} lignes sources; la cohorte retenue contient uniquement des appartements.`,
    }, market: { listingPriceLabel: market.listingPriceLabel, minimumNeighborhoodObservations: market.minimumNeighborhoodObservations,
      eligibleNeighborhoods: market.neighborhoods.length } };
}
