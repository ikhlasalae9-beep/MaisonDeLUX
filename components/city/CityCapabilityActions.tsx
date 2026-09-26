import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';
import type { VerifiedCity } from '@/config/cities.config';
import { cityCapabilityActions } from '@/lib/cities/registry';

export function CityCapabilityActions({ city, locale }: { city: VerifiedCity; locale: string }) {
  const actions = cityCapabilityActions(locale, city);
  if (!actions.length) return null;
  return <nav aria-label={locale === 'ar' ? 'خدمات المدينة' : 'Services de la ville'} className="mt-6 flex flex-col gap-3 min-[480px]:flex-row sm:mt-8">
    {actions.map(action => <Link key={action.kind} href={action.href} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control px-6 py-3 font-semibold transition min-[480px]:w-auto ${action.kind === 'estimate' ? 'bg-white text-[#101b2d] hover:bg-blue-50' : 'border border-white/25 bg-white/10 text-white hover:bg-white/15'}`}>
      {action.kind === 'market' ? <BarChart3 className="h-4 w-4"/> : null}{action.label}{action.kind === 'estimate' ? <ArrowRight className="h-4 w-4 rtl:rotate-180"/> : null}
    </Link>)}
  </nav>;
}
