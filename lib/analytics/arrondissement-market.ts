export type MappedListing = { neighborhood: string; price: number; pricePerM2: number; area: number };
export type ArrondissementMarket = { boundaryId: string; listingCount: number; neighborhoods: string[]; medianListingPriceMad: number | null; medianPricePerM2: number | null; medianArea: number | null; eligible: boolean };
export type PriceBin = { min: number; max: number; color: string };
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export function aggregateArrondissements(rows: MappedListing[], mapping: Record<string, { boundaryId: string }>, boundaryIds: string[], minimum: number) {
  const groups = new Map(boundaryIds.map(id => [id, [] as MappedListing[]]));
  rows.forEach(row => { const id = mapping[row.neighborhood]?.boundaryId; if (id && groups.has(id)) groups.get(id)!.push(row); });
  const arrondissements: ArrondissementMarket[] = Array.from(groups, ([boundaryId, items]) => {
    const eligible = items.length >= minimum;
    return { boundaryId, listingCount: items.length, neighborhoods: Array.from(new Set(items.map(row => row.neighborhood))), eligible,
      medianListingPriceMad: eligible ? Math.round(median(items.map(row => row.price))) : null,
      medianPricePerM2: eligible ? Math.round(median(items.map(row => row.pricePerM2))) : null,
      medianArea: eligible ? Number(median(items.map(row => row.area)).toFixed(1)) : null };
  });
  const mapped = new Set(arrondissements.flatMap(item => item.neighborhoods));
  return { arrondissements, mappedNeighborhoods: Array.from(mapped).sort(), unmappedNeighborhoods: Array.from(new Set(rows.map(row => row.neighborhood))).filter(name => !mapped.has(name)).sort(),
    mappedListings: arrondissements.reduce((total, item) => total + item.listingCount, 0), bins: createPriceBins(arrondissements) };
}

/** Up to four quantile classes of eligible arrondissement medians; ties stay together. */
export function createPriceBins(items: ArrondissementMarket[]): PriceBin[] {
  const values = items.filter(item => item.eligible && item.medianPricePerM2 !== null).map(item => item.medianPricePerM2!).sort((a, b) => a - b);
  if (!values.length) return [];
  const edges = Array.from(new Set([0.25, 0.5, 0.75, 1].map(q => values[Math.max(0, Math.ceil(values.length * q) - 1)])));
  const colors = ['#dbeafe', '#93c5fd', '#3b82f6', '#1e40af'];
  return edges.map((max, index) => ({ min: index ? edges[index - 1] + 1 : values[0], max, color: colors[edges.length === 1 ? 2 : Math.round(index * 3 / (edges.length - 1))] }));
}

export function arrondissementColor(item: ArrondissementMarket | undefined, bins: PriceBin[]) {
  return item?.eligible && item.medianPricePerM2 !== null ? bins.find(bin => item.medianPricePerM2! <= bin.max)?.color || '#e2e8f0' : '#e2e8f0';
}
