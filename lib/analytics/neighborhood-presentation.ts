import type { NeighborhoodMarket } from './types';

export type NeighborhoodSort = 'listingCount' | 'medianPricePerM2' | 'medianArea';
const searchKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();

/** Apply the publication guard at every presentation entry point, including future providers. */
export function selectNeighborhoods(rows: NeighborhoodMarket[], minimum: number, sort: NeighborhoodSort, query = '') {
  return rows.filter(row => row.benchmarkEligible && row.listingCount >= minimum && searchKey(row.neighborhood).includes(searchKey(query)))
    .sort((a, b) => b[sort] - a[sort] || a.neighborhood.localeCompare(b.neighborhood, 'fr'));
}
