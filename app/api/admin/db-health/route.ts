import { NextRequest, NextResponse } from 'next/server';
import { adminGate } from '@/lib/admin/require';
import { databaseHealth } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied=await adminGate(request);if(denied)return denied;
  const health = await databaseHealth();
  return NextResponse.json(health, { status: health.connected && health.schemaReady ? 200 : 503 });
}
