import { NextResponse } from 'next/server';
// Prediction events are now written atomically by the trusted inference gateway.
export async function POST(_request: Request) { return NextResponse.json({ code: 'CLIENT_EVENT_WRITES_DISABLED' }, { status: 410 }); }
