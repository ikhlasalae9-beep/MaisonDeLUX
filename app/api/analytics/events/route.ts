import { NextRequest, NextResponse } from 'next/server';
import { logEstimation } from '@/lib/admin/analytics';
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    if (!event.city || !event.region || !Number.isFinite(event.surface_m2) || !Number.isFinite(event.estimated_price_mad))
      return NextResponse.json({ error: 'Événement invalide' }, { status: 400 });
    await logEstimation(event);
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error('Analytics event logging failed:', error);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
