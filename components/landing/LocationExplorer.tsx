'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { VerifiedCity } from '@/config/cities.config';
import { MoroccoMapPreview } from './MoroccoMapPreview';
import { isRTL } from '@/lib/i18n/config';

interface LocationExplorerProps {
  locale: string;
  dict: any;
}

export function LocationExplorer({ locale, dict }: LocationExplorerProps) {
  const router = useRouter();

  const handleSelectCity = (city: VerifiedCity) => {
    router.push(`/${locale}/estimation?ville=${encodeURIComponent(city.nameFr)}`);
  };

  return (
    <section
      id="explorer"
      className="min-h-auto lg:min-h-[100svh] flex flex-col justify-center py-16 sm:py-20 lg:py-8 scroll-mt-24 lg:scroll-mt-28 bg-white dark:bg-brand-navy transition-colors border-t border-slate-200/80 dark:border-white/5 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-6 lg:mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue dark:text-blue-400 mb-2 block">
            {dict.explorer.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {dict.explorer.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {dict.explorer.subtitle}
          </p>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[1200px] flex justify-center"
        >
          <MoroccoMapPreview
            onSelectCity={handleSelectCity}
            locale={locale}
          />
        </motion.div>
      </div>
    </section>
  );
}
