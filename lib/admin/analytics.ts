import preprocessing from '@/models/casablanca/v1/preprocessing.json';
import { CITY_REGISTRY } from '@/config/cities.config';
import { modelRegistry } from './model';
import { databaseConfigured, logDatabaseError, query } from './db';

export type Period = 'today' | '7d' | '30d' | '90d' | 'all';
export const periodDays: Record<Period, number | null> = { today: 1, '7d': 7, '30d': 30, '90d': 90, all: null };

export type StoredEvent = {
  event_key: string;
  city: string;
  model_version: string;
  estimated_price_mad: number;
  input_features: Record<string, unknown>;
  is_test?: boolean;
};
const modelInputs: Record<string, readonly string[]> = { 'casablanca-catboost-v1': preprocessing.logical_inputs };

function filters(period: Period, cityId?: string, modelId?: string, includeTests = false) {
  const clauses: string[] = includeTests ? [] : ['e.is_test = false']; const values: unknown[] = [];
  const days = periodDays[period];
  if (days) { values.push(days); clauses.push(`e.created_at >= NOW() - ($${values.length}::text || ' days')::interval`); }
  if (cityId) { values.push(cityId); clauses.push(`e.city_id = $${values.length}`); }
  if (modelId) { values.push(modelId); clauses.push(`e.model_version_id = $${values.length}`); }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}

async function analyticsQuery(context: string, text: string, values: unknown[] = []) {
  try { return await query(text, values); } catch (error) { logDatabaseError(context, error); throw error; }
}

function normalizeFeatures(event: StoredEvent, logicalInputs: readonly string[]) {
  const source = event.input_features && typeof event.input_features === 'object' ? event.input_features : {};
  const features: Record<string, unknown> = {};
  for (const key of logicalInputs) { const value = source[key]; if (value !== undefined && value !== null && value !== '') features[key] = value; }
  return features;
}

function validCasablancaFeatures(features: Record<string, unknown>, cityName: string) {
  if (features.city !== cityName) return false;
  const required = ['city','property_type','neighborhood','area','rooms','bedrooms','bathrooms','floor'];
  if (required.some((key) => features[key] === undefined || features[key] === null || features[key] === '')) return false;
  const propertyTypes = Object.keys(preprocessing.categorical.Type.accepted);
  if (!propertyTypes.includes(String(features.property_type))) return false;
  if (!preprocessing.categorical.Localisation.accepted.includes(String(features.neighborhood))) return false;
  const numeric = Object.fromEntries(['area','rooms','bedrooms','bathrooms','floor'].map((key) => [key, Number(features[key])]));
  if (Object.values(numeric).some((value) => !Number.isFinite(value))) return false;
  if (!['rooms','bedrooms','bathrooms','floor'].every((key) => Number.isInteger(numeric[key]))) return false;
  if (numeric.area <= 0 || numeric.rooms < 1 || numeric.rooms > 10 || numeric.bedrooms < 1 || numeric.bedrooms > 10 ||
      numeric.bathrooms < 1 || numeric.bathrooms > 10 || numeric.floor < 0 || numeric.floor > 10) return false;
  if (features.current_state != null && !preprocessing.categorical.Current_state.accepted.includes(String(features.current_state))) return false;
  if (features.age != null && !preprocessing.categorical.Age.accepted.includes(String(features.age))) return false;
  return true;
}

export async function logEstimation(event: StoredEvent) {
  if (!databaseConfigured()) { logDatabaseError('logEstimation.notConfigured'); return false; }
  if (!event.event_key || !event.city || !event.model_version || !Number.isFinite(event.estimated_price_mad)) return false;
  const resolved = await analyticsQuery('logEstimation.resolveModel', `SELECT c.id AS city_id,c.name,mv.id AS model_version_id,mv.version
    FROM public.cities c JOIN public.model_versions mv ON mv.city_id=c.id
    WHERE (LOWER(c.slug)=LOWER($1) OR LOWER(c.name)=LOWER($1)) AND mv.version=$2 LIMIT 1`, [event.city, event.model_version]);
  const model = resolved.rows[0] as any; if (!model) return false;
  const logicalInputs = modelInputs[model.version]; if (!logicalInputs) return false;
  const inputFeatures = normalizeFeatures(event, logicalInputs);
  if (model.version === 'casablanca-catboost-v1' && !validCasablancaFeatures(inputFeatures, model.name)) return false;
  const createdAt = new Date();

  await analyticsQuery('logEstimation.insert', `INSERT INTO public.estimation_events
    (event_key,created_at,city_id,model_version_id,input_features,estimated_price_mad,is_test)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT (event_key) DO NOTHING`, [
    event.event_key, createdAt.toISOString(), model.city_id, model.model_version_id, JSON.stringify(inputFeatures), event.estimated_price_mad,
    event.is_test === true,
  ]);
  return true;
}

