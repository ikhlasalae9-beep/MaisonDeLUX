export type MarketMetric = 'medianPricePerM2' | 'listingCount' | 'medianArea';
export type CityMarketMapConfig = {
  citySlug: string;
  geoJsonSource: string;
  boundaryLevel: string;
  metrics: MarketMetric[];
  neighborhoodMapping: Record<string, { boundaryId: string; evidence: string; geoNamesId?: string }>;
};

export const CITY_MARKET_MAPS: Record<string, CityMarketMapConfig> = {
  casablanca: {
    citySlug: 'casablanca', geoJsonSource: '/maps/casablanca-boundaries.geojson', boundaryLevel: '10',
    metrics: ['medianPricePerM2', 'listingCount', 'medianArea'],
    // Explicit, reviewed labels only. No fuzzy matching or inherited extension labels.
    // GeoNames entries are neighborhood reference-point containment, not listing geocodes.
    // Official administrative evidence supersedes the conflicting Aïn Chock reference point.
    neighborhoodMapping: {
      Anfa: { boundaryId: 'relation/2801287', geoNamesId: 'geonames:2557798', evidence: 'data/geographic/morocco_neighborhoods.geojson: Anfa PPLX reference point inside Anfa; exact label.' },
      Oasis: { boundaryId: 'relation/2801474', geoNamesId: 'geonames:2543342', evidence: 'data/geographic/morocco_neighborhoods.geojson: Oasis is an explicit alias of L’Oasis; reference point inside Maârif.' },
      Oulfa: { boundaryId: 'relation/2801343', geoNamesId: 'geonames:2569308', evidence: 'https://hayhassani.casablancacity.ma/fr/article/991/annexes-de-larrondissement-hay-hassani — ANNEXE OULFA; local reference point corroborates Hay Hassani.' },
      'Roches Noires': { boundaryId: 'relation/2801457', geoNamesId: 'geonames:2537994', evidence: 'data/geographic/morocco_neighborhoods.geojson: Roches Noires PPLX reference point inside Roches noires; exact label.' },
      Californie: { boundaryId: 'relation/2801442', evidence: 'https://ainchock.casablancacity.ma/fr/actualite/2033/larrondissement-dain-chock-lancement-des-travaux-dentretien-de-la-voirie — zone de Californie explicitly relevant to Aïn Chock.' },
      'Sidi Maarouf': { boundaryId: 'relation/2801442', evidence: 'https://ainchock.casablancacity.ma/fr/actualite/2033/larrondissement-dain-chock-lancement-des-travaux-dentretien-de-la-voirie — zone de Sidi Maârouf explicitly relevant to Aïn Chock; accent-only label variant.' },
      'Ain Chock': { boundaryId: 'relation/2801442', evidence: 'https://ainchock.casablancacity.ma/fr/actualite/2033/larrondissement-dain-chock-lancement-des-travaux-dentretien-de-la-voirie — zone d’Aïn Chock explicitly relevant to Aïn Chock; accent-only label variant. Conflicting GeoNames point excluded.' },
    },
  },
};
