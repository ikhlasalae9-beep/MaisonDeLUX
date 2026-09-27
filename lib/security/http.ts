import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { siteOrigin } from '@/lib/auth/config';

export class PublicError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  // The request URL is supplied by the trusted Next.js runtime and lets valid
  // custom/preview hosts pass the CSRF check without accepting a foreign
  // browser Origin. SITE_URL remains accepted for canonical-host transitions.
  const allowed = new Set([siteOrigin(), request.nextUrl.origin]);
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }
  if (!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new PublicError('INVALID_ORIGIN', 403);
}
export async function jsonBody(request: NextRequest, allowed: string[]) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new PublicError('INVALID_REQUEST');
  if (Number(request.headers.get('content-length')) > 16384) throw new PublicError('INVALID_REQUEST', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new PublicError('INVALID_REQUEST');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); throw new PublicError('INVALID_REQUEST', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const text = new TextDecoder().decode(bytes);
  let body;
  try { body = JSON.parse(text); } catch { throw new PublicError('INVALID_REQUEST'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) throw new PublicError('INVALID_REQUEST');
  return body as Record<string, any>;
}
export function safeResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function errorResponse(error: unknown) {
  if (error instanceof PublicError) return safeResponse({ code: error.code }, error.status);
  console.error('PHASE_C_REQUEST_FAILED');
  return safeResponse({ code: 'SERVICE_UNAVAILABLE' }, 503);
}
