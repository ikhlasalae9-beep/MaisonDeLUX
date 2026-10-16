import { NextRequest } from 'next/server';
import { adminGate } from '@/lib/admin/require';
import { query } from '@/lib/admin/db';
import { safeResponse,errorResponse } from '@/lib/security/http';
export const dynamic='force-dynamic';
export async function GET(request: NextRequest){
  const denied=await adminGate(request);if(denied)return denied;
  try{
    const [totals,roles,signups,events,trials]=await Promise.all([
      query('SELECT count(*)::int AS total FROM auth.users'),query('SELECT role,count(*)::int AS count FROM public.user_roles GROUP BY role'),
      query('SELECT created_at FROM auth.users ORDER BY created_at DESC LIMIT 10'),
      query('SELECT event_type,created_at FROM public.security_audit_logs ORDER BY created_at DESC LIMIT 25'),
      query('SELECT count(*)::int AS total,count(*) FILTER(WHERE trial_consumed_at IS NOT NULL)::int AS consumed,count(*) FILTER(WHERE claimed_at IS NOT NULL)::int AS claimed FROM public.guest_trials'),
    ]);
    return safeResponse({readAt:new Date().toISOString(),total:totals.rows[0].total,roles:roles.rows,signups:signups.rows,events:events.rows,trials:trials.rows[0]});
  }catch(error){return errorResponse(error);}
}
