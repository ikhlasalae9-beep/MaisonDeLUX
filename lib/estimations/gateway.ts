import 'server-only';
import { createHmac } from 'node:crypto';
import { siteOrigin } from '@/lib/auth/config';
import type { CasablancaPredictPayload } from '@/lib/api/types';

function gatewaySecret() {
  // Transitional compatibility for installations that predate the dedicated
  // gateway variable. Both runtimes already receive this existing server key.
  const secret = process.env.INFERENCE_GATEWAY_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('INFERENCE_GATEWAY_UNAVAILABLE');
  return secret;
}

export async function invokeInference(kind: 'estimate' | 'context', input: CasablancaPredictPayload) {
  const secret = gatewaySecret();
  const path = `/api/ml/${kind}`, body = JSON.stringify(input), timestamp = String(Math.floor(Date.now()/1000));
  const signature = createHmac('sha256',secret).update(`${timestamp}\n${path}\n${body}`).digest('hex');
  const response = await fetch(`${process.env.ML_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5000' : siteOrigin())}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MDL-Timestamp': timestamp, 'X-MDL-Signature': signature },
    body,
    cache: 'no-store',
    // Context is optional enrichment after the base prediction. Keep it from
    // consuming the full route budget when the backend is degraded.
    signal: AbortSignal.timeout(kind === 'estimate' ? 55000 : 12000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('INFERENCE_UNAVAILABLE');
  const result = await response.json();
  if (kind === 'estimate' && (!Number.isFinite(result.estimated_price_mad) || result.estimated_price_mad <= 0 || result.model_version !== 'casablanca-catboost-v1')) throw new Error('INVALID_MODEL_RESULT');
  return result;
}
