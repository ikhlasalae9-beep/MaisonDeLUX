import { NextRequest, NextResponse } from 'next/server';
import { getOverview, Period, periodDays } from '@/lib/admin/analytics';
import { adminGate } from '@/lib/admin/require';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  try {
    const p = request.nextUrl.searchParams.get('period') as Period;
    const period = p in periodDays ? p : '30d';
    return NextResponse.json(await getOverview(period, request.nextUrl.searchParams.get('cityId') || undefined,
      request.nextUrl.searchParams.get('modelId') || undefined, request.nextUrl.searchParams.get('includeTests') === 'true'));
  } catch { return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 500 }); }
}
