import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/auth';
import { databaseHealth } from '@/lib/admin/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const health = await databaseHealth();
  return NextResponse.json(health, { status: health.connected && health.schemaReady ? 200 : 503 });
}
