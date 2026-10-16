import { NextRequest, NextResponse } from 'next/server';
import { getDataIntelligence, isIntelligenceCity } from '@/lib/admin/data-intelligence';
import { adminGate } from '@/lib/admin/require';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  const city = request.nextUrl.searchParams.get('city') || 'casablanca';
  if (!isIntelligenceCity(city)) return NextResponse.json({ error: 'UNSUPPORTED_CITY' }, { status: 400 });
  try {
    return NextResponse.json({ ...await getDataIntelligence(city), readAt: new Date().toISOString(), sourceType: 'historical-file' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'DATA_INTELLIGENCE_UNAVAILABLE' }, { status: 500 });
  }
}
