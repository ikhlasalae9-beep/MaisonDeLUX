import { NextResponse } from 'next/server';
import { modelMetadata } from '@/lib/admin/model';
export async function GET() { return NextResponse.json(modelMetadata); }
