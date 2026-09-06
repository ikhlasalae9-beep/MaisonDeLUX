import { databaseConfigured, query } from './db';

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

export async function logEstimation(event: Record<string, unknown>) {
  if (!databaseConfigured()) return false;
  await query(`INSERT INTO estimation_events
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
  const [kpis, activity, regions, cities, prices, scatter, ppm, profiles, options] = await Promise.all([
    query(`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int today,
      COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '7 days')::int seven,
      COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days')::int thirty,
      AVG(estimated_price_mad)::float avg_price, percentile_cont(.5) WITHIN GROUP (ORDER BY estimated_price_mad)::float median_price,
      AVG(surface_m2)::float avg_surface, COUNT(DISTINCT city)::int cities ${`FROM estimation_events ${f.where}`}`, f.values),
    query(`SELECT DATE(created_at) day, COUNT(*)::int count FROM estimation_events ${f.where} GROUP BY 1 ORDER BY 1`, f.values),
    query(`SELECT region name, COUNT(*)::int count FROM estimation_events ${f.where} GROUP BY 1 ORDER BY 2 DESC LIMIT 12`, f.values),
    query(`SELECT city name, COUNT(*)::int count FROM estimation_events ${f.where} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`, f.values),
    query(`SELECT CASE WHEN estimated_price_mad<500000 THEN '< 500k' WHEN estimated_price_mad<1000000 THEN '500k–1M'
      WHEN estimated_price_mad<1500000 THEN '1M–1,5M' WHEN estimated_price_mad<2000000 THEN '1,5M–2M'
      WHEN estimated_price_mad<3000000 THEN '2M–3M' ELSE '3M+' END bucket, COUNT(*)::int count
      FROM estimation_events ${f.where} GROUP BY 1`, f.values),
    query(`SELECT surface_m2::float surface, estimated_price_mad::float price, city FROM estimation_events ${f.where} ORDER BY random() LIMIT 500`, f.values),
    query(`SELECT city name, AVG(estimated_price_mad/NULLIF(surface_m2,0))::float value, COUNT(*)::int count
      FROM estimation_events ${f.where} GROUP BY 1 HAVING COUNT(*)>=3 ORDER BY 2 DESC LIMIT 10`, f.values),
    query(`SELECT AVG(bedrooms)::float bedrooms, AVG(bathrooms)::float bathrooms,
      AVG((parking='yes')::int)::float parking, AVG((balcony='yes')::int)::float balcony,
      AVG((sea_view='yes')::int)::float sea_view, AVG((furnished_status='furnished')::int)::float furnished
      FROM estimation_events ${f.where}`, f.values),
    query(`SELECT ARRAY_AGG(DISTINCT region) regions, ARRAY_AGG(DISTINCT city) cities FROM estimation_events`),
  ]);
  const total = Number(kpis.rows[0]?.total || 0);
  return { configured: true, kpis: kpis.rows[0], activity: activity.rows, regions: regions.rows,
    cities: cities.rows.map((row: any) => ({ ...row, percentage: total ? row.count / total * 100 : 0 })),
    prices: prices.rows, scatter: scatter.rows, ppm: ppm.rows, profile: profiles.rows[0], options: options.rows[0] };
}

export async function getEstimations(period: Period, page = 1, search = '', region?: string, city?: string) {
  if (!databaseConfigured()) return { configured: false, rows: [], total: 0 };
  const f = filters(period, region, city);
  const values = [...f.values];
  let where = f.where;
  if (search) { values.push(`%${search}%`); where += `${where ? ' AND' : 'WHERE'} (city ILIKE $${values.length} OR neighborhood ILIKE $${values.length})`; }
  const count = await query(`SELECT COUNT(*)::int total FROM estimation_events ${where}`, values);
  values.push(20, (Math.max(1, page) - 1) * 20);
  const rows = await query(`SELECT id,created_at,region,city,neighborhood,surface_m2::float,bedrooms,
    estimated_price_mad::float,model_version FROM estimation_events ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { configured: true, rows: rows.rows, total: count.rows[0]?.total || 0 };
}
