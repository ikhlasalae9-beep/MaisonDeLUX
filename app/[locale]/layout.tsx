import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES, getDirection } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { RouteShell } from '@/components/layout/RouteShell';
import { LocaleHandler } from '@/components/common/LocaleHandler';
import { ScrollProgress } from '@/components/common/ScrollProgress';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const dict = getDictionary(params.locale);

  return {
    title: `${dict.common.brandName} — ${dict.common.tagline}`,
    description: dict.hero.subtitle,
    icons: {
      icon: [
        { url: '/brand/icons/maisondelux-app-blue.png', sizes: 'any', type: 'image/png' },
      ],
      apple: [
        { url: '/brand/icons/maisondelux-app-blue.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/brand/icons/maisondelux-app-blue.png',
    },
  };
}

import { LuxuryAmbientBackground } from '@/components/layout/LuxuryAmbientBackground';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!LOCALES.includes(locale as any)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const dir = getDirection(locale);

  return (
    <>
      <LuxuryAmbientBackground />
      <ScrollProgress locale={locale} />
      <LocaleHandler locale={locale} dir={dir} />
      <RouteShell locale={locale} dict={dict}>{children}</RouteShell>
    </>
  );
}
