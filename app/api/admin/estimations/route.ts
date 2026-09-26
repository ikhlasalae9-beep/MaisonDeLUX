import { NextRequest, NextResponse } from 'next/server';
import { getEstimations, Period, periodDays } from '@/lib/admin/analytics';
import { adminGate } from '@/lib/admin/require';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  const page=request.nextUrl.searchParams.get('page')||'1';
  if(!/^[1-9][0-9]{0,4}$/.test(page))return NextResponse.json({code:'INVALID_PAGE'},{status:400});
  try {
    const p = request.nextUrl.searchParams.get('period') as Period;
    const data = await getEstimations(p in periodDays ? p : '30d', Number(request.nextUrl.searchParams.get('page') || 1),
      request.nextUrl.searchParams.get('search') || '', request.nextUrl.searchParams.get('cityId') || undefined,
      request.nextUrl.searchParams.get('modelId') || undefined, request.nextUrl.searchParams.get('includeTests') === 'true');
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'ANALYTICS_DATABASE_UNAVAILABLE' }, { status: 500 }); }
}
