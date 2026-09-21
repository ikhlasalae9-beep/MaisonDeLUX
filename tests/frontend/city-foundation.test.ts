import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { CITY_CONTENT } from '../../config/city-content';
import { CASABLANCA_EDITORIAL } from '../../config/casablanca-editorial';
import { CITY_MEDIA_CONFIG, EXCLUDED_CASABLANCA_MEDIA, LANDING_MEDIA_CONFIG, cityImageSource, getCityMedia } from '../../config/city-media';
import { CITY_REGISTRY } from '../../config/cities.config';
import {
  cityDetailPath,
  cityEstimatePath,
  cityIndexPath,
  legacyEstimationPath,
  publicCityPath,
  publicEstimatePath,
  resolveEstimationAvailability,
  searchCities,
} from '../../lib/cities/registry';

const publicAssetExists = (src: string) => existsSync(join(process.cwd(), 'public', src.replace(/^\//, '')));

test('the registry preserves 16 cities while only Casablanca is public', () => {
  assert.equal(CITY_REGISTRY.length, 16);
  assert.equal(new Set(CITY_REGISTRY.map((city) => city.slug)).size, 16);
  assert.deepEqual(CITY_REGISTRY.filter((city) => city.cityPage.publicVisible).map((city) => city.slug), ['casablanca']);
  assert.equal(CITY_REGISTRY.filter((city) => city.estimation.publicEnabled).map((city) => city.slug).join(','), 'casablanca');
});

test('Casablanca is the sole publicly enabled city model', () => {
  const casablanca = CITY_REGISTRY.find((city) => city.slug === 'casablanca');
  assert.ok(casablanca);
  assert.equal(casablanca.cityPage.status, 'published');
  assert.equal(casablanca.estimation.status, 'available');
  assert.equal(casablanca.estimation.backendStatusKey, 'casablanca');
  assert.equal(casablanca.contentRef, 'casablanca');
  assert.equal(casablanca.mediaRef, 'casablanca');
  assert.equal(casablanca.modelRef, 'casablanca');
  assert.equal(casablanca.seoRef, 'casablanca');
  assert.ok(CITY_CONTENT.casablanca.fr.title);
  assert.ok(CITY_CONTENT.casablanca.ar.title);

  const backendReady = { city: 'CASABLANCA', status: 'available' as const, modelVersion: 'v1' };
  assert.deepEqual(resolveEstimationAvailability(casablanca, backendReady), {
    publicAvailable: true,
    frontendStatus: 'available',
    backendStatus: 'available',
    reason: 'available',
  });
  assert.equal(publicEstimatePath('fr', casablanca, backendReady), '/fr/cities/casablanca/estimate');
  assert.equal(publicCityPath('fr', casablanca), '/fr/cities/casablanca');
});

test('other cities remain explicitly unavailable', () => {
  const otherCities = CITY_REGISTRY.filter((city) => city.slug !== 'casablanca');
  assert.ok(otherCities.every((city) => city.cityPage.status === 'hidden'));
  assert.ok(otherCities.every((city) => city.cityPage.publicVisible === false));
  assert.ok(otherCities.every((city) => city.estimation.status === 'unavailable'));
  assert.ok(otherCities.every((city) => city.estimation.backendStatusKey === null));
  assert.ok(otherCities.every((city) => city.modelRef === null));
  assert.ok(otherCities.every((city) => city.seoRef === null));
  assert.ok(otherCities.every((city) => publicCityPath('fr', city) === null));
});

test('future route helpers are deterministic while public routing stays closed', () => {
  assert.equal(cityIndexPath('fr'), '/fr/cities');
  assert.equal(cityDetailPath('ar', 'casablanca'), '/ar/cities/casablanca');
  assert.equal(cityEstimatePath('fr', 'casablanca'), '/fr/cities/casablanca/estimate');
  assert.equal(legacyEstimationPath('fr', 'Casablanca'), '/fr/estimation?ville=Casablanca');
});

test('city search handles accents and aliases', () => {
  assert.equal(searchCities('casa')[0]?.slug, 'casablanca');
  assert.equal(searchCities('tetouan')[0]?.slug, 'tetouan');
  assert.equal(searchCities('الدار البيضاء')[0]?.slug, 'casablanca');
});

test('every configured media path resolves to an existing public asset', () => {
  assert.ok(publicAssetExists(LANDING_MEDIA_CONFIG.hero.dark));
  assert.ok(publicAssetExists(LANDING_MEDIA_CONFIG.hero.light));
  assert.ok(publicAssetExists(LANDING_MEDIA_CONFIG.hero.darkPoster));
  assert.ok(publicAssetExists(LANDING_MEDIA_CONFIG.hero.lightPoster));

  for (const media of Object.values(CITY_MEDIA_CONFIG)) {
    assert.ok(publicAssetExists(media.fallback), `missing fallback: ${media.fallback}`);
    if (media.hero) {
      assert.ok(publicAssetExists(media.hero.src), `missing hero: ${media.hero.src}`);
      if (media.hero.poster) assert.ok(publicAssetExists(media.hero.poster), `missing poster: ${media.hero.poster}`);
    }
    for (const image of media.gallery) {
      assert.ok(publicAssetExists(image.src), `missing gallery image: ${image.src}`);
    }
  }

  const casablancaMedia = getCityMedia('casablanca');
  assert.ok(casablancaMedia);
  assert.equal(cityImageSource(casablancaMedia, 99), casablancaMedia.fallback);
  assert.equal(getCityMedia(null), null);
});

test('the Casablanca editorial is bilingual, sourced, and uses only reviewed media', () => {
  const casablancaMedia = getCityMedia('casablanca');
  assert.ok(casablancaMedia);
  assert.deepEqual(casablancaMedia.gallery.map((image) => image.id), ['casablanca-1', 'casablanca-2', 'casablanca-3']);
  assert.equal(EXCLUDED_CASABLANCA_MEDIA.length, 2);
  assert.ok(EXCLUDED_CASABLANCA_MEDIA.every((image) => !casablancaMedia.images.includes(image.src)));

  for (const locale of ['fr', 'ar'] as const) {
    const editorial = CASABLANCA_EDITORIAL[locale];
    assert.equal(editorial.sections.length, 3);
    assert.equal(editorial.captions.length, casablancaMedia.gallery.length);
    assert.equal(editorial.sources.length, 3);
    assert.ok(editorial.sources.every((source) => source.href.startsWith('https://')));
    assert.ok(editorial.methodologyNote.length > 80);
  }
});
