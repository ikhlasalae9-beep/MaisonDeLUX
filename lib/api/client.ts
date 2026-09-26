import { PredictPayload, PredictResponse, CitiesResponse, CasablancaContextResponse, CasablancaPredictPayload } from './types';


/**
 * Client for the MaisonDeLUX ML valuation backend.
 * Adheres strictly to the no-fake-data policy:
 * If the service is unreachable or offline, it reports service unavailability.
 * Never fabricates property prices.
 */
export async function predictProperty(
  payload: PredictPayload
): Promise<{ data?: PredictResponse; error?: string; isOffline?: boolean }> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout

    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        error: errorData.error || `Erreur serveur (${res.status})`,
      };
    }

    const data: PredictResponse = await res.json();
    if (!Number.isFinite(data.estimated_price_mad) || data.estimated_price_mad <= 0) return { error: 'Réponse invalide du service.' };
    return { data };
  } catch (err: any) {
    // Connection refused, network error, or timeout
    return {
      isOffline: true,
      error: 'Le moteur d\'estimation est actuellement en cours de connexion.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export class EstimationError extends Error { constructor(public code: string, message: string) { super(message); } }
export async function predictCasablanca(payload: CasablancaPredictPayload, options: { eventId?: string; locale?: string; requestId?: string } = {}): Promise<PredictResponse> {
  // A Python/CatBoost serverless instance can legitimately take longer than 15s
  // to cold-start. Keep a finite guard, but do not cancel healthy cold inference.
  const predictionTimeoutMs = 60_000;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, predictionTimeoutMs);
  try {
    const response = await fetch(options.eventId ? `/api/estimations/${options.eventId}/simulate` : '/api/estimations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.eventId ? { input: payload } : { input: payload, request_id: options.requestId || crypto.randomUUID() }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new EstimationError(body.code || 'SERVICE_UNAVAILABLE', body.code === 'RATE_LIMITED' ? (options.locale === 'ar' ? 'محاولات كثيرة. حاول بعد قليل.' : 'Trop de demandes. Réessayez dans un moment.') : (options.locale === 'ar' ? 'تعذر إتمام التقدير. حاول مجدداً.' : 'L’estimation n’a pas pu aboutir. Veuillez réessayer.'));
    if (!Number.isFinite(body.estimated_price_mad) || body.estimated_price_mad <= 0) throw new Error(options.locale === 'ar' ? 'تعذر إتمام التقدير. حاول مجدداً.' : 'Réponse invalide du service.');
    return body;
  } catch (error) {
    if (timedOut) {
      throw new Error(options.locale === 'ar' ? 'انتهت مهلة التقدير. يرجى إعادة المحاولة.' : "Le délai d'estimation a été dépassé. Veuillez réessayer.");
    }
    if (error instanceof EstimationError) throw error;
    throw new Error(options.locale === 'ar' ? 'تعذر الاتصال بخدمة التقدير. حاول مجدداً.' : 'Connexion au service indisponible. Veuillez réessayer.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCasablancaContext(_payload: CasablancaPredictPayload, eventId?: string): Promise<CasablancaContextResponse> {
  if (!eventId) throw new Error('Optional Casablanca analysis unavailable');
  const response = await fetch(`/api/estimations/${eventId}/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Optional Casablanca analysis unavailable');
  return response.json();
}

/**
 * Fetch dynamic model metadata from the backend if available.
 * Returns null if the backend is not currently connected.
 */
export async function fetchModelMetadata(): Promise<{ model_version?: string; currency?: string } | null> {
  try {
    const res = await fetch('/api/metrics', {
      method: 'GET',
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      model_version: data.model_version,
      currency: data.currency,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch available cities from backend if online, otherwise null.
 */
export async function fetchApiCities(): Promise<string[] | null> {
  try {
    const res = await fetch('/api/villes', {
      method: 'GET',
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: CitiesResponse = await res.json();
    return data.villes || null;
  } catch {
    return null;
  }
}
