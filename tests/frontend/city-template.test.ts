import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import CityPage from '../../app/[locale]/cities/[citySlug]/page';
import MarketPage, { generateMetadata } from '../../app/[locale]/cities/[citySlug]/market/page';
import { CityMarketIntelligence } from '../../components/market/CityMarketIntelligence';
import { CityMarketMap } from '../../components/market/CityMarketMap';
import { RABAT_EDITORIAL } from '../../config/rabat-editorial';
import { getCasablancaMarketAnalytics } from '../../lib/analytics/casablanca';
import { getCityMapSummary } from '../../lib/analytics/market-map';
import { globalEstimationLabel } from '../../lib/cities/registry';
import { CITY_MARKET_MAPS } from '../../config/city-market';

const baseline = JSON.parse(readFileSync('reports/rabat-reference-hashes.json', 'utf8'));
const hash = (html: string) => createHash('sha256').update(html).digest('hex');

test('shared city and market renderers preserve pre-refactor Casablanca markup exactly in FR and AR', () => {
  for (const locale of ['fr', 'ar']) {
    assert.equal(hash(renderToStaticMarkup(CityPage({ params: { locale, citySlug: 'casablanca' } }))), baseline['city-' + locale]);
    assert.equal(hash(renderToStaticMarkup(React.createElement(CityMarketIntelligence, {
      data: getCasablancaMarketAnalytics(), locale, citySlug: 'casablanca', mapSummary: getCityMapSummary('casablanca'),
    }))), baseline['market-' + locale]);
  }
});

test('Rabat market uses the shared renderer without fake data, prices, counts, classes or a public CTA', () => {
  for (const locale of ['fr', 'ar']) {
    const html = renderToStaticMarkup(MarketPage({ params: { locale, citySlug: 'rabat' } }));
    assert.ok(html.includes(locale === 'ar' ? 'الإحصاءات قيد الإعداد' : 'Statistiques en préparation'));
    assert.ok(!html.includes('server-data/casablanca-market.csv'));
    assert.ok(!html.includes('MAD/m²'));
    assert.ok(!html.includes('<table'));
    assert.ok(!html.includes('CasablancaCity'));
    assert.deepEqual(generateMetadata({ params: { locale, citySlug: 'rabat' } }).robots, { index: false, follow: false });
    const map = renderToStaticMarkup(React.createElement(CityMarketMap, { geography: CITY_MARKET_MAPS.rabat, locale }));
    assert.ok(map.includes(locale === 'ar' ? 'مقاطعات الرباط' : 'Arrondissements de Rabat'));
    assert.ok(!map.includes('268'));
  }
});

test('Rabat article supplies the same three narrative slots, five neighborhoods, six factors and sourced bilingual copy', () => {
  for (const copy of Object.values(RABAT_EDITORIAL)) {
    assert.equal(copy.sections.length, 3);
    assert.equal(copy.neighborhoods.length, 5);
    assert.equal(copy.factors.length, 6);
    assert.equal(copy.sources.length, 3);
    assert.deepEqual(copy.sections.map(section => section.imageIndex), [1, 0, 2]);
    assert.ok(copy.sources.every(source => source.note && source.href.startsWith('https://')));
  }
  assert.equal(globalEstimationLabel('fr', '/fr/cities/rabat', 'Estimer mon bien'), 'Estimation bientôt disponible');
  assert.equal(globalEstimationLabel('fr', '/fr/cities/casablanca', 'Estimer mon bien'), 'Estimer mon bien');
});
