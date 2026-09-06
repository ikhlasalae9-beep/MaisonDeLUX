'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifiedCity, VERIFIED_CITIES } from '@/config/cities.config';
import { CITY_MEDIA_CONFIG } from '@/config/city-media';
import { MoroccoMapPreview } from './MoroccoMapPreview';
import Image from 'next/image';
import { isRTL } from '@/lib/i18n/config';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface LocationExplorerProps {
  locale: string;
  dict: any;
}

export function LocationExplorer({ locale, dict }: LocationExplorerProps) {
  const router = useRouter();
  const rtl = isRTL(locale);
  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  // We want to show exactly 4 featured cards on desktop.
  // We'll manage an array of 4 city IDs.
  const allCitiesWithMedia = VERIFIED_CITIES.filter(city => CITY_MEDIA_CONFIG[city.id]);
  
  const [visibleCityIds, setVisibleCityIds] = useState<string[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Initial state: pick first 4
    if (allCitiesWithMedia.length >= 4) {
      setVisibleCityIds(allCitiesWithMedia.slice(0, 4).map(c => c.id));
    } else {
      setVisibleCityIds(allCitiesWithMedia.map(c => c.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visibleCityIds.length < 4 || allCitiesWithMedia.length <= 4 || isHovering) return;

    const interval = setInterval(() => {
      setVisibleCityIds(currentVisible => {
        const availablePool = allCitiesWithMedia.map(c => c.id).filter(id => !currentVisible.includes(id));
        if (availablePool.length === 0) return currentVisible;

        // Pick a random replacement from available pool
        const newCityId = availablePool[Math.floor(Math.random() * availablePool.length)];
        
        // Pick a random index (0-3) to replace
        const indexToReplace = Math.floor(Math.random() * currentVisible.length);
        
        const newVisible = [...currentVisible];
        newVisible[indexToReplace] = newCityId;

        // Preload next image before rendering to avoid flashes
        const nextImg = new window.Image();
        const config = CITY_MEDIA_CONFIG[newCityId];
        nextImg.src = config.images.length > 0 ? config.images[0] : config.fallback;
        
        return newVisible;
      });
    }, 8000); // 8 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCityIds, isHovering]);

  const handleSelectCity = (city: VerifiedCity) => {
    router.push(`/${locale}/estimation?ville=${encodeURIComponent(city.nameFr)}`);
  };

  return (
    <section
      id="explorer"
      className="min-h-auto flex flex-col justify-center py-20 sm:py-28 bg-white dark:bg-surface border-t border-slate-200/80 dark:border-white/5 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center mb-12 lg:mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue dark:text-blue-400 mb-4 block">
            {dict.explorer.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            {dict.explorer.title}
          </h2>
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {dict.explorer.subtitle}
          </p>
        </motion.div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
             onMouseEnter={() => setIsHovering(true)}
             onMouseLeave={() => setIsHovering(false)}>
          
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
            {visibleCityIds.map((cityId, idx) => {
              const city = VERIFIED_CITIES.find(c => c.id === cityId)!;
              const config = CITY_MEDIA_CONFIG[city.id];
              const imageSrc = config.images.length > 0 ? config.images[0] : config.fallback;

              return (
                <div key={`${cityId}-${idx}`} className="relative h-48 sm:h-56 lg:h-40 w-full rounded-2xl overflow-hidden shadow-sm">
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 w-full h-full group focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <Image 
                        src={imageSrc} 
                        alt={city.nameFr}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
                      />
                      {/* Subtler gradient for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300" />
                      
                      <div className={`absolute bottom-0 w-full p-5 flex items-end justify-between text-white ${rtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight mb-1 drop-shadow-md">{locale === 'ar' ? city.nameAr : city.nameFr}</h3>
                          <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">{locale === 'ar' ? city.regionKey : city.regionKey}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <ArrowIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex justify-center"
          >
            <MoroccoMapPreview
              onSelectCity={handleSelectCity}
              locale={locale}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
