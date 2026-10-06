import React from 'react';
(globalThis as any).React = React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import CityPage from '../../app/[locale]/cities/[citySlug]/page';
import { getCityMedia } from '../../config/city-media';

test('all city videos use Casablanca source attachment and autoplay defaults, independent of estimation capability', () => {
  const videoMarkup: string[] = [];
  for (const citySlug of ['casablanca', 'rabat', 'marrakech'] as const) {
    const media = getCityMedia(citySlug)!;
    const html = renderToStaticMarkup(CityPage({ params: { locale: 'fr', citySlug } }));
    const video = html.match(/<video\b[^>]*>[\s\S]*?<\/video>/)?.[0];
    assert.ok(video);
    assert.ok(video.includes(`src="${media.hero!.src}"`));
    assert.ok(video.includes('type="video/mp4"'));
    assert.ok(video.includes('autoplay=""'));
    assert.ok(video.includes('muted=""'));
    assert.ok(video.includes('playsinline=""'));
    assert.ok(video.includes('preload="metadata"'));
    assert.ok(!video.includes('controls'));
    videoMarkup.push(video.replace(media.hero!.src, '<city-video>'));
  }
  assert.equal(videoMarkup[0], videoMarkup[1]);
  assert.equal(videoMarkup[0], videoMarkup[2]);
});

