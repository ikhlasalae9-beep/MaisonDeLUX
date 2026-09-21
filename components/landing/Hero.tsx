import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { LANDING_MEDIA_CONFIG } from '@/config/city-media';
import { PageContainer, ZelligePattern } from '@/components/city/CityFoundation';
import { ThemeVideoBackground } from '@/components/media/ThemeVideoBackground';

interface HeroProps { locale: string; dict: any }

export function Hero({ locale, dict }: HeroProps) {
  const copy = dict.phase3.landing;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  return (
    <section className="relative isolate overflow-hidden bg-[#f4f1eb] text-[#101b2d] dark:bg-[#08111f] dark:text-white lg:min-h-[92svh]">
      <div className="absolute inset-x-0 top-0 z-0 h-[clamp(15rem,72vw,19rem)] bg-[#e9e5dc] dark:bg-[#07101d] lg:inset-y-0 lg:end-0 lg:start-auto lg:h-full lg:w-[58%]">
        <ThemeVideoBackground darkSrc={LANDING_MEDIA_CONFIG.hero.dark} lightSrc={LANDING_MEDIA_CONFIG.hero.light} fallbackSrc={LANDING_MEDIA_CONFIG.hero.darkPoster} lightFallbackSrc={LANDING_MEDIA_CONFIG.hero.lightPoster} imageClassName="object-cover object-center" videoClassName="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[52%] to-[#f4f1eb] dark:to-[#08111f] lg:bg-gradient-to-r lg:from-[#f4f1eb] lg:via-[#f4f1eb]/25 lg:to-transparent dark:lg:from-[#08111f] dark:lg:via-[#08111f]/30 rtl:lg:bg-gradient-to-l" />
      </div>
      <ZelligePattern className="z-0 opacity-[0.08] dark:opacity-[0.14]" />
      <PageContainer className="relative z-10 pb-12 pt-[clamp(13rem,61vw,16rem)] sm:pb-16 sm:pt-[17rem] lg:flex lg:min-h-[92svh] lg:items-center lg:py-36">
        <div className="w-full max-w-2xl lg:max-w-[47%]">
          <p className="mb-4 inline-flex items-center gap-2 rounded-pill border border-slate-900/10 bg-white/60 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] dark:border-white/20 dark:bg-white/10 sm:mb-5 sm:px-4 sm:text-xs"><Compass className="h-4 w-4" />{copy.eyebrow}</p>
          <h1 className="max-w-[18ch] text-[clamp(2.125rem,10.5vw,2.75rem)] font-bold leading-[1.06] tracking-[-.035em] text-[#101b2d] dark:text-white sm:text-5xl lg:max-w-none lg:text-display">{copy.title}</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-700 dark:text-white/75 sm:mt-6 sm:text-lg sm:leading-8">{copy.subtitle}</p>
          <div className="mt-6 flex flex-col gap-3 min-[380px]:flex-row sm:mt-8">
            <Link href={`/${locale}/cities`} className="inline-flex items-center justify-center gap-2 rounded-control bg-[#101b2d] px-6 py-3.5 font-semibold text-white transition hover:bg-brand-blue focus-visible:shadow-focus dark:bg-white dark:text-[#08111f] dark:hover:bg-blue-50">{copy.primaryCta}<Arrow className="h-4 w-4" /></Link>
            <a href="#demarche" className="inline-flex items-center justify-center rounded-control border border-slate-900/15 bg-white/50 px-6 py-3.5 font-semibold text-[#101b2d] transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">{copy.secondaryCta}</a>
          </div>
          <div className="mt-6 flex items-start gap-2.5 text-xs leading-5 text-slate-600 dark:text-white/65 sm:mt-8 sm:items-center sm:text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" /><span>{locale === 'ar' ? 'لا تقدير دون نموذج محلي معتمد' : 'Aucune estimation sans modèle local validé'}</span></div>
        </div>
      </PageContainer>
    </section>
  );
}
