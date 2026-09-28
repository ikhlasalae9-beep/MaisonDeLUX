import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ageLabel,conditionLabel,propertyTypeLabel } from '../../lib/account/presentation';
import { customerContext } from '../../lib/estimations/customer-context';

test('Passport is the sole saved-result concept in customer navigation',()=>{
  const shell=readFileSync('components/account/AccountShell.tsx','utf8');
  assert.match(shell,/Mes Passeports/);
  assert.doesNotMatch(shell,/Mes estimations|تقديراتي/);
  const page=readFileSync('app/[locale]/account/[[...section]]/page.tsx','utf8');
  assert.match(page,/section\[0\]==='estimations'.*redirect/);
  assert.match(page,/account\/passports/);
});

test('Passport report removes the causal simulator and hides internal market thresholds',()=>{
  const result=readFileSync('components/estimation/CasablancaEstimateResult.tsx','utf8');
  assert.doesNotMatch(result,/function Simulator|simulate|minimum_observations|insufficientNeighborhoodData|closestComparable/);
  assert.match(result,/Ces données n’influencent pas l’estimation affichée/);
  assert.match(result,/Prix affichés dans les annonces, et non prix de transaction/);
  assert.match(result,/Transparence du modèle/);
  const context=customerContext({market_context:{benchmark_eligible:false,listing_count:6,minimum_observations:8}}) as any;
  assert.equal('minimum_observations' in context.market_context,false);
});

test('comparison is restricted to two or three owned Passport selections',()=>{
  const route=readFileSync('app/api/account/compare/route.ts','utf8');
  assert.match(route,/body\.items\.length>3/);
  assert.match(route,/item\.kind!=='passport'/);
  assert.match(route,/\.eq\('user_id',user\.id\)/);
  assert.doesNotMatch(route,/saved_properties/);
});

test('Arabic customer values use translated categories and bidi isolation',()=>{
  assert.equal(propertyTypeLabel('Appartements','ar'),'شقة');
  assert.equal(propertyTypeLabel('Villas','ar'),'فيلا');
  assert.equal(conditionLabel('Bon état','ar'),'حالة جيدة');
  assert.equal(ageLabel('10-20 ans','ar'),'من 10 إلى 20 سنة');
  for(const file of ['components/account/AccountWorkspace.tsx','components/estimation/CasablancaEstimateResult.tsx'])assert.match(readFileSync(file,'utf8'),/<bdi dir="ltr"/);
});

test('Passport exports are lightweight, private-data free and print optimized',()=>{
  const actions=readFileSync('components/account/PassportExportActions.tsx','utf8')+readFileSync('components/account/PassportExportActionsClient.tsx','utf8');
  const renderer=readFileSync('lib/account/passport-export.ts','utf8');
  const css=readFileSync('app/globals.css','utf8');
  assert.doesNotMatch(actions,/window\.print\(\)/);
  assert.match(renderer,/image\/png/);
  assert.match(renderer,/import\('pdf-lib'\)/);
  assert.match(renderer,/application\/pdf/);
  assert.match(renderer,/\/brand\/logo\/maisondelux-logo-white\.png/);
  assert.doesNotMatch(actions,/user_id|owner_id|email|password|supabase/i);
  assert.match(css,/@page[\s\S]*size: A4/);
  assert.match(css,/@media print/);
});
