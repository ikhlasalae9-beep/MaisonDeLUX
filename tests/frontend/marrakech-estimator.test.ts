import React from 'react';
(globalThis as any).React=React;
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CityEstimator } from '../../components/estimation/CasablancaEstimator';
import { estimatorMetadata } from '../../lib/estimations/contracts';
import { getDictionary } from '../../lib/i18n/getDictionary';
import CityEstimatePage from '../../app/[locale]/cities/[citySlug]/estimate/page';

test('prepared Marrakech form renders its exact FR/AR fields in the shared responsive theme',()=>{
  for(const locale of ['fr','ar']) {
    const copy=getDictionary(locale).phase3.estimate;
    const markup=renderToStaticMarkup(React.createElement(CityEstimator,{locale,copy,metadata:estimatorMetadata('Marrakech')}));
    assert.ok(markup.includes(copy.condition)); assert.ok(markup.includes(copy.age));
    assert.ok(!markup.includes(copy.floor));
    assert.equal((markup.match(/type="number"/g)||[]).length,4);
    assert.ok(markup.includes('min="15"'));
    assert.ok(markup.includes('Guéliz')); assert.ok(markup.includes('Route de Casablanca'));
    assert.ok(!markup.includes('Maârif'));
    assert.ok(markup.includes('sm:grid-cols-2')); assert.ok(markup.includes('bg-background'));
    assert.ok(!markup.includes(`${copy.condition} (${copy.optional})`));
    if(locale==='ar'){assert.ok(markup.includes('حالة جيدة'));assert.ok(markup.includes('أكثر من 10 سنوات'));}
    assert.throws(()=>CityEstimatePage({params:{locale,citySlug:'marrakech'}}),/NEXT_NOT_FOUND/);
  }
});
