import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { NAV_LINKS } from '@/config/navigation.config';

interface FooterProps {
  locale: string;
  dict: any;
}

export function Footer({ locale, dict }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@maison-delux.com';

  return (
    <footer className="border-t border-border-subtle bg-surface/50 dark:bg-surface-elevated/60 transition-colors z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Brand description column */}
          <div className="md:col-span-4 space-y-4">
            <BrandLogo locale={locale} />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed pr-4">
              {dict.footer.brandDescription}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {dict.footer.dataSource}
              </span>
            </div>
          </div>

          {/* Navigation column */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">
              {dict.footer.navigationTitle}
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {NAV_LINKS.map((link) => {
                const label = locale === 'ar' ? link.labelAr : link.labelFr;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="hover:text-brand-blue dark:hover:text-blue-400 transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
              <li>
                <Link
                  href={`/${locale}/estimation`}
                  className="font-medium text-brand-blue dark:text-blue-400 hover:underline"
                >
                  {dict.common.estimateCta}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Methodological note */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">
              {dict.footer.legalTitle || 'Méthodologie'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              {dict.footer.legalNote}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {dict.footer.localeSwitch} :
              </span>
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">
              Contact
            </h4>
            <a 
              href={`mailto:${contactEmail}`}
              className="text-sm font-semibold text-brand-blue dark:text-blue-400 hover:underline block"
            >
              {contactEmail}
            </a>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              {locale === 'ar' ? 'هل لديك أسئلة حول MaisonDeLUX؟ راسلنا.' : 'Une question sur MaisonDeLUX ? Écrivez-nous.'}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200/60 dark:border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <p>
            © {currentYear} {dict.common.brandName} · {dict.common.allRightsReserved}
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-center">
            <span>Royaume du Maroc</span>
            <span className="hidden md:inline">·</span>
            <span>Rigueur Statistique</span>
            <span className="hidden md:inline">·</span>
            <span>Architecture & Données</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
