import { NextRequest, NextResponse } from 'next/server';
import { getOverview, resolvePeriod } from '@/lib/admin/analytics';
import { adminGate } from '@/lib/admin/require';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  try {
    const period = resolvePeriod(request.nextUrl.searchParams.get('period'));
    const data = await getOverview(period, request.nextUrl.searchParams.get('cityId') || undefined,
      request.nextUrl.searchParams.get('modelId') || undefined, request.nextUrl.searchParams.get('includeTests') === 'true');
    if (!data.configured) return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 503 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 500 }); }
}
