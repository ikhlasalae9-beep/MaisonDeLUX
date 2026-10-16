/** Shared by the dashboard and isolated pipeline tests; never substitutes empty data on failure. */
export function formatAdminReadTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Indisponible';
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(date);
}

export const ADMIN_READ_TIMEOUT_MS = 20_000;
export async function readAdminJson(url: string, signal: AbortSignal, transport: typeof fetch = fetch,
  timeoutMs = ADMIN_READ_TIMEOUT_MS) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  else signal.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await transport(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('ADMIN_READ_FAILED');
    return await response.json();
  } catch (error) {
    if (timedOut) throw new Error('ADMIN_READ_TIMEOUT');
    throw error;
  } finally {
    clearTimeout(timer); signal.removeEventListener('abort', cancel);
  }
}

export async function readAdminSnapshot(filters: {
  period: string; cityId: string; modelId: string; includeTests: boolean; page: number; search: string;
}, signal: AbortSignal, transport: typeof fetch = fetch) {
  const query = new URLSearchParams({ period: filters.period, cityId: filters.cityId,
    modelId: filters.modelId, includeTests: String(filters.includeTests) });
  const [overview, estimations] = await Promise.all([
    readAdminJson(`/api/admin/overview?${query}`, signal, transport),
    readAdminJson(`/api/admin/estimations?${query}&page=${filters.page}&search=${encodeURIComponent(filters.search)}`, signal, transport),
  ]);
  if (!overview.configured || !estimations.configured) throw new Error('ADMIN_DATABASE_UNAVAILABLE');
  const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!count(overview.kpis?.total) || !count(estimations.total) || !Array.isArray(estimations.rows) ||
      !['registered_cities','registered_models','cities_with_models','public_models','recorded_estimations']
        .every(key => count(overview.platform?.[key])) || !Number.isFinite(Date.parse(overview.readAt))) {
    throw new Error('ADMIN_INVALID_SNAPSHOT');
  }
  return { overview, estimations };
}

/** Data from a previous filter or a failed refresh must never masquerade as a current result. */
export function currentAdminData<T extends { configured?: boolean; scopeKey?: string }>(
  snapshot: T | null, scopeKey: string, error: string,
): T | null {
  return !error && snapshot?.configured === true && snapshot.scopeKey === scopeKey ? snapshot : null;
}
