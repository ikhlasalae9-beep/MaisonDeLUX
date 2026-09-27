# MaisonDeLUX customer-auth email setup

These files are source copies for manual configuration. The application does not upload templates or change Supabase, SMTP, or DNS settings.

## Sender and SMTP

Production sender target:

- Sender name: `MaisonDeLUX`
- From address: `no-reply@auth.maison-delux.com`

In the Supabase dashboard, open **Authentication → SMTP Settings** and configure a compatible custom SMTP provider. Required configuration categories are:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_SENDER_ADDRESS`
- `SMTP_SENDER_NAME`

Keep every credential server-side. Never expose SMTP values through a `NEXT_PUBLIC_*` variable.

The selected provider will supply the DNS records for `auth.maison-delux.com`. Publish and validate:

- SPF
- DKIM
- DMARC

Do not invent these values: hostnames, selectors, public keys, and policy records depend on the chosen provider. Disable click/open tracking for authentication email because link rewriting can interfere with confirmation links.

## Supabase URL configuration

Open **Authentication → URL Configuration**.

- Site URL: `https://maison-delux.com`
- Add the exact production callback URLs used by the application:
  - `https://maison-delux.com/fr/auth/callback`
  - `https://maison-delux.com/ar/auth/callback`
- Keep explicit localhost callback entries required by local development; do not use a localhost Site URL in production.

The branded email links enter through `/auth/confirm`. That endpoint verifies Supabase's token hash, establishes the cookie session, validates the nested continuation URL, and then exposes a localized success or failure state. It never redirects to an arbitrary origin.

## Templates and subjects

Open **Authentication → Email Templates** and copy the appropriate repository HTML source into each dashboard template. Supabase has one active template per email action. The source files use only the already-stored `preferred_locale` user metadata: Arabic is selected only when it is exactly `ar`; otherwise the safe default is French.

### Confirm signup

- HTML: `docs/auth-email-templates/confirm-signup.html`
- Subject:
  - French: `Confirmez votre adresse e-mail — MaisonDeLUX`
  - Arabic: `أكّد عنوان بريدك الإلكتروني — MaisonDeLUX`
- Conditional subject expression, if the dashboard subject field supports Go-template evaluation:
  - `{{ if eq .Data.preferred_locale "ar" }}أكّد عنوان بريدك الإلكتروني — MaisonDeLUX{{ else }}Confirmez votre adresse e-mail — MaisonDeLUX{{ end }}`

### Reset password

- HTML: `docs/auth-email-templates/password-recovery.html`
- French: `Réinitialisez votre mot de passe — MaisonDeLUX`
- Arabic: `أعد تعيين كلمة المرور — MaisonDeLUX`

### Change email address

- HTML: `docs/auth-email-templates/change-email.html`
- French: `Confirmez votre nouvelle adresse e-mail — MaisonDeLUX`
- Arabic: `أكّد عنوان بريدك الإلكتروني الجديد — MaisonDeLUX`

### Reauthentication

The current application does not call Supabase's `reauthenticate()` flow. `docs/auth-email-templates/reauthentication-reference.html` is branded security copy for future review only and must not replace a functional provider reauthentication template until that product flow is implemented and tested. It intentionally contains no visible nonce or raw token.

## Provider settings to review manually

Open **Authentication → Sign In / Providers → Email** and keep email confirmation enabled. Do not enable automatic confirmation to avoid configuring email delivery.

For each installed template, verify in the provider preview that:

- `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}`, and `{{ .Data.preferred_locale }}` render as expected;
- the French and Arabic branches are never visible simultaneously;
- the Arabic branch is RTL;
- the sender shown to recipients is MaisonDeLUX rather than the provider project name;
- no provider branding or tracking redirect is injected.

Supabase documentation references:

- Email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Token-hash verification: https://supabase.com/docs/reference/javascript/auth-verifyotp
