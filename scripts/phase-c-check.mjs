import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
const url = new URL(process.env.POSTGRES_URL);
['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].forEach(key => url.searchParams.delete(key));
const pool = new pg.Pool({ connectionString: url.toString(), connectionTimeoutMillis: 8000, ssl: { rejectUnauthorized: false } });
try {
  const result = await pool.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('cities','model_versions','estimation_events','profiles','guest_trials') ORDER BY table_name,ordinal_position");
  console.table(result.rows);
  const policies = await pool.query("SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','saved_properties','estimation_events','user_roles','guest_trials','security_audit_logs')");
  console.table(policies.rows);
} catch { console.error('Read-only database inspection unavailable. Check connectivity/configuration.'); process.exitCode = 1; }
finally { await pool.end(); }
