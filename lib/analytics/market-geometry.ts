export type BoundaryFeature = { id: string; properties: Record<string, string>; geometry: { type: string; coordinates: number[][][] | number[][][][] } };

export function selectMarketBoundaries(features: BoundaryFeature[], level: string) {
  return features.filter(feature => feature.properties?.admin_level === level && ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type));
}

export function boundaryName(feature: BoundaryFeature, locale: string) {
  return feature.properties[locale === 'ar' ? 'name:ar' : 'name:fr'] || feature.properties['name:fr'] || feature.properties.name;
}

/** Fit actual geographic rings to a local Mercator view; preserve holes and islands. */
export function projectMarketBoundaries(features: BoundaryFeature[]) {
  const polygons = (feature: BoundaryFeature): number[][][][] => feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
  const project = ([lon, lat]: number[]) => [lon * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
  const points = features.flatMap(feature => polygons(feature).flatMap(polygon => polygon.flatMap(ring => ring.map(project))));
  if (!points.length) return [];
  const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(752 / (maxX - minX || 1), 552 / (maxY - minY || 1));
  const offsetX = (800 - (maxX - minX) * scale) / 2, offsetY = (600 - (maxY - minY) * scale) / 2;
  return features.map(feature => ({ feature, path: polygons(feature).flatMap(polygon => polygon.map(ring =>
    ring.map((point, index) => {
      const [x, y] = project(point);
      return `${index ? 'L' : 'M'}${((x - minX) * scale + offsetX).toFixed(2)},${((y - minY) * scale + offsetY).toFixed(2)}`;
    }).join(' ') + ' Z')).join(' ') }));
}
