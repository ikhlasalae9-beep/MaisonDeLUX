/**
 * Geographic Coverage and Administrative Mapping for MaisonDeLUX.
 *
 * Explicitly maps MaisonDeLUX verified cities to official Moroccan administrative
 * subdivisions (Provinces / Prefectures, ADM2 level).
 * 
 * Source of boundaries: OpenStreetMap / geoBoundaries gbOpen (ODbL license).
 */

export interface GeoPoint {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Maps each verified city ID to the exact name/shapeName of its administrative
 * polygon in public/maps/maroc-provinces.geojson.
 */
export const CITY_TO_SUBDIVISION_MAPPING: Record<string, string> = {
  casablanca: 'Prefecture of Casablanca',
  rabat: 'Prefecture of Rabat',
  marrakech: 'Préfecture de Marrakech عمالة مراكش',
  tanger: 'Prefecture of Tangier - Assilah',
  agadir: 'Agadir Ida-Outanane Prefecture',
  fes: 'Préfecture de Fès عمالة فاس',
  meknes: 'Prefecture de Meknès عمالة مكناس',
  kenitra: 'Province de Kenitra إقليم القنيطرة',
  sale: 'Prefecture of Salé',
  mohammedia: 'Prefecture of Mohammédia',
  tetouan: 'Tetouan Province',
  'el-jadida': 'El Jadida Province',
  temara: 'Préfecture de Skhirate-Témara عمالة الصخيرات-تمارة',
  essaouira: 'Essaouira Province',
  oujda: 'Préfecture d\'Oujda-Angad عمالة وجدة - أنجاد',
  bouskoura: 'Nouaceur Province',
};

/**
 * Reverse mapping: Subdivision polygon name -> MaisonDeLUX verified city ID
 */
export const SUBDIVISION_TO_CITY_MAPPING: Record<string, string> = Object.entries(
  CITY_TO_SUBDIVISION_MAPPING
).reduce((acc, [cityId, provName]) => {
  acc[provName] = cityId;
  return acc;
}, {} as Record<string, string>);

/**
 * Exhaustive mapping of all 75 Moroccan provinces and prefectures to their Region Key
 * (corresponding to the properties.name in public/maps/maroc.geojson).
 */
export const PROVINCE_TO_REGION_MAP: Record<string, string> = {
  // Rabat-Salé-Kénitra
  'Prefecture of Rabat': 'Rabat-Sale-Kenitra',
  'Prefecture of Salé': 'Rabat-Sale-Kenitra',
  'Préfecture de Skhirate-Témara عمالة الصخيرات-تمارة': 'Rabat-Sale-Kenitra',
  'Province de Kenitra إقليم القنيطرة': 'Rabat-Sale-Kenitra',
  'Province de Khémisset إقليم الخميسات': 'Rabat-Sale-Kenitra',
  'Province de Sidi Kacem إقليم سيدي قاسم': 'Rabat-Sale-Kenitra',
  'Province de Sidi Slimane إقليم سيدي سليمان': 'Rabat-Sale-Kenitra',

  // Casablanca-Settat
  'Prefecture of Casablanca': 'Casablanca-Settat',
  'Prefecture of Mohammédia': 'Casablanca-Settat',
  'Nouaceur Province': 'Casablanca-Settat',
  'Médiouna Province': 'Casablanca-Settat',
  'El Jadida Province': 'Casablanca-Settat',
  'Berrechid Province': 'Casablanca-Settat',
  'Settat Province': 'Casablanca-Settat',
  'Province de Benslimane إقليم بن سليمان': 'Casablanca-Settat',
  'Province de Sidi Bennour إقليم سيدي بنور': 'Casablanca-Settat',

  // Marrakech-Safi
  'Préfecture de Marrakech عمالة مراكش': 'Marrakech-Safi',
  'Essaouira Province': 'Marrakech-Safi',
  'Province de Safi إقليم أسفي': 'Marrakech-Safi',
  'Province de Youssoufia إقليم اليوسفية': 'Marrakech-Safi',
  'Chichaoua Province': 'Marrakech-Safi',
  'Al Haouz Province': 'Marrakech-Safi',
  'Province d\'El Kelâat Es-Sraghna إقليم قلعة السراغنة': 'Marrakech-Safi',
  'Rhamna Province': 'Marrakech-Safi',

  // Tanger-Tétouan-Al Hoceïma
  'Prefecture of Tangier - Assilah': 'Tanger-Tetouan-Hoceima',
  'Tetouan Province': 'Tanger-Tetouan-Hoceima',
  'Préfecture de M\'diq-Fnideq عمالة المضيق الفنيدق': 'Tanger-Tetouan-Hoceima',
  'Fahs-Anjra Province': 'Tanger-Tetouan-Hoceima',
  'Larache Province': 'Tanger-Tetouan-Hoceima',
  'Chefchaouen Province': 'Tanger-Tetouan-Hoceima',
  'Province d\'Ouezzane إقليم وزان': 'Tanger-Tetouan-Hoceima',
  'Al Hoceima Province': 'Tanger-Tetouan-Hoceima',

  // Fès-Meknès
  'Préfecture de Fès عمالة فاس': 'Fes-Meknes',
  'Prefecture de Meknès عمالة مكناس': 'Fes-Meknes',
  'Province d\'Ifrane ⵜⴰⵙⴳⴰ ⵏ ⵉⴼⵔⴰⵏ إقليم إفران': 'Fes-Meknes',
  'Province de Sefrou إقليم صفرو': 'Fes-Meknes',
  'Province de Moulay Yacoub إقليم مولاي يعقوب': 'Fes-Meknes',
  'Province d\'El Hajeb إقليم الحاجب': 'Fes-Meknes',
  'Province de Boulemane إقليم بولمان': 'Fes-Meknes',
  'Province de Taounate إقليم تاونات': 'Fes-Meknes',
  'Province de Taza اقليم تازة': 'Fes-Meknes',

  // Oriental
  'Préfecture d\'Oujda-Angad عمالة وجدة - أنجاد': 'Oriental',
  'Province de Berkane إقليم بركان': 'Oriental',
  'Province de Nador إقليم الناظور': 'Oriental',
  'Province de Driouch إقليم الدريوش': 'Oriental',
  'Province de Guercif إقليم جرسيف': 'Oriental',
  'Province de Taourirt إقليم تاوريرت': 'Oriental',
  'Province de Jerada إقليم جرادة': 'Oriental',
  'Province de Figuig إقليم الناظور': 'Oriental',

  // Souss-Massa
  'Agadir Ida-Outanane Prefecture': 'Souss Massa',
  'Inezgane-Ait Melloul Prefecture': 'Souss Massa',
  'Chtouka-Ait Baha Province': 'Souss Massa',
  'Taroudant Province': 'Souss Massa',
  'Tiznit Province': 'Souss Massa',
  'Tata Province': 'Souss Massa',

  // Béni Mellal-Khénifra
  'Province de Beni Mellal إقليم بني ملال': 'Beni Mellal-Khenifra',
  'Province de Khouribga إقليم خريبكة': 'Beni Mellal-Khenifra',
  'Province de Khénifra إقليم خنيفرة': 'Beni Mellal-Khenifra',
  'Province de Fquih Ben Saleh إقليم الفقيه بن صالح': 'Beni Mellal-Khenifra',
  'Province d\'Azilal إقليم أزيلال': 'Beni Mellal-Khenifra',

  // Drâa-Tafilalet
  'Province d\'Errachidia إقليم الرشيدية': 'Daraa-Tafilelt',
  'Ouarzazate Province': 'Daraa-Tafilelt',
  'Province de Midelt إقليم ميدلت': 'Daraa-Tafilelt',
  'Province de Tinghir إقليم تنغير': 'Daraa-Tafilelt',
  'Zagora Province': 'Daraa-Tafilelt',

  // Guelmim-Oued Noun
  'Guelmim Province': 'Guelmim-Oued Noun',
  'Province de Tan-Tan إقليم طانطان': 'Guelmim-Oued Noun',
  'Sidi Ifni Province': 'Guelmim-Oued Noun',
  'Assa-Zag Province': 'Guelmim-Oued Noun',

  // Laâyoune-Sakia El Hamra
  'Laayoune Province': 'Laayoune-Saguia Hamra',
  'Tarfaya Province': 'Laayoune-Saguia Hamra',
  'Boujdour Province': 'Laayoune-Saguia Hamra',
  'Province d\'Es-Semara إقليم السمارة': 'Laayoune-Saguia Hamra',

  // Dakhla-Oued Ed-Dahab
  'Oued Ed-Dahab Province': 'Dakhla-Oued Eddahab',
  'Province d\'Aousserd إقليم أوسرد': 'Dakhla-Oued Eddahab',
};

// Bounding box for Morocco from maroc.geojson
export const BOUNDS = {
  minLon: -17.099815,
  maxLon: -1.014839,
  minLat: 20.783042,
  maxLat: 35.930099,
};

export const SVG_WIDTH = 500;
export const SVG_HEIGHT = 550;
export const PADDING = 20;

export function mercatorY(lat: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

export const MIN_MERC = mercatorY(BOUNDS.minLat);
export const MAX_MERC = mercatorY(BOUNDS.maxLat);

/**
 * Projects a [longitude, latitude] coordinate into [x, y] SVG canvas space using Mercator.
 */
export function projectCoordinate([lon, lat]: [number, number]): [number, number] {
  const plotWidth = SVG_WIDTH - PADDING * 2;
  const plotHeight = SVG_HEIGHT - PADDING * 2;

  const x = PADDING + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * plotWidth;
  const y = PADDING + plotHeight - ((mercatorY(lat) - MIN_MERC) / (MAX_MERC - MIN_MERC)) * plotHeight;

  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

export function ringToPath(ring: [number, number][]): string {
  return (
    ring
      .map((pt, i) => {
        const [x, y] = projectCoordinate(pt);
        return (i === 0 ? 'M' : 'L') + x + ',' + y;
      })
      .join(' ') + ' Z'
  );
}

export function geometryToPath(geom: any): string {
  if (!geom) return '';
  if (geom.type === 'Polygon') {
    return geom.coordinates.map(ringToPath).join(' ');
  } else if (geom.type === 'MultiPolygon') {
    return geom.coordinates
      .map((poly: [number, number][][]) => poly.map(ringToPath).join(' '))
      .join(' ');
  }
  return '';
}

/**
 * Checks if a point [x, y] is inside a polygon ring using ray-casting.
 */
function pointInPolygonRing(pt: [number, number], ring: [number, number][]): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a point [lon, lat] is inside a GeoJSON geometry.
 */
export function isPointInGeometry(pt: [number, number], geom: any): boolean {
  if (geom.type === 'Polygon') {
    if (!pointInPolygonRing(pt, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (pointInPolygonRing(pt, geom.coordinates[i])) return false;
    }
    return true;
  } else if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some((poly: any) => {
      if (!pointInPolygonRing(pt, poly[0])) return false;
      for (let i = 1; i < poly.length; i++) {
        if (pointInPolygonRing(pt, poly[i])) return false;
      }
      return true;
    });
  }
  return false;
}

/**
 * Computes a robust interior point on a polygon geometry (in lon/lat coordinates),
 * perfectly suited for placing geographic labels strictly inside the polygon.
 */
export function getInteriorPoint(geom: any): [number, number] {
  const polygons: [number, number][][][] =
    geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const ringArea = (ring: [number, number][]) => Math.abs(ring.reduce((sum, p, i) => {
    const next = ring[(i + 1) % ring.length];
    return sum + p[0] * next[1] - next[0] * p[1];
  }, 0) / 2);
  const polygon = polygons.reduce((largest, next) =>
    ringArea(next[0]) > ringArea(largest[0]) ? next : largest
  );
  const rings = polygon.map((ring) => ring.map(projectCoordinate));
  const bounds = rings[0].reduce((b, [x, y]) => ({
    minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x),
    minY: Math.min(b.minY, y), maxY: Math.max(b.maxY, y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const segmentDistance = (x: number, y: number, a: number[], b: number[]) => {
    let dx = b[0] - a[0], dy = b[1] - a[1], px = a[0], py = a[1];
    if (dx || dy) {
      const t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy);
      if (t > 1) { px = b[0]; py = b[1]; } else if (t > 0) { px += dx * t; py += dy * t; }
    }
    dx = x - px; dy = y - py;
    return dx * dx + dy * dy;
  };
  const signedDistance = (x: number, y: number) => {
    let inside = false, minSq = Infinity;
    for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      minSq = Math.min(minSq, segmentDistance(x, y, a, b));
    }
    return (inside ? 1 : -1) * Math.sqrt(minSq);
  };
  type Cell = { x: number; y: number; h: number; d: number; max: number };
  const cell = (x: number, y: number, h: number): Cell => {
    const d = signedDistance(x, y);
    return { x, y, h, d, max: d + h * Math.SQRT2 };
  };
  const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
  let size = Math.min(width, height), h = size / 2;
  if (!size) return polygon[0][0];
  const queue: Cell[] = [];
  for (let x = bounds.minX; x < bounds.maxX; x += size)
    for (let y = bounds.minY; y < bounds.maxY; y += size) queue.push(cell(x + h, y + h, h));
  let best = cell((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, 0);
  while (queue.length) {
    queue.sort((a, b) => a.max - b.max);
    const current = queue.pop()!;
    if (current.d > best.d) best = current;
    if (current.max - best.d <= 0.25) continue;
    h = current.h / 2;
    queue.push(cell(current.x - h, current.y - h, h), cell(current.x + h, current.y - h, h),
      cell(current.x - h, current.y + h, h), cell(current.x + h, current.y + h, h));
  }
  // Convert the projected label point back to geographic coordinates.
  const lon = BOUNDS.minLon + ((best.x - PADDING) / (SVG_WIDTH - PADDING * 2)) * (BOUNDS.maxLon - BOUNDS.minLon);
  const merc = MIN_MERC + ((SVG_HEIGHT - PADDING - best.y) / (SVG_HEIGHT - PADDING * 2)) * (MAX_MERC - MIN_MERC);
  const lat = (2 * Math.atan(Math.exp(merc)) - Math.PI / 2) * 180 / Math.PI;
  return [lon, lat];
}

/**
 * Calculates bounds in projected SVG space for a GeoJSON geometry.
 */
export function getGeometrySvgBounds(geom: any): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const processPoint = (pt: [number, number]) => {
    const [x, y] = projectCoordinate(pt);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  if (geom.type === 'Polygon') {
    geom.coordinates.forEach((ring: any[]) => ring.forEach(processPoint));
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((poly: any[]) =>
      poly.forEach((ring: any[]) => ring.forEach(processPoint))
    );
  }

  return { minX, maxX, minY, maxY };
}
