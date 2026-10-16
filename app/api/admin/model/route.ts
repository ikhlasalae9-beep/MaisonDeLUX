import { NextRequest, NextResponse } from 'next/server';
import { getOverview } from '@/lib/admin/analytics';
import { adminGate } from '@/lib/admin/require';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  try {
    const data = await getOverview('all', request.nextUrl.searchParams.get('cityId') || undefined,
      request.nextUrl.searchParams.get('modelId') || undefined);
    if (!data.configured) throw new Error('DB_NOT_CONFIGURED');
    return NextResponse.json({ configured: true, readAt: data.readAt, models: 'models' in data ? data.models : [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 503 }); }
}
