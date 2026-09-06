import { NextRequest, NextResponse } from 'next/server';
import { logEstimation } from '@/lib/admin/analytics';
import { classifyDatabaseError, databaseConfigured, logDatabaseError } from '@/lib/admin/db';
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    if (!event.event_key || !event.city || !event.region || !event.property_type || !Number.isFinite(event.surface_m2) || !Number.isFinite(event.estimated_price_mad)) {
      console.warn('ANALYTICS_INVALID_EVENT', { city: Boolean(event.city), region: Boolean(event.region),
        eventKey: Boolean(event.event_key), propertyType: Boolean(event.property_type),
        surface: Number.isFinite(event.surface_m2), price: Number.isFinite(event.estimated_price_mad) });
      return NextResponse.json({ error: 'Événement invalide' }, { status: 400 });
    }
    const stored = await logEstimation(event);
    return NextResponse.json({ ok: true, stored }, { status: 202 });
  } catch (error) {
    logDatabaseError(databaseConfigured() ? classifyDatabaseError(error) : 'DB_NOT_CONFIGURED', error, 'analyticsEventInsert');
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
