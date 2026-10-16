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

test('shared city and market renderers preserve Casablanca markup outside the intentionally refined map and removed source badge in FR and AR', () => {
  for (const locale of ['fr', 'ar']) {
    assert.equal(hash(renderToStaticMarkup(CityPage({ params: { locale, citySlug: 'casablanca' } }))), baseline['city-' + locale]);
    const marketHtml = renderToStaticMarkup(React.createElement(CityMarketIntelligence, {
      data: getCasablancaMarketAnalytics(), locale, citySlug: 'casablanca', mapSummary: getCityMapSummary('casablanca'),
    }));
    assert.ok(!marketHtml.includes('Source : server-data/'));
    const mapBaseline = JSON.parse(readFileSync('reports/market-map-non-map-hashes.json', 'utf8'));
    let section = 0;
    const nonMap = marketHtml.replace(/<section\b[\s\S]*?<\/section>/g, part => section++ === 1 ? '<!-- market map -->' : part);
    assert.equal(hash(nonMap), mapBaseline[`casablanca-${locale}`]);
  }
});

test('Rabat market publishes its validated mixed cohort and reuses the shared price explorer in FR/AR', () => {
  for (const locale of ['fr', 'ar']) {
    const html = renderToStaticMarkup(MarketPage({ params: { locale, citySlug: 'rabat' } }));
    assert.ok(html.includes(locale === 'ar' ? 'ذكاء السوق — الرباط' : 'Intelligence du marché — Rabat'));
    assert.match(html,/700|٧٠٠/);
    assert.ok(html.includes('<table'));
    assert.ok(!html.includes('Source : server-data/'));
    assert.ok(!html.includes('CasablancaCity'));
    assert.ok(!html.includes('Commune de Marrakech'));
    assert.equal(generateMetadata({params:{locale,citySlug:'rabat'}}).robots,undefined);
    const map=renderToStaticMarkup(React.createElement(CityMarketMap,{summary:getCityMapSummary('rabat'),locale}));
    assert.ok(map.includes(locale==='ar'?'خريطة أسعار العقارات في الرباط':'Carte des prix immobiliers à Rabat'));
    assert.match(map,/125|١٢٥/);
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
  assert.equal(globalEstimationLabel('fr', '/fr/cities/rabat', 'Estimer mon bien'), 'Estimer mon bien');
  assert.equal(globalEstimationLabel('fr', '/fr/cities/casablanca', 'Estimer mon bien'), 'Estimer mon bien');
});
