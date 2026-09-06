import { ANALYTICS_TABLE, getSupabaseServerClient, logSupabaseError, supabaseConfigured } from './supabase-server';

export type Period = 'today' | '7d' | '30d' | '90d' | 'all';
export const periodDays: Record<Period, number | null> = { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null };

type EstimationEvent = {
  id?: number; event_key?: string; created_at: string; region: string; city: string; neighborhood?: string | null;
  property_type: string; surface_m2: number | string; bedrooms?: number | null; bathrooms?: number | null;
  parking?: string | null; balcony?: string | null; sea_view?: string | null; furnished_status?: string | null;
  estimated_price_mad: number | string; model_version?: string | null; locale?: string | null;
};

const numeric = (value: number | string | null | undefined) => value == null ? 0 : Number(value);
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function applyFilters<T>(request: T, period: Period, region?: string, city?: string) {
  let filtered: any = request;
  const days = periodDays[period];
  if (days) filtered = filtered.gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString());
  if (region) filtered = filtered.eq('region', region);
  if (city) filtered = filtered.eq('city', city);
  return filtered;
}

export async function logEstimation(event: Record<string, unknown>) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;
  const payload = {
    event_key: event.event_key, region: event.region, city: event.city, neighborhood: event.neighborhood || null,
    property_type: event.property_type, surface_m2: event.surface_m2, bedrooms: event.bedrooms ?? null,
    bathrooms: event.bathrooms ?? null, parking: event.parking || null, balcony: event.balcony || null,
    sea_view: event.sea_view || null, furnished_status: event.furnished_status || null,
    estimated_price_mad: event.estimated_price_mad, model_version: event.model_version || null, locale: event.locale || null,
  };
  const { error } = await supabase.from(ANALYTICS_TABLE).upsert(payload, { onConflict: 'event_key', ignoreDuplicates: true });
  if (error) { logSupabaseError('logEstimation', error); throw new Error('SUPABASE_API_FAILED'); }
  return true;
}

export async function getOverview(period: Period, region?: string, city?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabaseConfigured() || !supabase) return { configured: false };
  const fields = 'created_at,region,city,property_type,surface_m2,bedrooms,bathrooms,parking,balcony,sea_view,furnished_status,estimated_price_mad';
  const [filteredResult, optionsResult] = await Promise.all([
    applyFilters(supabase.from(ANALYTICS_TABLE).select(fields), period, region, city),
    supabase.from(ANALYTICS_TABLE).select('region,city'),
  ]);
  if (filteredResult.error) { logSupabaseError('getOverview.filtered', filteredResult.error); throw new Error('SUPABASE_API_FAILED'); }
  if (optionsResult.error) { logSupabaseError('getOverview.options', optionsResult.error); throw new Error('SUPABASE_API_FAILED'); }
  const rows = (filteredResult.data || []) as EstimationEvent[];
  const now = Date.now();
  const since = (days: number) => now - days * 86_400_000;
  const pricesList = rows.map((row) => numeric(row.estimated_price_mad));
  const surfaces = rows.map((row) => numeric(row.surface_m2));
  const counts = (key: 'region' | 'city') => Array.from(rows.reduce((map, row) => map.set(row[key], (map.get(row[key]) || 0) + 1), new Map<string, number>()))
    .map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const activityMap = rows.reduce((map, row) => {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    return map.set(day, (map.get(day) || 0) + 1);
  }, new Map<string, number>());
  const activity = Array.from(activityMap).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day));
  const buckets = [
    { bucket: '< 500k', match: (price: number) => price < 500_000 },
    { bucket: '500k–1M', match: (price: number) => price >= 500_000 && price < 1_000_000 },
    { bucket: '1M–1,5M', match: (price: number) => price >= 1_000_000 && price < 1_500_000 },
    { bucket: '1,5M–2M', match: (price: number) => price >= 1_500_000 && price < 2_000_000 },
    { bucket: '2M–3M', match: (price: number) => price >= 2_000_000 && price < 3_000_000 },
    { bucket: '3M+', match: (price: number) => price >= 3_000_000 },
  ];
  const priceDistribution = buckets.map(({ bucket, match }) => ({ bucket, count: pricesList.filter(match).length })).filter((item) => item.count);
  const cityPrices = rows.reduce((map, row) => {
    const surface = numeric(row.surface_m2);
    if (surface > 0) map.set(row.city, [...(map.get(row.city) || []), numeric(row.estimated_price_mad) / surface]);
    return map;
  }, new Map<string, number[]>());
  const ppm = Array.from(cityPrices).filter(([, values]) => values.length >= 3)
    .map(([name, values]) => ({ name, value: average(values), count: values.length }))
    .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
  const optionalAverage = (key: 'bedrooms' | 'bathrooms') => average(rows.flatMap((row) => row[key] == null ? [] : [Number(row[key])]));
  const ratio = (predicate: (row: EstimationEvent) => boolean) => rows.length ? rows.filter(predicate).length / rows.length : null;
  const regions = counts('region').slice(0, 12);
  const cities = counts('city').slice(0, 10).map((row) => ({ ...row, percentage: rows.length ? row.count / rows.length * 100 : 0 }));
  const optionRows = (optionsResult.data || []) as Pick<EstimationEvent, 'region' | 'city'>[];
  return {
    configured: true,
    kpis: { total: rows.length, today: rows.filter((row) => +new Date(row.created_at) >= since(1)).length,
      seven: rows.filter((row) => +new Date(row.created_at) >= since(7)).length,
      thirty: rows.filter((row) => +new Date(row.created_at) >= since(30)).length,
      avg_price: average(pricesList), median_price: median(pricesList), avg_surface: average(surfaces),
      cities: new Set(rows.map((row) => row.city)).size },
    activity, regions, cities, prices: priceDistribution,
    scatter: rows.slice(0, 500).map((row) => ({ surface: numeric(row.surface_m2), price: numeric(row.estimated_price_mad), city: row.city })),
    ppm,
    profile: { bedrooms: optionalAverage('bedrooms'), bathrooms: optionalAverage('bathrooms'),
      parking: ratio((row) => row.parking === 'yes'), balcony: ratio((row) => row.balcony === 'yes'),
      sea_view: ratio((row) => row.sea_view === 'yes'), furnished: ratio((row) => row.furnished_status === 'furnished') },
    options: { regions: Array.from(new Set(optionRows.map((row) => row.region))), cities: Array.from(new Set(optionRows.map((row) => row.city))) },
  };
}

export async function getEstimations(period: Period, page = 1, search = '', region?: string, city?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabaseConfigured() || !supabase) return { configured: false, rows: [], total: 0 };
  const offset = (Math.max(1, page) - 1) * 20;
  let request: any = applyFilters(supabase.from(ANALYTICS_TABLE)
    .select('id,created_at,region,city,neighborhood,surface_m2,bedrooms,estimated_price_mad,model_version', { count: 'exact' }), period, region, city);
  const safeSearch = search.trim().replace(/[,()%]/g, '');
  if (safeSearch) request = request.or(`city.ilike.%${safeSearch}%,neighborhood.ilike.%${safeSearch}%`);
  const { data, count, error } = await request.order('created_at', { ascending: false }).range(offset, offset + 19);
  if (error) { logSupabaseError('getEstimations', error); throw new Error('SUPABASE_API_FAILED'); }
  return { configured: true, rows: (data || []).map((row: any) => ({ ...row, surface_m2: numeric(row.surface_m2),
    estimated_price_mad: numeric(row.estimated_price_mad) })), total: count || 0 };
}
