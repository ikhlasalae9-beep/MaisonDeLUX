import React from 'react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { WhyMaisonDeLUX } from '@/components/landing/WhyMaisonDeLUX';
import { TrustMethodology } from '@/components/landing/TrustMethodology';
import { FinalCallToAction, LandingCityPreview, NationalVision } from '@/components/landing/NationalLandingSections';

interface LandingPageProps {
  params: {
    locale: string;
  };
}

export default function LandingPage({ params }: LandingPageProps) {
  const { locale } = params;
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col">
      <Hero locale={locale} dict={dict} />
      <NationalVision dict={dict} />
      <LandingCityPreview locale={locale} dict={dict} />
      <HowItWorks locale={locale} dict={dict} />
      <WhyMaisonDeLUX locale={locale} dict={dict} />
      <TrustMethodology locale={locale} dict={dict} />
      <FinalCallToAction locale={locale} dict={dict} />
    </div>
  );
}
