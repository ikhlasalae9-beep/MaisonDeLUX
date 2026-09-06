'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Compass, MapPin } from 'lucide-react';
import Image from 'next/image';
import { QuickStartBar } from './QuickStartBar';
import { isRTL } from '@/lib/i18n/config';

interface HeroProps {
  locale: string;
  dict: any;
}

export function Hero({ locale, dict }: HeroProps) {
  const rtl = isRTL(locale);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
  }, []);

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 800], [0, reducedMotion ? 0 : 120]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative overflow-hidden min-h-[90svh] sm:min-h-[100svh] flex flex-col justify-end pb-24 sm:pb-32">
      {/* Cinematic Background Image */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
      >
        <Image 
          src="/media/hero-apartment.jpg" 
          alt="Premium Moroccan Apartment Building"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 dark:to-brand-navy-deep"></div>
        <div className="absolute inset-0 bg-brand-navy-deep/20 mix-blend-multiply"></div>
      </motion.div>

      <motion.div 
        style={{ opacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10"
      >
        <div className="max-w-3xl">
          {/* Architectural Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-white/20 bg-white/10 backdrop-blur-md rounded-full"
          >
            <Compass className="w-4 h-4 text-white" />
            <span className="text-sm font-medium tracking-wide text-white uppercase">
              {dict.hero.badge || 'Intelligence Immobilière'}
            </span>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            {dict.hero.title}
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl font-light leading-relaxed"
          >
            {dict.hero.subtitle}
          </motion.p>
        </div>

        {/* Interactive QuickStart Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 lg:mt-16"
        >
          {/* We wrap QuickStartBar to handle the dark-mode context explicitly since background is dark */}
          <div className="dark bg-transparent">
             <QuickStartBar locale={locale} dict={dict} />
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center gap-6 sm:gap-10 text-sm text-white/60 font-medium"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white/80" />
            Données de marché vérifiées
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/80" />
            10+ Villes Marocaines
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Estimation Instantanée
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
