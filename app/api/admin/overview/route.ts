import { NextRequest, NextResponse } from 'next/server';
import { getOverview, Period, periodDays } from '@/lib/admin/analytics';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams.get('period') as Period;
    const period = p in periodDays ? p : '30d';
    return NextResponse.json(await getOverview(period, request.nextUrl.searchParams.get('region') || undefined,
      request.nextUrl.searchParams.get('city') || undefined));
  } catch (error) { console.error('Admin overview:', error); return NextResponse.json({ error: 'Analytics indisponibles.' }, { status: 500 }); }
}
