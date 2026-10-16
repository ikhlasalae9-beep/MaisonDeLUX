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
import { MarrakechMarketIntelligence } from '../../components/market/MarrakechMarketIntelligence';

test('Marrakech publishes the shared FR/AR template and its own media, with certified estimation and no fabricated market services', () => {
  const city = getCityBySlug('marrakech')!;
  assert.equal(city.cityPage.publicVisible, true);
  assert.equal(city.cityPage.status, 'published');
  assert.equal(city.estimation.publicEnabled, true);
  assert.equal(city.estimation.backendStatusKey, 'marrakech');
  assert.equal(city.modelRef, 'marrakech');
  assert.throws(() => validateModelInput({ city: 'Marrakech' }), /INVALID_INPUT/);
  assert.equal(city.market.publicEnabled, true);
  assert.equal(city.market.analyticsRef, 'marrakech');
  assert.deepEqual(cityCapabilityActions('fr', city).map(action => action.kind), ['estimate', 'market']);
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
  assert.ok(sitemap().some(entry => entry.url.endsWith('/fr/cities/marrakech/market')));
  assert.ok(sitemap().some(entry => entry.url.endsWith('/ar/cities/marrakech/market')));
});

test('Marrakech publishes its own apartment analytics without inventing geographic price mappings', () => {
  assert.equal(analyticsForCity('marrakech')?.market()?.city, 'Marrakech');
  assert.equal(getCityMapSummary('marrakech')?.mappedListings, 716);
  assert.deepEqual(CITY_MARKET_MAPS.marrakech.metrics, ['medianPricePerM2', 'listingCount', 'medianArea']);
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
    assert.ok(html.includes(locale === 'ar' ? 'شقق للبيع' : 'Appartements à vendre'));
    assert.ok(!html.includes(locale === 'ar' ? 'المصدر والمنهجية' : 'Source et méthode'));
    assert.ok(!html.includes('Source : server-data/'));
    const mapBaseline = JSON.parse(readFileSync('reports/market-map-non-map-hashes.json', 'utf8'));
    let section = 0;
    const nonMap = html.replace(/<section\b[\s\S]*?<\/section>/g, part => section++ === 1 ? '<!-- market map -->' : part);
    assert.equal(createHash('sha256').update(nonMap).digest('hex'), mapBaseline[`marrakech-${locale}`]);
    assert.equal((html.match(/<section/g) || []).length, 5);
    assert.ok(html.includes(locale === 'ar' ? 'وليست أسعار معاملات مؤكدة' : 'non des prix de transaction confirmés'));
    assert.ok(!html.includes('server-data/casablanca-market.csv'));
    assert.ok(html.includes('<table'));
    assert.ok(html.includes(locale === 'ar' ? 'الأحياء الأكثر تمثيلاً' : 'Quartiers les plus représentés'));
    assert.ok(html.indexOf(locale === 'ar' ? 'خريطة أسعار العقارات في مراكش' : 'Carte des prix immobiliers à Marrakech') < html.indexOf(locale === 'ar' ? 'بنية البيانات المرجعية' : 'Structure du référentiel'));
    assert.ok(!html.includes(locale === 'ar' ? 'الاطلاع على قواعد الاختيار والحساب والحدود' : 'Consulter les règles de sélection, les calculs et les limites'));
    assert.ok(html.includes(locale === 'ar' ? 'عرض القيم في جداول' : 'Voir les valeurs en tableaux'));
    assert.equal(marketMetadata({ params: { locale, citySlug: 'marrakech' } }).robots, undefined);
    assert.equal(marketMetadata({ params: { locale, citySlug: 'marrakech' } }).alternates?.canonical, `https://www.maison-delux.com/${locale}/cities/marrakech/market`);
  }
});

test('Marrakech unavailable data state is localized and contains no fabricated KPIs', () => {
  for (const locale of ['fr', 'ar']) {
    const html = renderToStaticMarkup(React.createElement(MarrakechMarketIntelligence, { data: null, locale }));
    assert.ok(html.includes(locale === 'ar' ? 'البيانات غير متاحة حالياً' : 'Données momentanément indisponibles'));
    assert.ok(!html.includes('<table'));
    assert.ok(!html.includes('1 470 000'));
  }
  for (const citySlug of ['missing-city', 'marrakech']) {
    assert.throws(() => MarketPage({ params: { locale: 'invalid', citySlug } }), /NEXT_NOT_FOUND/);
  }
});

test('Casablanca and Rabat body markup preserves the baseline outside the intentional Casablanca map and source badge changes', () => {
  const baseline = JSON.parse(readFileSync('reports/marrakech-reference-hashes.json','utf8'));
  const hash = (html: string) => createHash('sha256').update(html).digest('hex');
  for (const citySlug of ['casablanca','rabat']) for (const locale of ['fr','ar']) {
    if (citySlug === 'casablanca') assert.equal(hash(renderToStaticMarkup(CityPage({ params: { locale, citySlug } }))), baseline[`${citySlug}-city-${locale}`]);
    else assert.ok(renderToStaticMarkup(CityPage({ params: { locale, citySlug } })).includes('/rabat/estimate'));
    const marketHtml = renderToStaticMarkup(MarketPage({ params: { locale, citySlug } }));
    if (citySlug === 'casablanca') {
      assert.ok(!marketHtml.includes('Source : server-data/'));
      const mapBaseline = JSON.parse(readFileSync('reports/market-map-non-map-hashes.json', 'utf8'));
      let section = 0;
      const nonMap = marketHtml.replace(/<section\b[\s\S]*?<\/section>/g, part => section++ === 1 ? '<!-- market map -->' : part);
      assert.equal(hash(nonMap), mapBaseline[`casablanca-${locale}`]);
    }
    if (citySlug === 'rabat') assert.equal(hash(marketHtml), baseline[`${citySlug}-market-${locale}`]);
  }
  assert.equal(publicNavigationEstimation('fr', '/fr/cities/casablanca', 'Estimer mon bien').href, '/fr/cities/casablanca/estimate');
  assert.equal(publicNavigationEstimation('fr', '/fr/cities/rabat', 'Estimer mon bien').href, '/fr/cities/rabat/estimate');
});


