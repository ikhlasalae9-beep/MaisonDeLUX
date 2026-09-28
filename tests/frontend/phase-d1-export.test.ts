import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createPassportExportData,passportExportFilename,safeFilenameSegment } from '../../lib/account/passport-export';

const source:any={created_at:'2026-09-27T10:00:00.000Z',estimated_price_mad:4330075,model_version:'casablanca-catboost-v1',user_id:'must-not-export',email:'private@example.test',input_features:{neighborhood:'Aïn Chock / Centre',property_type:'Appartements',area:244,rooms:5,bedrooms:3,bathrooms:2,floor:4,current_state:'Bon état',age:'10-20 ans'},context:{market_context:{benchmark_eligible:true,neighborhood:'Aïn Chock',listing_count:12,median_listing_price_per_m2:16000,minimum_observations:8},comparables:[{neighborhood:'Aïn Chock',property_type:'Appartements',area:240,rooms:5,bedrooms:3,listing_price_mad:4200000,same_neighborhood:true,area_difference_m2:4}]}};

test('export data copies only trusted Passport fields and conditionally includes reliable context',()=>{
  const data=createPassportExportData(source,'fr');
  assert.equal(data.estimatedValue,4330075);assert.equal(data.area,244);assert.equal(data.neighborhood,'Aïn Chock / Centre');assert.equal(data.market?.listingCount,12);assert.equal(data.comparables.length,1);
  assert.equal('email' in data,false);assert.equal('user_id' in data,false);assert.equal('modelVersion' in data,false);assert.equal('minimum_observations' in (data.market||{}),false);
  const unavailable=createPassportExportData({...source,context:{market_context:{...source.context.market_context,benchmark_eligible:false}}},'fr');
  assert.equal(unavailable.market,null);
});

test('Arabic export data localizes customer labels while keeping real numeric values',()=>{
  const data=createPassportExportData(source,'ar');
  assert.equal(data.rtl,true);assert.equal(data.propertyType,'شقة');assert.equal(data.condition,'حالة جيدة');assert.equal(data.estimatedValue,4330075);assert.equal(data.area,244);
});

test('download filenames are sanitized and contain no account identifiers',()=>{
  const data=createPassportExportData(source,'fr');
  assert.equal(safeFilenameSegment('Aïn Chock / Centre'),'Ain-Chock-Centre');
  assert.equal(passportExportFilename('Carte',data,'png'),'MaisonDeLUX-Carte-Casablanca-Ain-Chock-Centre-2026-09-27.png');
  assert.equal(passportExportFilename('Passeport',data,'pdf'),'MaisonDeLUX-Passeport-Casablanca-Ain-Chock-Centre-2026-09-27.pdf');
});

test('PNG and PDF exports are browser-native, fixed-size and lazy-load pdf-lib',()=>{
  const renderer=readFileSync('lib/account/passport-export.ts','utf8'),boundary=readFileSync('components/account/PassportExportActions.tsx','utf8'),actions=readFileSync('components/account/PassportExportActionsClient.tsx','utf8');
  assert.match(renderer,/width:1080,height:1350/);assert.match(renderer,/canvas\.toBlob/);assert.match(renderer,/image\/png/);
  assert.match(renderer,/await import\('pdf-lib'\)/);assert.match(renderer,/\[595\.28,841\.89\]/);assert.match(renderer,/document\.fonts\.ready/);
  assert.doesNotMatch(renderer,/Version du modèle|إصدار النموذج|modelVersion/);
  assert.match(renderer,/Estimation indicative produite par un modèle immobilier spécifique à Casablanca\. Le contexte des annonces est présenté séparément et n’influence pas directement l’estimation affichée\./);
  assert.match(renderer,/تقدير إرشادي ناتج عن نموذج عقاري مخصص لمدينة الدار البيضاء\. يتم عرض سياق الإعلانات بشكل منفصل ولا يؤثر مباشرة على القيمة التقديرية المعروضة\./);
  assert.match(boundary,/ssr:false/);assert.doesNotMatch(renderer,/puppeteer|playwright|chromium|html2canvas|external/i);assert.doesNotMatch(actions,/window\.print/);
});

test('export actions remain downstream of the authenticated owned-Passport lookup',()=>{
  const passport=readFileSync('components/account/SavedPassport.tsx','utf8'),route=readFileSync('app/api/account/estimations/[id]/route.ts','utf8');
  assert.match(passport,/fetch\(`\/api\/account\/estimations\/\$\{id\}`/);assert.match(passport,/<PassportExportActions event=\{event\}/);
  assert.match(route,/accountIdentity\(\)/);assert.match(route,/ownedPassport\(params\.id\)/);
  assert.doesNotMatch(route,/public|share|service.role/i);
});

test('PDF and PNG renderers enforce the approved safe areas and readable hierarchy',()=>{
  const renderer=readFileSync('lib/account/passport-export.ts','utf8');
  assert.match(renderer,/CARD_MARGIN=70/);assert.match(renderer,/PAGE_MARGIN_X=112/);assert.match(renderer,/PAGE_MARGIN_TOP=100/);assert.match(renderer,/PAGE_MARGIN_BOTTOM=100/);
  assert.match(renderer,/PANEL_INNER_PADDING=42/);assert.match(renderer,/panelRight-PANEL_INNER_PADDING/);assert.match(renderer,/PAGE_CONTENT_WIDTH/);
  assert.match(renderer,/pdfFooter\(ctx,data,1\)/);assert.match(renderer,/pdfFooter\(ctx,data,2\)/);assert.match(renderer,/maxWidth\?:number/);
});

test('Arabic PNG is a deliberate RTL mirror with a stable customer-facing date',()=>{
  const renderer=readFileSync('lib/account/passport-export.ts','utf8');
  assert.match(renderer,/if\(data\.rtl\)/);assert.match(renderer,/text\(ctx,'جواز عقاري',x,390,40/);assert.match(renderer,/text\(ctx,'تقدير إرشادي',x,1140,34/);
  assert.match(renderer,/arabicCardDate\(ctx,data,x,1204,32/);assert.match(renderer,/formatToParts\(date\)/);assert.match(renderer,/tokens=\[value\('day'\),value\('month'\),value\('year'\)\]/);
  assert.match(renderer,/text\(ctx,'PASSEPORT IMMOBILIER',x,360,36/);assert.match(renderer,/text\(ctx,'Estimation indicative',x,1110,31/);
});
