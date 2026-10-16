import React from 'react';
(globalThis as any).React=React;
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import CityEstimatePage from '../../app/[locale]/cities/[citySlug]/estimate/page';
import { CityEstimator } from '../../components/estimation/CasablancaEstimator';
import { CasablancaEstimateResult } from '../../components/estimation/CasablancaEstimateResult';
import { CompactHeader } from '../../components/layout/CompactHeader';
import { estimatorMetadata } from '../../lib/estimations/contracts';
import { estimatorFormInput } from '../../lib/estimations/form-input';
import { getDictionary } from '../../lib/i18n/getDictionary';
import { createPassportExportData } from '../../lib/account/passport-export';

test('Rabat shares the responsive FR/AR form with four raw numeric inputs and one derived Age',()=>{
  for(const locale of ['fr','ar']) {
    const copy=getDictionary(locale).phase3.estimate;
    const html=renderToStaticMarkup(React.createElement(CityEstimator,{locale,copy,metadata:estimatorMetadata('Rabat')}));
    assert.equal((html.match(/type="number"/g)||[]).length,4);
    assert.equal((html.match(/<select/g)||[]).length,3);
    assert.ok(html.includes('readonly=""'));assert.ok(!html.includes(copy.floor));
    for(const value of ['Agdal','Souissi','Hay Al Kora','Al Kamra','max="3000"','max="18"','max="14"','min="35"','sm:grid-cols-2','bg-background'])assert.ok(html.includes(value),value);
    assert.ok(!html.includes('Maârif'));assert.ok(!html.includes('Guéliz'));
    assert.ok(html.includes(locale==='ar'?'من 5 إلى 10 سنوات':'5-10 ans'));
    assert.ok(html.includes(locale==='ar'?'غير محدد':'Inconnu'));
    const page=renderToStaticMarkup(CityEstimatePage({params:{locale,citySlug:'rabat'}}));
    assert.ok(page.includes(locale==='ar'?'التقييم العقاري في الرباط':'Estimation immobilière à Rabat'));
    const header=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{push:()=>{}} as any},React.createElement(CompactHeader,{locale,variant:'product',citySlug:'rabat'})));
    assert.ok(header.includes(`/${locale}/cities/rabat`));assert.ok(header.includes(locale==='ar'?'العودة إلى الرباط':'Retour à Rabat'));
  }
});

test('the real submit builder derives exact age, maps only verified rare locations and rejects incompatible input',()=>{
  const form={property_type:'appartement',neighborhood:'Agdal',area:'110',rooms:'3',bedrooms:'2',bathrooms:'1',current_state:'5-10 ans',age:'999',floor:''};
  const input=estimatorFormInput('Rabat',form);
  assert.equal(input.age,7.5);assert.equal(Object.keys(input).length,9);assert.ok(!('floor' in input));
  assert.equal(estimatorFormInput('Rabat',{...form,neighborhood:'Al Kamra'}).neighborhood,'Autre');
  assert.equal(estimatorFormInput('Rabat',{...form,current_state:'Inconnu'}).age,15);
  for(const change of [{current_state:''},{neighborhood:'unknown'},{area:''},{rooms:'1.5'},{area:'3001'}])assert.throws(()=>estimatorFormInput('Rabat',{...form,...change}));
});

test('Rabat result and exports identify its own model in FR/AR without another city context',()=>{
  const input=estimatorFormInput('Rabat',{property_type:'maison',neighborhood:'Agdal',area:'110',rooms:'3',bedrooms:'2',bathrooms:'1',current_state:'5-10 ans'});
  const prediction={city:'Rabat' as const,estimated_price_mad:1885593,currency:'MAD',model_version:'rabat-random-forest-v1',comparables:[{neighborhood:'SHOULD-NOT-APPEAR'}] as any};
  for(const locale of ['fr','ar']) {
    const copy=getDictionary(locale).phase3.estimate;
    const html=renderToStaticMarkup(React.createElement(CasablancaEstimateResult,{completed:{prediction,inputFeatures:input,estimatedAt:'2026-10-16T12:00:00Z'},supported:estimatorMetadata('Rabat').supported,contextLoading:false,locale,copy,onEdit(){}}));
    assert.ok(html.includes(locale==='ar'?'الرباط':'Rabat'));assert.ok(html.includes('rabat-random-forest-v1'));
    assert.ok(!html.includes('Casablanca'));assert.ok(!html.includes('SHOULD-NOT-APPEAR'));
    const exported=createPassportExportData({created_at:'2026-10-16T12:00:00Z',estimated_price_mad:prediction.estimated_price_mad,input_features:input,prediction},locale);
    assert.equal(exported.city,locale==='ar'?'الرباط':'Rabat');assert.equal(exported.market,null);assert.deepEqual(exported.comparables,[]);
    assert.ok(exported.age?.includes(locale==='ar'?'سنة':'ans'));
  }
});
