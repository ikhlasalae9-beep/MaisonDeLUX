'use client';

import React from 'react';
import locations from '@/models/locations_v1.json';
import { ESTIMATOR_FIELDS } from '@/config/estimator.config';
import { ClipboardCheck, Edit3, MapPin, Home, SlidersHorizontal } from 'lucide-react';
import { EstimatorFormData } from '@/types/estimator';
import { formatArea, formatInteger } from '@/lib/utils';
import { isRTL } from '@/lib/i18n/config';

interface Step4ReviewProps {
  formData: EstimatorFormData;
  goToStep: (step: number) => void;
  locale: string;
  dict: any;
}

export function Step4Review({ formData, goToStep, locale, dict }: Step4ReviewProps) {
  const d = dict.estimation;
  const rtl = isRTL(locale);

  const reviewSections = [
    {
      title: d.step1,
      icon: <MapPin className="w-4 h-4 text-brand-blue" />,
      stepNumber: 1,
      items: [
        { label: d.cityField, value: formData.ville },
        { label: locale === 'ar' ? 'المنطقة' : 'Région', value: (locations as Record<string, string>)[formData.ville] },
        { label: d.districtField, value: formData.quartier || (locale === 'ar' ? 'آخر / حي غير مدرج' : 'Autre / quartier non répertorié') },
      ],
    },
    {
      title: d.step2,
      icon: <Home className="w-4 h-4 text-brand-blue" />,
      stepNumber: 2,
      items: [
        { label: d.typeField, value: locale === 'ar' ? 'شقة' : 'Appartement' },
      ],
    },
    {
      title: d.step3,
      icon: <SlidersHorizontal className="w-4 h-4 text-brand-blue" />,
      stepNumber: 3,
      items: [
        { label: d.surfaceField, value: formatArea(formData.surface, locale) },
        { label: d.bedroomsField, value: formData.chambres ? formatInteger(formData.chambres, locale) : d.notSpecified },
        ...ESTIMATOR_FIELDS.filter(f => ['parking', 'balcony', 'sea_view', 'furnished_status'].includes(f.id)).map(f => ({ label: locale === 'ar' ? f.labelAr : f.labelFr, value: f.options?.find(o => o.value === formData[f.id])?.[locale === 'ar' ? 'labelAr' : 'labelFr'] })),
        { label: d.bathroomsField, value: formData.salles_bain ? formatInteger(formData.salles_bain, locale) : d.notSpecified },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-brand-blue dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fiche Résumé</h3>
            <p className="text-xs text-slate-500">{d.reviewNotice}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewSections.map((sec, index) => (
          <div
            key={sec.stepNumber}
            className={`p-5 rounded-2xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-white/10 relative group ${index === 2 ? 'md:col-span-2' : ''}`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2">
                {sec.icon}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {sec.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(sec.stepNumber)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-white/5 shadow-sm text-slate-500 hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                aria-label={dict.common.edit}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <dl className={`grid gap-x-6 gap-y-3 ${index === 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
              {sec.items.map((item, i) => (
                <div key={i} className="flex flex-col text-xs">
                  <dt className="text-slate-500 dark:text-slate-400 font-medium mb-1">
                    {item.label}
                  </dt>
                  <dd className="text-slate-900 dark:text-white font-semibold truncate">
                    {item.value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
