'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, UserRound } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function CompactHeader({ locale, variant }: { locale: string; variant: 'auth' | 'product' }) {
  const ar = locale === 'ar';
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    if (variant !== 'product') return;
    let active = true;
    void fetch('/api/auth/session', { cache: 'no-store' }).then(response => response.json()).then(data => {
      if (active) setAuthenticated(data.authenticated === true);
    }).catch(() => {});
    return () => { active = false; };
  }, [variant]);
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const backHref = variant === 'product' ? `/${locale}/cities/casablanca` : `/${locale}`;
  const backLabel = variant === 'product'
    ? (ar ? 'العودة إلى الدار البيضاء' : 'Retour à Casablanca')
    : (ar ? 'العودة إلى الموقع' : 'Retour au site');

  return <header className="relative z-40 border-b border-border-subtle bg-surface/90 backdrop-blur-xl">
    <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <BrandLogo locale={locale} size="compact" />
      <div className="flex items-center gap-1 sm:gap-3">
        <LanguageSwitcher currentLocale={locale} showIcon={false} />
        <ThemeToggle />
        {variant === 'product' ? <Link href={authenticated ? `/${locale}/account` : `/${locale}/auth/login`} aria-label={authenticated ? (ar ? 'فضائي' : 'Mon espace') : (ar ? 'تسجيل الدخول' : 'Connexion')} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"><UserRound className="h-4 w-4" /></Link> : null}
        <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-subtle px-3 text-xs font-bold text-text-primary transition-colors hover:border-brand-blue sm:px-4">
          <BackIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      </div>
    </div>
  </header>;
}
