'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, RefreshCw, ArrowLeft, ArrowRight, ShieldCheck, MapPin, Home, Building2, Key } from 'lucide-react';
import { PredictResponse } from '@/lib/api/types';
import { EstimatorFormData } from '@/types/estimator';
import { formatCurrency, formatPricePerSquareMeter, formatArea } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { isRTL } from '@/lib/i18n/config';

interface Step5ResultProps {
  prediction: PredictResponse | null;
  isSubmitting: boolean;
  isOffline: boolean;
  error?: string;
  formData: EstimatorFormData;
  onRetry: () => void;
  onReset: () => void;
  locale: string;
  dict: any;
}

export function Step5Result({
  prediction,
  isSubmitting,
  isOffline,
  error,
  formData,
  onRetry,
  onReset,
  locale,
  dict,
}: Step5ResultProps) {
  const d = dict.estimation.result;
  const rtl = isRTL(locale);
  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  if (isSubmitting) {
    return (
      <div className="py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-blue/10 dark:bg-blue-400/10 border-2 border-brand-blue/20 flex items-center justify-center mx-auto text-brand-blue dark:text-blue-400 animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {dict.common.loading}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'تتم معالجة مواصفات العقار عبر خوارزمية التقييم المطابقة للمنطقة.'
              : 'Rapprochement des caractéristiques du bien avec les séries statistiques locales.'}
          </p>
        </div>
      </div>
    );
  }

  if (isOffline || error) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-white/10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-3 max-w-md mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {d.offlineTitle}
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {d.offlineMessage}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 font-mono">
            {error || 'Statut: API ML en attente de déploiement'}
          </p>
        </div>
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          <Button variant="primary" size="md" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
            {d.retry}
          </Button>
          <Button variant="outline" size="md" onClick={onReset}>
            {dict.common.reset}
          </Button>
        </div>
      </div>
    );
  }

  if (prediction && prediction.estimated_price_mad !== undefined) {
    const hasRange = prediction.prix_min !== undefined && prediction.prix_max !== undefined;
    const hasPpm = prediction.prix_par_m2 !== undefined;
    const modelVersion = prediction.model_version;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-surface-elevated border border-slate-200 dark:border-white/10 shadow-card">
          
          {/* Subtle Background Architectural Motif */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
            <Home className="w-64 h-64 -mt-16 -mr-16" />
          </div>

          <div className="p-8 sm:p-12 relative z-10 text-center space-y-8">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>{d.title}</span>
              </div>
              <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">
                {d.priceLabel}
              </h2>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(prediction.estimated_price_mad, locale)}
              </div>
            </div>

            {/* Contextual Properties Summary */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-6 border-y border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span className="font-semibold">{prediction.ville || formData.ville}</span>
                {formData.quartier && <span className="text-slate-400">— {formData.quartier}</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-brand-blue" />
                <span className="font-semibold">{formData.type_bien === 'appartement' ? (locale === 'ar' ? 'شقة' : 'Appartement') : (locale === 'ar' ? 'فيلا' : 'Villa')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Key className="w-4 h-4 text-brand-blue" />
                <span className="font-semibold">{formatArea(formData.surface, locale)}</span>
              </div>
            </div>

            {/* Price Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {hasRange && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-surface border border-slate-100 dark:border-white/5 text-left rtl:text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    {d.rangeLabel}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(prediction.prix_min, locale)} — {formatCurrency(prediction.prix_max, locale)}
                  </span>
                </div>
              )}
              {hasPpm && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-surface border border-slate-100 dark:border-white/5 text-left rtl:text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    {d.pricePerM2Label}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatPricePerSquareMeter(prediction.prix_par_m2, locale)}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Trust & Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center sm:items-start rtl:sm:items-end text-left rtl:text-right">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue dark:text-blue-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>MaisonDeLUX Intelligence</span>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  {locale === 'ar' 
                    ? 'تقدير إحصائي استرشادي، وليس تقييماً عقارياً رسمياً.' 
                    : 'Estimation statistique indicative, ne constituant pas une expertise immobilière officielle.'}
                </p>
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={onReset}
                className="w-full sm:w-auto shadow-xl shadow-brand-blue/20"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {locale === 'ar' ? 'إجراء تقييم جديد' : 'Nouvelle estimation'}
              </Button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return null;
}
