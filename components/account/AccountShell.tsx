'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, BarChart3, Building2, LayoutDashboard, Scale, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function AccountShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname() || `/${locale}/account`;
  const ar = locale === 'ar';
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const items = [
    ['', ar ? 'نظرة عامة' : 'Vue d’ensemble', LayoutDashboard],
    ['estimations', ar ? 'تقديراتي' : 'Mes estimations', BarChart3],
    ['properties', ar ? 'عقاراتي' : 'Mes biens', Building2],
    ['compare', ar ? 'المقارنة' : 'Comparaison', Scale],
    ['security', ar ? 'الأمان' : 'Sécurité', ShieldCheck],
  ] as const;
  const active = (path: string) => path ? pathname.includes(`/account/${path}`) : pathname === `/${locale}/account`;
  const linkClass = (path: string) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active(path) ? 'bg-brand-blue text-white shadow-sm' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}`;

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border-subtle bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo locale={locale} size="compact" />
        <div className="flex items-center gap-2"><LanguageSwitcher currentLocale={locale} showIcon={false} /><ThemeToggle /><Link href={`/${locale}`} aria-label={ar ? 'العودة إلى الموقع' : 'Retour au site'} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-medium text-text-secondary hover:text-text-primary"><BackIcon className="h-4 w-4" /></Link></div>
      </div>
    </header>
    <nav aria-label={ar ? 'فضاء الحساب' : 'Espace personnel'} className="border-b border-border-subtle bg-surface px-4 py-3 lg:hidden">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">{items.map(([path,label,Icon]) => <Link key={path} href={`/${locale}/account${path ? `/${path}` : ''}`} className={`${linkClass(path)} shrink-0`}><Icon className="h-4 w-4" />{label}</Link>)}</div>
    </nav>
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-12">
      <aside className="hidden lg:block"><div className="sticky top-6 rounded-card border border-border-subtle bg-surface p-4 shadow-card"><p className="px-3 pb-3 text-xs font-bold uppercase tracking-[.16em] text-text-muted">{ar ? 'فضائي MaisonDeLUX' : 'Mon espace MaisonDeLUX'}</p><nav className="space-y-1">{items.map(([path,label,Icon]) => <Link key={path} href={`/${locale}/account${path ? `/${path}` : ''}`} className={linkClass(path)}><Icon className="h-4 w-4" />{label}</Link>)}</nav></div></aside>
      <section className="min-w-0"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-blue">{ar ? 'فضاء آمن' : 'Espace sécurisé'}</p><h1 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">{ar ? 'فضائي MaisonDeLUX' : 'Mon espace MaisonDeLUX'}</h1></div>{children}</section>
    </div>
  </div>;
}
