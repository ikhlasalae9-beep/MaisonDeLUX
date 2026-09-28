import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('account routes own one application shell, including estimation detail',()=>{
  const shell=readFileSync('components/layout/RouteShell.tsx','utf8');
  assert.match(shell,/const product = !auth && !account &&/);
  assert.match(shell,/publicShell = !auth && !account && !product/);
  const account=readFileSync('components/account/AccountShell.tsx','utf8');
  assert.match(account,/max-w-\[90rem\]/);
  assert.match(account,/Nouvelle estimation/);
  assert.match(account,/account-mobile-menu/);
  assert.doesNotMatch(account,/NAV_LINKS|data-site-navbar/);
});

test('account overview is real-data driven and exposes intentional journeys',()=>{
  const workspace=readFileSync('components/account/AccountWorkspace.tsx','utf8');
  assert.match(workspace,/data\.events\.slice\(0,3\)/);
  assert.match(workspace,/Vous n’avez encore aucune estimation enregistrée/);
  assert.match(workspace,/Vous n’avez encore enregistré aucun bien/);
  assert.match(workspace,/Aucun Passeport immobilier disponible pour le moment/);
  assert.match(workspace,/cities\/casablanca\/estimate/);
  assert.doesNotMatch(workspace,/fake|fixture|placeholder/i);
});

test('authenticated result and report keep customer follow-up actions',()=>{
  const result=readFileSync('components/estimation/CasablancaEstimateResult.tsx','utf8');
  const report=readFileSync('components/account/SavedPassport.tsx','utf8');
  assert.match(result,/Voir dans mon espace/);
  assert.match(result,/SavePropertyButton/);
  assert.match(report,/Nouvelle estimation/);
  assert.match(report,/Mes estimations/);
});

test('confirmed signup continues to its validated destination',()=>{
  const page=readFileSync('app/[locale]/auth/confirmed/page.tsx','utf8');
  const redirect=readFileSync('components/auth/PostAuthRedirect.tsx','utf8');
  assert.match(page,/flow==='email'.*PostAuthRedirect/);
  assert.match(redirect,/router\.replace\(destination\)/);
});
