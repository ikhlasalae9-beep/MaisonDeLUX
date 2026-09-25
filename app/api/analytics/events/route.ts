import { NextRequest, NextResponse } from 'next/server';
import { logEstimation } from '@/lib/admin/analytics';
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    if (!event.event_key || !event.city || !event.model_version || !Number.isFinite(event.estimated_price_mad)) {
      console.warn('ANALYTICS_INVALID_EVENT', { city: Boolean(event.city), eventKey: Boolean(event.event_key),
        modelVersion: Boolean(event.model_version), price: Number.isFinite(event.estimated_price_mad) });
      return NextResponse.json({ error: 'Événement invalide' }, { status: 400 });
    }
    const stored = await logEstimation({ ...event, is_test: false });
    return NextResponse.json({ ok: true, stored }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
