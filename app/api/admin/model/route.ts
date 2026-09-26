import { NextResponse } from 'next/server';
import { getOverview } from '@/lib/admin/analytics';
import { adminGate } from '@/lib/admin/require';
export const dynamic = 'force-dynamic';
export async function GET() {
  const denied=await adminGate();if(denied)return denied;
  const data = await getOverview('all');
  return NextResponse.json({ configured: data.configured, models: 'models' in data ? data.models : [] });
}
