export type CountPoint = { label: string; count: number; share: number };
export type HistogramPoint = { label: string; count: number };

export type NeighborhoodMarket = {
  neighborhood: string;
  listingCount: number;
  medianListingPriceMad: number;
  medianPricePerM2: number;
  medianArea: number;
  propertyTypes: CountPoint[];
  benchmarkEligible: boolean;
};

export type NumericDistribution = {
  field: string;
  count: number;
  min: number;
  q05: number;
  q25: number;
  median: number;
  q75: number;
  q95: number;
  max: number;
  mean: number;
  quantileEdges: number[];
};

export type MarketAnalytics = {
  city: string;
  dataset: string;
  generatedFrom: 'reference-dataset';
  listingPriceLabel: string;
  minimumNeighborhoodObservations: number;
  kpis: {
    usableListings: number;
    medianListingPriceMad: number;
    medianPricePerM2: number;
    averageArea: number;
    neighborhoodsRepresented: number;
  };
  propertyTypes: CountPoint[];
  neighborhoods: NeighborhoodMarket[];
  charts: {
    pricePerM2: HistogramPoint[];
    surface: HistogramPoint[];
    topNeighborhoodVolumes: Array<{ neighborhood: string; count: number }>;
    neighborhoodMedianPricePerM2: Array<{ neighborhood: string; medianPricePerM2: number; count: number }>;
  };
};

export type DataQualityAnalytics = {
  city: string;
  dataset: string;
  totalRows: number;
  usableRows: number;
  duplicateRows: number;
  missingByField: Record<string, number>;
  invalidByRule: Record<string, number>;
  neighborhoodCoverage: { distinct: number; supportedByModel: number; outsideModelManifest: number };
  propertyTypeCoverage: CountPoint[];
  referenceDistributions: {
    numeric: NumericDistribution[];
    categorical: Record<string, CountPoint[]>;
  };
};

export type DriftFeature = {
  field: string;
  method: 'PSI' | 'total_variation';
  value: number;
  status: 'stable' | 'watch' | 'shift';
  referenceCount: number;
  productionCount: number;
  detail?: string;
};

export type DriftAnalytics = {
  city: string;
  productionCount: number;
  minimumProductionObservations: number;
  sufficientData: boolean;
  message?: string;
  features: DriftFeature[];
};
