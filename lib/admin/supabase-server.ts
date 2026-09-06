import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const ANALYTICS_TABLE = 'estimation_events';
export const ANALYTICS_TABLE_QUALIFIED = 'public.estimation_events';

let client: SupabaseClient | null = null;
let clientConfiguration = '';

export function supabaseConfigured() {
  return Boolean(process.env.POSTGRES_SUPABASE_URL?.trim() && process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getSupabaseServerClient() {
  const url = process.env.POSTGRES_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  const configuration = `${url}\0${serviceRoleKey}`;
  if (!client || clientConfiguration !== configuration) {
    client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    clientConfiguration = configuration;
  }
  return client;
}

type SafeSupabaseError = { code?: string; message?: string };

export function isSchemaMissing(error: SafeSupabaseError | null) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

export function logSupabaseError(context: string, error: SafeSupabaseError | null) {
  console.error(isSchemaMissing(error) ? 'DB_SCHEMA_MISSING' : 'SUPABASE_API_FAILED', {
    context,
    code: error?.code,
    message: error?.message?.replace(/https?:\/\/[^\s]+/gi, '[REDACTED_URL]').slice(0, 240),
    provider: 'supabase',
    transport: 'https',
  });
}

export async function databaseHealth() {
  const base = { provider: 'supabase', transport: 'https', table: ANALYTICS_TABLE_QUALIFIED };
  const supabase = getSupabaseServerClient();
  if (!supabase) return { configured: false, connected: false, schemaReady: false, ...base, errorCode: 'DB_NOT_CONFIGURED' as const };
  const { count, error } = await supabase.from(ANALYTICS_TABLE).select('id', { count: 'exact', head: true });
  if (error) {
    logSupabaseError('databaseHealth', error);
    return { configured: true, connected: isSchemaMissing(error), schemaReady: false, ...base,
      errorCode: isSchemaMissing(error) ? 'DB_SCHEMA_MISSING' as const : 'SUPABASE_API_FAILED' as const };
  }
  return { configured: true, connected: true, schemaReady: true, ...base, rowCount: count || 0 };
}

/** Test-only hook for deterministic server-side analytics tests. */
export function setSupabaseClientForTests(testClient: SupabaseClient | null) {
  client = testClient;
  clientConfiguration = testClient ? `${process.env.POSTGRES_SUPABASE_URL?.trim()}\0${process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY?.trim()}` : '';
}