export async function getOverview(period: Period, cityId?: string, modelId?: string, includeTests = false) {
  if (!databaseConfigured()) return { configured: false }; const f = filters(period, cityId, modelId, includeTests);
  const [kpis, platform, activity, activityByCity, activityByModel, recent, cities, prices, scatter, options, models] = await Promise.all([
    analyticsQuery('overview.kpis', `SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE e.created_at>=CURRENT_DATE)::int today,
      COUNT(*) FILTER (WHERE e.created_at>=NOW()-INTERVAL '7 days')::int seven,COUNT(*) FILTER (WHERE e.created_at>=NOW()-INTERVAL '30 days')::int thirty,
      AVG(e.estimated_price_mad)::double precision avg_price,percentile_cont(0.5) WITHIN GROUP (ORDER BY e.estimated_price_mad::double precision) median_price,
      AVG(NULLIF(e.input_features->>'area','')::double precision) avg_surface,COUNT(DISTINCT e.city_id)::int cities FROM public.estimation_events e ${f.where}`, f.values),
    analyticsQuery('overview.platform', `SELECT
      (SELECT COUNT(*)::int FROM public.cities) AS registered_cities,
      (SELECT COUNT(*)::int FROM public.model_versions) AS registered_models,
      (SELECT COUNT(DISTINCT city_id)::int FROM public.model_versions) AS cities_with_models,
      (SELECT COUNT(*)::int FROM public.model_versions WHERE public_inference_enabled=true) AS public_models,
      (SELECT COUNT(*)::int FROM public.estimation_events WHERE is_test=false) AS recorded_estimations`),
    analyticsQuery('overview.activity', `SELECT TO_CHAR(DATE(e.created_at),'YYYY-MM-DD') AS "day",COUNT(*)::int AS "count" FROM public.estimation_events e ${f.where} GROUP BY DATE(e.created_at) ORDER BY DATE(e.created_at)`, f.values),
    analyticsQuery('overview.activityByCity', `SELECT c.id,c.name,COUNT(*)::int AS count FROM public.estimation_events e
      JOIN public.cities c ON c.id=e.city_id ${f.where} GROUP BY c.id,c.name ORDER BY count DESC`, f.values),
    analyticsQuery('overview.activityByModel', `SELECT mv.id,mv.version,COUNT(*)::int AS count FROM public.estimation_events e
      JOIN public.model_versions mv ON mv.id=e.model_version_id ${f.where} GROUP BY mv.id,mv.version ORDER BY count DESC`, f.values),
    analyticsQuery('overview.recent', `SELECT e.id,e.created_at,e.estimated_price_mad::double precision AS estimated_price_mad,e.is_test,
      c.id AS city_id,c.name AS city,mv.id AS model_version_id,mv.version AS model_version
      FROM public.estimation_events e JOIN public.cities c ON c.id=e.city_id
      JOIN public.model_versions mv ON mv.id=e.model_version_id AND mv.city_id=e.city_id ${f.where}
      ORDER BY e.created_at DESC LIMIT 6`, f.values),
    analyticsQuery('overview.cities', `SELECT c.id,c.slug,c.name,c.region,c.public_enabled,c.created_at,COUNT(DISTINCT mv.id)::int model_count,
      COUNT(DISTINCT e.id) FILTER (WHERE e.is_test=false)::int estimation_count FROM public.cities c LEFT JOIN public.model_versions mv ON mv.city_id=c.id
      LEFT JOIN public.estimation_events e ON e.city_id=c.id GROUP BY c.id ORDER BY c.name`),
    analyticsQuery('overview.prices', `SELECT CASE WHEN e.estimated_price_mad<500000 THEN '< 500k' WHEN e.estimated_price_mad<1000000 THEN '500k–1M'
      WHEN e.estimated_price_mad<1500000 THEN '1M–1,5M' WHEN e.estimated_price_mad<2000000 THEN '1,5M–2M' WHEN e.estimated_price_mad<3000000 THEN '2M–3M' ELSE '3M+' END bucket,
      COUNT(*)::int count FROM public.estimation_events e ${f.where} GROUP BY 1 ORDER BY MIN(e.estimated_price_mad)`, f.values),
    analyticsQuery('overview.scatter', `SELECT NULLIF(e.input_features->>'area','')::double precision surface,e.estimated_price_mad::double precision price,c.name city
      FROM public.estimation_events e JOIN public.cities c ON c.id=e.city_id ${f.where} ORDER BY e.created_at DESC LIMIT 500`, f.values),
    analyticsQuery('overview.options', `SELECT id,slug,name,region,public_enabled FROM public.cities ORDER BY name`),
    analyticsQuery('overview.models', `SELECT mv.id,mv.city_id,c.name city_name,c.slug city_slug,mv.version,mv.architecture,mv.status,mv.public_inference_enabled,
      mv.metrics,mv.trained_at,mv.created_at FROM public.model_versions mv JOIN public.cities c ON c.id=mv.city_id ORDER BY c.name,mv.created_at DESC`),
  ]);
  const registeredCities = new Set(CITY_REGISTRY.map((city) => city.slug));
  type RegistryModel = { logicalInputs: readonly string[]; supportedPropertyTypes?: readonly string[];
    academicApproval?: { status: string; label: string }; lifecycle?: Record<string, string>; metadata?: Record<string, unknown> };
  const artifacts = modelRegistry as unknown as Record<string, RegistryModel>;
  const enrichedModels = models.rows.map((row: any) => ({ ...row, artifact_registered: Boolean(artifacts[row.version]),
    logical_inputs: artifacts[row.version]?.logicalInputs || [], supported_property_types: artifacts[row.version]?.supportedPropertyTypes || [],
    academic_approval: artifacts[row.version]?.academicApproval || null, lifecycle: artifacts[row.version]?.lifecycle || null,
    documented_metadata: artifacts[row.version]?.metadata || null }));
  return { configured: true, kpis: { total: 0, today: 0, seven: 0, thirty: 0, avg_price: null, median_price: null, avg_surface: null, cities: 0, ...(kpis.rows[0] || {}) },
    platform: platform.rows[0] || {}, activity: activity.rows, activityByCity: activityByCity.rows, recent: recent.rows,
    cities: cities.rows.map((row: any) => ({ ...row, in_city_registry: registeredCities.has(row.slug),
      models: enrichedModels.filter((model: any) => String(model.city_id) === String(row.id)) })), prices: prices.rows,
    scatter: scatter.rows, activityByModel: activityByModel.rows, options: { cities: options.rows, models: enrichedModels }, models: enrichedModels, includeTests };
}

