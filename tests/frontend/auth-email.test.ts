import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const templates=['confirm-signup','password-recovery','change-email','reauthentication-reference'];

test('auth email sources are bilingual, responsive, first-party and contain no raw OTP',()=>{
  for(const name of templates){
    const html=readFileSync(`docs/auth-email-templates/${name}.html`,'utf8');
    assert.match(html,/Maison<span/);assert.match(html,/preferred_locale/);assert.match(html,/dir=/);assert.match(html,/@media\(max-width:600px\)/);
    assert.doesNotMatch(html,/Powered by Supabase|supabase\.co/i);assert.doesNotMatch(html,/{{\s*\.Token\s*}}/);
    assert.match(html,/MaisonDeLUX · Communication de sécurité automatique/);
  }
  for(const name of ['confirm-signup','password-recovery','change-email']){
    const html=readFileSync(`docs/auth-email-templates/${name}.html`,'utf8');
    assert.match(html,/\/auth\/confirm\?token_hash={{ \.TokenHash }}/);
  }
});

test('manual setup documents sender, SMTP names, URL configuration and DNS categories without credentials',()=>{
  const setup=readFileSync('docs/auth-email-setup.md','utf8');
  for(const value of ['no-reply@auth.maison-delux.com','SMTP_HOST','SMTP_PORT','SMTP_USERNAME','SMTP_PASSWORD','SMTP_SENDER_ADDRESS','SMTP_SENDER_NAME','SPF','DKIM','DMARC','https://maison-delux.com'])assert.match(setup,new RegExp(value));
  assert.match(setup,/does not upload templates/i);assert.doesNotMatch(setup,/smtp_password\s*=|sk_[a-z0-9]/i);
});

test('localized confirmation state keeps the known recovery destination without relaxing generic redirects',()=>{
  const page=readFileSync('app/[locale]/auth/confirmed/page.tsx','utf8');
  assert.match(page,/flow==='recovery'\?`\/\$\{params\.locale\}\/auth\/reset-password`/);
  assert.match(page,/safeDestination\(searchParams\.next,params\.locale\)/);
});
