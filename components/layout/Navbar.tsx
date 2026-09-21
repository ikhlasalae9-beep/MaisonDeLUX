'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NAV_LINKS } from '@/config/navigation.config';
import { isRTL } from '@/lib/i18n/config';

interface NavbarProps {
  locale: string;
  dict: any;
}

export function Navbar({ locale, dict }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || `/${locale}`;
  const isEstimationPage = pathname.includes('/estimation') || pathname.endsWith('/estimate');
  const rtl = isRTL(locale);
  const resolveHref = (href: string) => href.startsWith('#') ? `/${locale}${href}` : `/${locale}${href}`;

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    focusable?.[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      } else if (event.key === 'Tab' && focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown); };
  }, [mobileMenuOpen]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 w-full px-2.5 pt-[max(.5rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 ease-out ${
        isScrolled ? 'sm:pt-2.5' : 'sm:pt-4.5'
      }`}
    >
      {/* Floating Glassmorphic Island */}
      <div
        className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-7 rounded-2xl sm:rounded-full pointer-events-auto flex items-center justify-between gap-2 lg:gap-8 transition-all duration-300 ease-out ${
          isScrolled
            ? 'h-14 sm:h-16 backdrop-blur-lg bg-surface/95 dark:bg-surface-elevated/95 border border-border-subtle shadow-card'
            : 'h-16 sm:h-20 bg-surface/95 dark:bg-surface/95 border border-border-subtle shadow-subtle sm:backdrop-blur-xl'
        }`}
      >
        {/* Left: Official Horizontal Logo */}
        <div className="flex items-center shrink-0">
          <BrandLogo locale={locale} size="compact" />
        </div>

        {/* Center: Main Navigation with Refined Glass Pills */}
        {!isEstimationPage && (
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => {
              const label = locale === 'ar' ? link.labelAr : link.labelFr;
              return (
                <a
                  key={link.href}
                  href={resolveHref(link.href)}
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/8 transition-all duration-200 select-none"
                >
                  {label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Right: Cleanly Grouped Utilities + Divider + Primary CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Glass Language Switcher */}
          <LanguageSwitcher currentLocale={locale} />

          {/* Glass Tactile Theme Toggle */}
          <ThemeToggle />

          {/* Subtle Hairline Divider */}
          <div className="h-4.5 w-px bg-slate-200/80 dark:bg-white/10 mx-0.5" />

          {/* Luxury CTA Button */}
          {!isEstimationPage ? (
            <Link
              href={`/${locale}/cities/casablanca/estimate`}
              className={`group relative inline-flex items-center gap-2 rounded-full text-xs font-semibold text-white tracking-wide bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 shadow-[0_2px_12px_-2px_rgba(29,78,216,0.5),inset_0_1px_0_0_rgba(255,255,255,0.3)] dark:shadow-[0_2px_16px_-2px_rgba(59,130,246,0.5),inset_0_1px_0_0_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${
                isScrolled ? 'px-4 py-2' : 'px-4.5 sm:px-5 py-2 sm:py-2.5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-12 transition-transform duration-300" />
              <span>{dict.common.estimateCta}</span>
              <ArrowIcon className="w-3 h-3 text-blue-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform duration-200" />
            </Link>
          ) : (
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-white/8 hover:bg-slate-200/80 dark:hover:bg-white/12 border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200"
            >
              <ArrowIcon className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{locale === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}</span>
            </Link>
          )}
        </div>

        {/* Mobile controls: Theme toggle + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-white/6 hover:bg-slate-200/80 dark:hover:bg-white/12 border border-slate-200/80 dark:border-white/10 transition-colors"
            aria-label="Menu de navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer */}
      {mobileMenuOpen && (
        <div ref={menuRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Menu de navigation'} className="lg:hidden mt-2 max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top))] overflow-y-auto p-4 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-white/10 shadow-elevated pointer-events-auto space-y-4">
          {!isEstimationPage && (
            <div className="flex flex-col space-y-1 border-b border-slate-200/60 dark:border-white/5 pb-4">
              {NAV_LINKS.map((link) => {
                const label = locale === 'ar' ? link.labelAr : link.labelFr;
                return (
                  <a
                    key={link.href}
                    href={resolveHref(link.href)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors flex items-center justify-between"
                  >
                    <span>{label}</span>
                    <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {dict.footer.localeSwitch}
            </span>
            <LanguageSwitcher currentLocale={locale} />
          </div>

          <div className="pt-2">
            {!isEstimationPage ? (
              <Link
                href={`/${locale}/cities/casablanca/estimate`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>{dict.common.estimateCta}</span>
                <ArrowIcon className="w-3.5 h-3.5 text-blue-200" />
              </Link>
            ) : (
              <Link
                href={`/${locale}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10"
              >
                <span>{locale === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
