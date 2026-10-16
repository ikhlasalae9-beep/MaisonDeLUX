import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarketMapExplorer } from '../../components/market/MarketMapExplorer';
import { selectMarketBoundaries, projectMarketBoundaries } from '../../lib/analytics/market-geometry';
import { getCityMapSummary } from '../../lib/analytics/market-map';

test('Marrakech prices use verified medians and neutral unmatched areas, in FR and AR', () => {
  const source = JSON.parse(readFileSync('public/maps/marrakech-boundaries.geojson', 'utf8'));
  const outlines = projectMarketBoundaries(selectMarketBoundaries(source.features, '10'));
  for (const locale of ['fr', 'ar']) {
    const html = renderToStaticMarkup(React.createElement(MarketMapExplorer, { summary: getCityMapSummary('marrakech'), locale, cityName: 'Marrakech', outlines, selected: 'relation/2799533', hovered: 'relation/2799537', error: false, onSelect() {}, onHover() {} }));
    assert.equal(new Set(Array.from(html.matchAll(/data-arrondissement="[^"]+"[^>]+ fill="([^"]+)"/g)).map(match => match[1])).size, 3);
    assert.ok(html.includes('data-map-state="selected"'));
    assert.ok(html.includes('data-map-state="hovered"'));
    assert.ok(html.includes(locale === 'ar' ? 'إسناد حسب أسماء الأحياء' : 'Attribution par quartier'));
    assert.ok(html.includes(locale === 'ar' ? 'تغطية محدودة' : 'Couverture limitée'));
    assert.ok(html.includes(locale === 'ar' ? '9.239 درهم/م²' : '9 239 MAD/m²'));
    assert.ok(!html.includes('relation/2799537</bdi>'));
  }
});

test('Casablanca retains real quantile boundaries and medians, with a separate patterned unavailable state', () => {
  const summary = getCityMapSummary('casablanca')!;
  const source = JSON.parse(readFileSync('public/maps/casablanca-boundaries.geojson', 'utf8'));
  const outlines = projectMarketBoundaries(selectMarketBoundaries(source.features, '10'));
  const original = JSON.stringify(summary);
  const html = renderToStaticMarkup(React.createElement(MarketMapExplorer, { summary, locale: 'fr', cityName: 'Casablanca', outlines, selected: '', hovered: '', error: false, onSelect() {}, onHover() {} }));
  assert.ok(html.includes('18 000 MAD/m²'));
  assert.ok(html.includes('Couverture limitée'));
  assert.ok(html.includes('Prix affichés, et non prix de transaction'));
  assert.ok(html.includes('fill="url(#map-unavailable-'));
  assert.equal(new Set(Array.from(html.matchAll(/data-arrondissement="[^"]+"[^>]+ fill="(#[^"]+)"/g)).map(match => match[1])).size, summary.bins.length);
  assert.equal(JSON.stringify(summary), original);
});

test('Marrakech map failure fallback remains neutral and keeps technical metadata secondary', () => {
  const source = JSON.parse(readFileSync('public/maps/marrakech-boundaries.geojson', 'utf8'));
  const outlines = projectMarketBoundaries(selectMarketBoundaries(source.features, '10'));
  const html = renderToStaticMarkup(React.createElement(MarketMapExplorer, { locale: 'fr', cityName: 'Marrakech', outlines, selected: outlines[0].feature.id, hovered: '', error: false, onSelect() {}, onHover() {} }));
  assert.ok(Array.from(html.matchAll(/data-arrondissement="[^"]+"[^>]+ fill="([^"]+)"/g)).every(match => match[1].startsWith('url(#')));
  assert.ok(html.includes('Contours administratifs · prix indisponibles'));
  assert.ok(html.includes('Non disponible'));
  assert.ok(!html.includes('MAD/m²'));
  assert.ok(/<details[^>]*>[\s\S]*Identifiant OpenStreetMap[\s\S]*<\/details>/.test(html));
});
