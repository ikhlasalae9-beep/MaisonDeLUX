import { databaseConfigured, logDatabaseError, query } from './db';

export type Period = 'today' | '7d' | '30d' | '90d' | 'all';
export const periodDays: Record<Period, number | null> = { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null };

function filters(period: Period, region?: string, city?: string) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const days = periodDays[period];
  if (days) { values.push(days); clauses.push(`created_at >= NOW() - ($${values.length}::text || ' days')::interval`); }
  if (region) { values.push(region); clauses.push(`region = $${values.length}`); }
  if (city) { values.push(city); clauses.push(`city = $${values.length}`); }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}

async function analyticsQuery(context: string, text: string, values: unknown[] = []) {
  try { return await query(text, values); }
  catch (error) { logDatabaseError(context, error); throw error; }
}

export async function logEstimation(event: Record<string, unknown>) {
  if (!databaseConfigured()) { logDatabaseError('logEstimation.notConfigured'); return false; }
  await query(`INSERT INTO public.estimation_events
    (event_key,region,city,neighborhood,property_type,surface_m2,bedrooms,bathrooms,parking,balcony,sea_view,furnished_status,estimated_price_mad,model_version,locale)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (event_key) DO NOTHING`,
    [event.event_key, event.region, event.city, event.neighborhood || null, event.property_type,
      event.surface_m2, event.bedrooms ?? null, event.bathrooms ?? null, event.parking || null,
      event.balcony || null, event.sea_view || null, event.furnished_status || null,
      event.estimated_price_mad, event.model_version || null, event.locale || null]);
  return true;
}

export async function getOverview(period: Period, region?: string, city?: string) {
  if (!databaseConfigured()) return { configured: false };
  const f = filters(period, region, city);
  const kpis = await analyticsQuery('overview.kpis', `SELECT COUNT(*)::int total,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS seven,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS thirty,
      AVG(estimated_price_mad)::double precision AS avg_price,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY estimated_price_mad::double precision) AS median_price,
      AVG(surface_m2)::double precision AS avg_surface,
      COUNT(DISTINCT city)::int AS cities
      FROM public.estimation_events ${f.where}`, f.values);
  const activity = await analyticsQuery('overview.activity',
    `SELECT DATE(created_at) AS day, COUNT(*)::int AS count FROM public.estimation_events ${f.where} GROUP BY 1 ORDER BY 1`, f.values);
  const regions = await analyticsQuery('overview.regions',
    `SELECT region AS name, COUNT(*)::int AS count FROM public.estimation_events ${f.where} GROUP BY 1 ORDER BY 2 DESC LIMIT 12`, f.values);
  const cities = await analyticsQuery('overview.cities',
    `SELECT city AS name, COUNT(*)::int AS count FROM public.estimation_events ${f.where} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`, f.values);
  const prices = await analyticsQuery('overview.prices',
    `SELECT CASE WHEN estimated_price_mad<500000 THEN '< 500k' WHEN estimated_price_mad<1000000 THEN '500k–1M'
      WHEN estimated_price_mad<1500000 THEN '1M–1,5M' WHEN estimated_price_mad<2000000 THEN '1,5M–2M'
      WHEN estimated_price_mad<3000000 THEN '2M–3M' ELSE '3M+' END AS bucket, COUNT(*)::int AS count
      FROM public.estimation_events ${f.where} GROUP BY 1`, f.values);
  const scatter = await analyticsQuery('overview.scatter',
    `SELECT surface_m2::double precision AS surface, estimated_price_mad::double precision AS price, city
      FROM public.estimation_events ${f.where} ORDER BY random() LIMIT 500`, f.values);
  const ppm = await analyticsQuery('overview.ppm',
    `SELECT city AS name, AVG(estimated_price_mad/NULLIF(surface_m2,0))::double precision AS value, COUNT(*)::int AS count
      FROM public.estimation_events ${f.where} GROUP BY 1 HAVING COUNT(*)>=3 ORDER BY 2 DESC LIMIT 10`, f.values);
  const profiles = await analyticsQuery('overview.profiles',
    `SELECT AVG(bedrooms)::double precision AS bedrooms, AVG(bathrooms)::double precision AS bathrooms,
      AVG((parking='yes')::int)::double precision AS parking, AVG((balcony='yes')::int)::double precision AS balcony,
      AVG((sea_view='yes')::int)::double precision AS sea_view,
      AVG((furnished_status='furnished')::int)::double precision AS furnished
      FROM public.estimation_events ${f.where}`, f.values);
  const options = await analyticsQuery('overview.options',
    `SELECT ARRAY_AGG(DISTINCT region) FILTER (WHERE region IS NOT NULL) AS regions,
      ARRAY_AGG(DISTINCT city) FILTER (WHERE city IS NOT NULL) AS cities FROM public.estimation_events`);
  const kpiRow = kpis.rows[0] || { total: 0, today: 0, seven: 0, thirty: 0, avg_price: null, median_price: null, avg_surface: null, cities: 0 };
  const total = Number(kpiRow.total || 0);
  return { configured: true, kpis: kpiRow, activity: activity.rows || [], regions: regions.rows || [],
    cities: cities.rows.map((row: any) => ({ ...row, percentage: total ? row.count / total * 100 : 0 })),
    prices: prices.rows || [], scatter: scatter.rows || [], ppm: ppm.rows || [],
    profile: profiles.rows[0] || { bedrooms: null, bathrooms: null, parking: null, balcony: null, sea_view: null, furnished: null },
    options: options.rows[0] || { regions: [], cities: [] } };
}

export async function getEstimations(period: Period, page = 1, search = '', region?: string, city?: string) {
  if (!databaseConfigured()) return { configured: false, rows: [], total: 0 };
  const f = filters(period, region, city);
  const values = [...f.values];
  let where = f.where;
  if (search) { values.push(`%${search}%`); where += `${where ? ' AND' : 'WHERE'} (city ILIKE $${values.length} OR neighborhood ILIKE $${values.length})`; }
  const count = await analyticsQuery('estimations.count', `SELECT COUNT(*)::int AS total FROM public.estimation_events ${where}`, values);
  values.push(20, (Math.max(1, page) - 1) * 20);
  const rows = await analyticsQuery('estimations.rows', `SELECT id,created_at,region,city,neighborhood,
    surface_m2::double precision AS surface_m2,bedrooms,estimated_price_mad::double precision AS estimated_price_mad,model_version
    FROM public.estimation_events ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { configured: true, rows: rows.rows, total: count.rows[0]?.total || 0 };
}