export async function getEstimations(period: Period, page = 1, search = '', cityId?: string, modelId?: string, includeTests = false) {
  if (!databaseConfigured()) return { configured: false, rows: [], total: 0 }; const f = filters(period, cityId, modelId, includeTests); const values = [...f.values]; let where = f.where;
  if (search) { values.push(`%${search}%`); where += `${where ? ' AND' : 'WHERE'} (c.name ILIKE $${values.length} OR e.event_key ILIKE $${values.length} OR e.input_features::text ILIKE $${values.length})`; }
  const count = await analyticsQuery('estimations.count', `SELECT COUNT(*)::int total FROM public.estimation_events e JOIN public.cities c ON c.id=e.city_id ${where}`, values);
  values.push(20, (Math.max(1, page) - 1) * 20);
  const rows = await analyticsQuery('estimations.rows', `SELECT e.id,e.event_key,e.created_at,e.input_features,e.estimated_price_mad::double precision estimated_price_mad,e.is_test,
    c.id city_id,c.name city,mv.version model_version FROM public.estimation_events e JOIN public.cities c ON c.id=e.city_id
    JOIN public.model_versions mv ON mv.id=e.model_version_id AND mv.city_id=e.city_id ${where} ORDER BY e.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { configured: true, rows: rows.rows, total: Number(count.rows[0]?.total || 0), includeTests };
}
