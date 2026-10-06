import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import CitiesPage from '../../app/[locale]/cities/page';
import sitemap from '../../app/sitemap';
import CityPage, { generateMetadata } from '../../app/[locale]/cities/[citySlug]/page';
import { getCityContent } from '../../config/city-content';
import { getCityMedia } from '../../config/city-media';
import { CITY_MARKET_MAPS } from '../../config/city-market';
import { getCityBySlug, cityCapabilityActions, publicEstimatePath } from '../../lib/cities/registry';
import { analyticsForCity } from '../../lib/analytics/registry';
import { getCityMapSummary } from '../../lib/analytics/market-map';
import { selectMarketBoundaries, projectMarketBoundaries } from '../../lib/analytics/market-geometry';

test('Rabat is public, bilingual, and has no estimator or analytics provider', () => {
  assert.ok(renderToStaticMarkup(CitiesPage({ params: { locale: 'fr' } })).includes('/fr/cities/rabat'));
  assert.ok(sitemap().some(entry => entry.url.endsWith('/fr/cities/rabat')));
  assert.ok(!sitemap().some(entry => entry.url.endsWith('/rabat/estimate') || entry.url.endsWith('/rabat/market')));
  const city = getCityBySlug('rabat')!;
  assert.equal(city.cityPage.publicVisible, true);
  assert.equal(city.estimation.publicEnabled, false);
  assert.equal(city.modelRef, null);
  assert.equal(city.estimation.backendStatusKey, null);
  assert.equal(city.market.publicEnabled, false);
  assert.equal(city.market.analyticsRef, null);
  assert.deepEqual(cityCapabilityActions('fr', city), []);
  assert.equal(publicEstimatePath('fr', city, { city: 'Casablanca', status: 'available' }), null);
  assert.equal(analyticsForCity('rabat'), null);
  assert.equal(getCityMapSummary('rabat'), null);
  assert.deepEqual(CITY_MARKET_MAPS.rabat.neighborhoodMapping, {});
  assert.deepEqual(CITY_MARKET_MAPS.rabat.metrics, []);
  for (const locale of ['fr', 'ar']) {
    const copy = getCityContent('rabat', locale);
    assert.equal(copy.neighborhoods.length, 5);
    assert.equal(copy.imageDescriptions.length, 4);
    const html = renderToStaticMarkup(CityPage({ params: { locale, citySlug: 'rabat' } }));
    assert.ok(html.includes(copy.title));
    assert.ok(html.includes(copy.estimationCta));
    assert.ok(!html.includes('/rabat/estimate'));
    assert.ok(!html.includes('/rabat/market'));
    assert.equal((html.match(/fill-rule="evenodd"/g) || []).length, 0);
    assert.ok(html.includes(locale === 'ar' ? 'المصادر التحريرية' : 'Sources éditoriales'));
    assert.ok(html.includes('https://whc.unesco.org/en/list/1401/'));
    assert.ok(html.includes('https://cnes.fr/geoimage/rabat-sale-metropole-capitale-maroc'));
    assert.equal((html.match(/<figure/g) || []).length, 3);
    assert.ok(html.includes(locale === 'ar' ? 'استكشف الخدمات المتاحة' : 'Explorez les services disponibles'));
    assert.ok(!html.includes('/casablanca/estimate'));
    assert.ok(html.includes('rabat-hero-web.mp4') || html.includes('preload="none"'));
    assert.equal(generateMetadata({ params: { locale, citySlug: 'rabat' } }).title, copy.seo.title);
  }
  const media = getCityMedia('rabat')!;
  assert.equal(media.gallery.length, 4);
  assert.equal(media.hero?.poster, null);
  assert.equal(media.fallback, media.gallery[3].src);
  assert.ok(media.gallery.every(asset => asset.alt.fr && asset.alt.ar));
});

test('Rabat geometry preserves five real administrative shapes and ignores five points', () => {
  const source = JSON.parse(readFileSync('public/maps/rabat-boundaries.geojson', 'utf8'));
  const boundaries = selectMarketBoundaries(source.features, '10');
  assert.equal(boundaries.length, 5);
  assert.equal(source.features.filter((f: any) => f.geometry.type === 'Point').length, 5);
  assert.deepEqual(boundaries.map(f => f.id).sort(), ['relation/2799203', 'relation/2799204', 'relation/2799211', 'relation/2799212', 'relation/4743369']);
  assert.equal(boundaries.filter(f => f.geometry.type === 'MultiPolygon').length, 1);
  assert.ok(boundaries.every(f => f.properties['name:fr'] && f.properties['name:ar'] && f.properties['ref:MA:HCP']));
  assert.ok(projectMarketBoundaries(boundaries).every(p => !/NaN|Infinity/.test(p.path)));
});

