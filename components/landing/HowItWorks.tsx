'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Cpu, FileText } from 'lucide-react';
import { isRTL } from '@/lib/i18n/config';

interface HowItWorksProps {
  locale: string;
  dict: any;
}

export function HowItWorks({ locale, dict }: HowItWorksProps) {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const rtl = isRTL(locale);

  const toggleCard = (index: number) => {
    setActiveCard(activeCard === index ? null : index);
  };

  const steps = [
    {
      num: '01',
      title: locale === 'ar' ? 'التصنيف المعماري' : 'Qualification architecturale',
      subtitle: locale === 'ar' ? 'الموقع وخصائص العقار.' : 'Localisation et caractéristiques du bien.',
      icon: <Building2 className="w-5 h-5 text-brand-blue dark:text-blue-400" />,
      details: [
        locale === 'ar' ? 'الجهة والمدينة' : 'Région & Ville',
        locale === 'ar' ? 'الحي والموقع الدقيق' : 'Quartier & Micro-localisation',
        locale === 'ar' ? 'المساحة الصافية' : 'Surface habitable',
        locale === 'ar' ? 'التوزيع الداخلي' : 'Distribution intérieure',
        locale === 'ar' ? 'المرافق والتجهيزات' : 'Équipements & Standing'
      ]
    },
    {
      num: '02',
      title: locale === 'ar' ? 'المعايرة الخوارزمية' : 'Calibrage algorithmique',
      subtitle: locale === 'ar' ? 'تحليل العقار بواسطة نموذج MaisonDeLUX.' : 'Analyse du bien par le modèle MaisonDeLUX.',
      icon: <Cpu className="w-5 h-5 text-brand-blue dark:text-blue-400" />,
      details: [
        locale === 'ar' ? 'تحديد المتغيرات' : 'Extraction des variables clés',
        locale === 'ar' ? 'المطابقة الجغرافية الدقيقة' : 'Calibration géographique stricte',
        locale === 'ar' ? 'النموذج التنبؤي' : 'Inférence du modèle prédictif',
        locale === 'ar' ? 'تحليل البيانات العقارية المماثلة' : 'Rapprochement avec le marché réel'
      ]
    },
    {
      num: '03',
      title: locale === 'ar' ? 'استخلاص القيمة' : 'Restitution de la valeur',
      subtitle: locale === 'ar' ? 'تقدير استرشادي قابل للاستخدام فوراً.' : 'Une estimation indicative immédiatement exploitable.',
      icon: <FileText className="w-5 h-5 text-brand-blue dark:text-blue-400" />,
      details: [
        locale === 'ar' ? 'السعر التقديري بالدرهم' : 'Prix estimé en MAD',
        locale === 'ar' ? 'متوسط سعر المتر المربع' : 'Prix au mètre carré',
        locale === 'ar' ? 'النطاق السعري' : 'Fourchette d\'estimation',
        locale === 'ar' ? 'بطاقة العقار المرجعية' : 'Fiche de synthèse du bien'
      ]
    }
  ];

  return (
    <section
      id="demarche"
      className="py-16 sm:py-24 scroll-mt-24 bg-white dark:bg-brand-navy border-t border-slate-200/80 dark:border-white/5 relative overflow-hidden"
      onClick={() => setActiveCard(null)}
    >
      {/* Subtle Background Architectural Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] dark:opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue dark:text-blue-400 mb-4 block">
            {dict.howItWorks.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            {dict.howItWorks.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {dict.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const isActive = activeCard === index;
            return (
              <div 
                key={index} 
                className="relative h-64 sm:h-72 w-full perspective-1000"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCard(index);
                }}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d cursor-pointer"
                  initial={false}
                  animate={{ rotateY: isActive ? (rtl ? -180 : 180) : 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* FRONT SIDE */}
                  <div 
                    className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-white/10 p-8 flex flex-col items-center justify-center text-center shadow-subtle hover:shadow-card transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-white/5 flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                    <span className="font-mono text-sm text-slate-400 dark:text-slate-500 font-bold mb-3">{step.num}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{step.subtitle}</p>
                  </div>

                  {/* BACK SIDE */}
                  <div 
                    className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-brand-navy-deep dark:bg-[#0c1627] border border-blue-900/50 p-8 flex flex-col justify-center shadow-lg"
                    style={{ transform: `rotateY(${rtl ? '-180deg' : '180deg'})` }}
                  >
                    <h4 className="text-sm font-bold text-white mb-4 border-b border-white/10 pb-3">{step.title}</h4>
                    <ul className="space-y-3 text-left rtl:text-right">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-brand-blue mt-0.5">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
