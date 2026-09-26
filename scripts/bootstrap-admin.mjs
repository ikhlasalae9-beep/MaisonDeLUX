// Explicit manual execution only: node scripts/bootstrap-admin.mjs <existing verified auth user UUID>
import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
const id=process.argv[2];
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||''))throw new Error('Supply an existing verified auth user UUID.');
let pool,client;
try{
  const url=new URL(process.env.POSTGRES_URL);['sslmode','sslcert','sslkey','sslrootcert'].forEach(key=>url.searchParams.delete(key));
  pool=new pg.Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca:process.env.POSTGRES_CA_CERT?.replace(/\\n/g,'\n')},connectionTimeoutMillis:8000});
  client=await pool.connect();
  await client.query('BEGIN');
  const user=await client.query('SELECT id FROM auth.users WHERE id=$1 AND email_confirmed_at IS NOT NULL FOR UPDATE',[id]);
  if(!user.rows.length)throw new Error('Verified user not found.');
  await client.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin') ON CONFLICT(user_id) DO UPDATE SET role='admin'",[id]);
  await client.query("INSERT INTO public.security_audit_logs(event_type,actor_user_id) VALUES('role_changed',$1)",[id]);
  await client.query('COMMIT');console.log('Admin role assigned to the verified user. No credentials printed.');
}catch{if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Admin bootstrap failed. No role change committed. Check the verified user, schema and trusted TLS CA.');process.exitCode=1;}
finally{client?.release();await pool?.end();}
