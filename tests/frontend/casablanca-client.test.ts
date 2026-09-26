import assert from 'node:assert/strict';
import test from 'node:test';

import { predictCasablanca } from '../../lib/api/client';

const payload = {
  city: 'Casablanca',
  property_type: 'appartement',
  neighborhood: 'Maârif',
  area: 100,
  rooms: 3,
  bedrooms: 2,
  bathrooms: 2,
  floor: 4,
  current_state: 'Bon état',
  age: '10-20 ans',
};

test('each Casablanca prediction uses one fresh active abort signal', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const signals: AbortSignal[] = [];
  globalThis.fetch = async (_input, init) => {
    signals.push(init?.signal as AbortSignal);
    return new Response(JSON.stringify({
      estimated_price_mad: 1_217_911,
      currency: 'MAD',
      model_version: 'casablanca-catboost-v1',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await predictCasablanca(payload);
  await predictCasablanca(payload);

  assert.equal(signals.length, 2);
  assert.notEqual(signals[0], signals[1]);
  assert.equal(signals[0].aborted, false);
  assert.equal(signals[1].aborted, false);
});

test('a genuine prediction timeout is classified instead of exposing AbortError', async (context) => {
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });
  globalThis.setTimeout = ((handler: TimerHandler) => originalSetTimeout(handler, 0)) as typeof setTimeout;
  globalThis.fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
  });

  await assert.rejects(
    predictCasablanca(payload),
    { message: "Le délai d'estimation a été dépassé. Veuillez réessayer." },
  );
});
