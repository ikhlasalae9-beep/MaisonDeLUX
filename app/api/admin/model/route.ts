import { NextResponse } from 'next/server';
import { getOverview } from '@/lib/admin/analytics';
export const dynamic = 'force-dynamic';
export async function GET() {
  const data = await getOverview('all');
  return NextResponse.json({ configured: data.configured, models: 'models' in data ? data.models : [] });
}
