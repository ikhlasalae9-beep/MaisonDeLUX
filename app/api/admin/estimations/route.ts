import { NextRequest, NextResponse } from 'next/server';
import { getEstimations, Period, periodDays } from '@/lib/admin/analytics';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams.get('period') as Period;
    const data = await getEstimations(p in periodDays ? p : '30d', Number(request.nextUrl.searchParams.get('page') || 1),
      request.nextUrl.searchParams.get('search') || '', request.nextUrl.searchParams.get('region') || undefined,
      request.nextUrl.searchParams.get('city') || undefined);
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 500 }); }
}
