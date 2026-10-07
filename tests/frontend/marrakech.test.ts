import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import CityPage, { generateMetadata } from '../../app/[locale]/cities/[citySlug]/page';
import MarketPage, { generateMetadata as marketMetadata } from '../../app/[locale]/cities/[citySlug]/market/page';
import sitemap from '../../app/sitemap';
import { getCityBySlug, cityCapabilityActions, publicEstimatePath, publicNavigationEstimation } from '../../lib/cities/registry';
import { getCityEditorial } from '../../config/city-editorial';
import { getCityMedia } from '../../config/city-media';
import { getCityContent } from '../../config/city-content';
import { CITY_MARKET_MAPS } from '../../config/city-market';
import { analyticsForCity } from '../../lib/analytics/registry';
import { getCityMapSummary } from '../../lib/analytics/market-map';
import { selectMarketBoundaries, projectMarketBoundaries } from '../../lib/analytics/market-geometry';
import { validateModelInput } from '../../lib/security/model-input';
import { PublicEstimationAction } from '../../components/city/PublicEstimationAction';

test('Marrakech publishes the shared FR/AR template and its own media, with certified estimation and no fabricated market services', () => {
  const city = getCityBySlug('marrakech')!;
  assert.equal(city.cityPage.publicVisible, true);
  assert.equal(city.cityPage.status, 'published');
  assert.equal(city.estimation.publicEnabled, true);
  assert.equal(city.estimation.backendStatusKey, 'marrakech');
  assert.equal(city.modelRef, 'marrakech');
  assert.throws(() => validateModelInput({ city: 'Marrakech' }), /INVALID_INPUT/);
  assert.equal(city.market.publicEnabled, false);
  assert.equal(city.market.analyticsRef, null);
  assert.deepEqual(cityCapabilityActions('fr', city).map(action => action.kind), ['estimate']);
  assert.equal(publicEstimatePath('fr', city, { city: 'Casablanca', status: 'available' }), null);
  for (const locale of ['fr','ar']) {
    const html = renderToStaticMarkup(CityPage({ params: { locale, citySlug: 'marrakech' } }));
    assert.ok(html.includes(getCityContent('marrakech', locale).title));
    assert.ok(html.includes('/media/cities/marrakech/marrakech-hero-web.mp4'));
    assert.ok(!html.includes('/media/cities/casablanca/'));
    assert.ok(!html.includes('/media/cities/rabat/'));
    assert.equal((html.match(/<figure/g) || []).length, 3);
    assert.equal((html.match(/<section/g) || []).length, 9);
    assert.ok(!html.includes('data-arrondissement'));
    const copy = getCityEditorial('marrakech', locale);
    assert.equal(copy.sections.length, 3);
    assert.equal(copy.sources.length, 3);
    assert.ok(html.includes(copy.sourcesTitle));
    assert.equal(generateMetadata({ params: { locale, citySlug: 'marrakech' } }).title, getCityContent('marrakech', locale).seo.title);
    const nav = publicNavigationEstimation(locale, `/${locale}/cities/marrakech`, 'Estimer mon bien');
    assert.equal(nav.href, `/${locale}/cities/marrakech/estimate`);
    const action = renderToStaticMarkup(React.createElement(PublicEstimationAction, { href: nav.href, children: nav.label }));
    assert.ok(action.includes('<a'));
    assert.ok(!action.includes('aria-disabled="true"'));
  }
  const media = getCityMedia('marrakech')!;
  assert.equal(media.gallery.length, 4);
  assert.equal(media.fallback, media.gallery[3].src);
  assert.equal(media.hero?.poster, null);
  assert.ok(sitemap().some(entry => entry.url.endsWith('/fr/cities/marrakech')));
  assert.ok(sitemap().some(entry => entry.url.endsWith('/fr/cities/marrakech/estimate')));
  assert.ok(sitemap().some(entry => entry.url.endsWith('/ar/cities/marrakech/estimate')));
  assert.ok(!sitemap().some(entry => entry.url.endsWith('/marrakech/market')));
});

test('Marrakech geographic market preparation cannot expose another city dataset or fake statistics', () => {
  assert.equal(analyticsForCity('marrakech'), null);
  assert.equal(getCityMapSummary('marrakech'), null);
  assert.deepEqual(CITY_MARKET_MAPS.marrakech.metrics, []);
  assert.deepEqual(CITY_MARKET_MAPS.marrakech.neighborhoodMapping, {});
  const source = JSON.parse(readFileSync('public/maps/marrakech-boundaries.geojson','utf8'));
  const selected = selectMarketBoundaries(source.features, '10');
  assert.equal(selected.length, 5);
  assert.equal(source.features.filter((f: any) => f.geometry.type === 'Point').length, 5);
  assert.deepEqual(selected.map(f => f.id).sort(), ['relation/2799527','relation/2799529','relation/2799533','relation/2799534','relation/2799537']);
  assert.ok(selected.every(f => f.geometry.type === 'Polygon' && f.properties['name:fr'] && f.properties['name:ar']));
  assert.ok(projectMarketBoundaries(selected).every(p => !/NaN|Infinity/.test(p.path)));
  for (const locale of ['fr','ar']) {
    const html = renderToStaticMarkup(MarketPage({ params: { locale, citySlug: 'marrakech' } }));
    assert.ok(html.includes(locale === 'ar' ? 'الإحصاءات قيد الإعداد' : 'Statistiques en préparation'));
    assert.ok(!html.includes('MAD/m²'));
    assert.ok(!html.includes('server-data/casablanca-market.csv'));
    assert.ok(!html.includes('<table'));
    assert.deepEqual(marketMetadata({ params: { locale, citySlug: 'marrakech' } }).robots, { index: false, follow: false });
  }
});

test('Casablanca and Rabat city/market body markup is identical to the pre-Marrakech audit', () => {
  const baseline = JSON.parse(readFileSync('reports/marrakech-reference-hashes.json','utf8'));
  const hash = (html: string) => createHash('sha256').update(html).digest('hex');
  for (const citySlug of ['casablanca','rabat']) for (const locale of ['fr','ar']) {
    assert.equal(hash(renderToStaticMarkup(CityPage({ params: { locale, citySlug } }))), baseline[`${citySlug}-city-${locale}`]);
    assert.equal(hash(renderToStaticMarkup(MarketPage({ params: { locale, citySlug } }))), baseline[`${citySlug}-market-${locale}`]);
  }
  assert.equal(publicNavigationEstimation('fr', '/fr/cities/casablanca', 'Estimer mon bien').href, '/fr/cities/casablanca/estimate');
  assert.equal(publicNavigationEstimation('fr', '/fr/cities/rabat', 'Estimer mon bien').href, null);
});


