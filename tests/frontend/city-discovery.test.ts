import React from 'react';
(globalThis as any).React = React;
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandingCityPreview } from '../../components/landing/NationalLandingSections';
import CitiesPage from '../../app/[locale]/cities/page';
import { getDictionary } from '../../lib/i18n/getDictionary';
import { getPublicCities, cityCapabilityActions, publicNavigationEstimation } from '../../lib/cities/registry';

test('both discovery surfaces share all published city cards, capability flags and image-only media in FR/AR', () => {
  const cities = getPublicCities();
  assert.deepEqual(cities.map(city => city.slug), ['casablanca', 'rabat', 'marrakech']);
  for (const locale of ['fr', 'ar']) {
    const dict = getDictionary(locale);
    for (const html of [renderToStaticMarkup(React.createElement(LandingCityPreview, { locale, dict })), renderToStaticMarkup(CitiesPage({ params: { locale } }))]) {
      assert.deepEqual(Array.from(html.matchAll(/data-city-card="([^"]+)"/g), match => match[1]), cities.map(city => city.slug));
      assert.equal((html.match(/data-city-grid/g) ?? []).length, 1);
      assert.equal((html.match(/aspect-\[16\/10\]/g) ?? []).length, 3);
      assert.equal((html.match(new RegExp(dict.phase3.cities.available, 'g')) ?? []).length >= 1, true);
      assert.ok(!html.includes('<video') && !html.includes('.mp4') && !html.includes('/api/ml/metadata'));
      assert.ok(!html.includes('lg:grid-cols-[1.08fr_.92fr]'));
      for (const city of cities) {
        assert.ok(html.includes(encodeURIComponent(`/media/cities/${city.slug}/`)));
        assert.ok(html.includes(locale === 'ar' ? city.regionAr : city.regionFr));
        assert.equal(cityCapabilityActions(locale, city).some(action => action.kind === 'estimate'), city.estimation.publicEnabled);
        assert.equal(Boolean(publicNavigationEstimation(locale, `/${locale}/cities/${city.slug}`, 'Estimate').href), city.estimation.publicEnabled);
      }
    }
  }
});
