import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
export const userA = '11111111-1111-4111-8111-111111111111', userB = '22222222-2222-4222-8222-222222222222';
export async function securityDatabase() {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE TABLE public.cities(id bigint PRIMARY KEY, slug text, name text, public_enabled boolean);
    CREATE TABLE public.model_versions(id bigint PRIMARY KEY, city_id bigint REFERENCES public.cities(id), version text, public_inference_enabled boolean);
    CREATE TABLE public.estimation_events(id bigserial PRIMARY KEY,event_key text UNIQUE,created_at timestamptz DEFAULT now(),city_id bigint REFERENCES public.cities(id),model_version_id bigint REFERENCES public.model_versions(id),input_features jsonb,estimated_price_mad numeric,is_test boolean DEFAULT false);
    INSERT INTO public.cities VALUES(1,'casablanca','Casablanca',true);
    INSERT INTO public.model_versions VALUES(1,1,'casablanca-catboost-v1',true);`);
  await db.exec(readFileSync('supabase/migrations/004_phase_c_identity_rls.sql','utf8'));
  await db.query('INSERT INTO auth.users(id,raw_user_meta_data) VALUES ($1,$2),($3,$4)', [userA, { role: 'admin', display_name: 'A' }, userB, {}]);
  return db;
}
