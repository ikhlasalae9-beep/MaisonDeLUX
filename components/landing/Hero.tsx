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
    <section className="relative isolate min-h-[88svh] overflow-hidden bg-[#f4f1eb] text-[#101b2d] dark:bg-[#08111f] dark:text-white lg:min-h-[92svh]">
      <div className="absolute inset-y-0 end-0 z-0 h-[52%] w-full sm:h-[58%] lg:h-full lg:w-[58%]">
        <ThemeVideoBackground darkSrc={LANDING_MEDIA_CONFIG.hero.dark} lightSrc={LANDING_MEDIA_CONFIG.hero.light} fallbackSrc="/media/cities/casablanca/casa-image1.jpg" label={copy.videoLabel} imageClassName="object-cover object-center" videoClassName="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f4f1eb]/10 via-transparent to-[#f4f1eb] dark:to-[#08111f] lg:bg-gradient-to-r lg:from-[#f4f1eb] lg:via-[#f4f1eb]/25 lg:to-transparent dark:lg:from-[#08111f] dark:lg:via-[#08111f]/30 rtl:lg:bg-gradient-to-l" />
      </div>
      <ZelligePattern className="z-0 opacity-[0.08] dark:opacity-[0.14]" />
      <PageContainer className="relative z-10 flex min-h-[88svh] items-end pb-14 pt-[48svh] sm:pb-20 sm:pt-[52svh] lg:min-h-[92svh] lg:items-center lg:py-36">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/50 bg-[#f4f1eb]/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#08111f]/86 dark:shadow-black/30 sm:p-9 lg:max-w-[47%] lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none dark:lg:bg-transparent">
          <p className="mb-5 inline-flex items-center gap-2 rounded-pill border border-slate-900/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] dark:border-white/20 dark:bg-white/10"><Compass className="h-4 w-4" />{copy.eyebrow}</p>
          <h1 className="text-display font-bold text-[#101b2d] dark:text-white">{copy.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-700 dark:text-white/75 sm:text-lg">{copy.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/cities`} className="inline-flex items-center justify-center gap-2 rounded-control bg-[#101b2d] px-6 py-3.5 font-semibold text-white transition hover:bg-brand-blue focus-visible:shadow-focus dark:bg-white dark:text-[#08111f] dark:hover:bg-blue-50">{copy.primaryCta}<Arrow className="h-4 w-4" /></Link>
            <a href="#demarche" className="inline-flex items-center justify-center rounded-control border border-slate-900/15 bg-white/50 px-6 py-3.5 font-semibold text-[#101b2d] transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">{copy.secondaryCta}</a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-600 dark:text-white/65"><ShieldCheck className="h-4 w-4" /><span>{locale === 'ar' ? 'لا تقدير دون نموذج محلي معتمد' : 'Aucune estimation sans modèle local validé'}</span></div>
        </div>
      </PageContainer>
    </section>
  );
}
