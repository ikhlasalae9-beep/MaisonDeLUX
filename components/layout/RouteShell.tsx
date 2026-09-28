'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CompactHeader } from '@/components/layout/CompactHeader';

export function RouteShell({ children, locale, dict }: { children: React.ReactNode; locale: string; dict: any }) {
  const pathname = usePathname() || `/${locale}`;
  const auth = pathname.includes('/auth/');
  const account = pathname === `/${locale}/account` || pathname.startsWith(`/${locale}/account/`);
  // Account estimation details own their application shell. Without these guards,
  // `/account/estimations/:id` also matched the public product header.
  const product = !auth && !account && (pathname.endsWith('/estimate') || pathname.includes('/estimation'));
  const publicShell = !auth && !account && !product;

  return <>
    {publicShell ? <Navbar locale={locale} dict={dict} /> : null}
    {auth ? <CompactHeader locale={locale} variant="auth" /> : null}
    {product ? <CompactHeader locale={locale} variant="product" /> : null}
    <main className="relative z-10 flex-1">{children}</main>
    {publicShell ? <Footer locale={locale} dict={dict} /> : null}
  </>;
}
