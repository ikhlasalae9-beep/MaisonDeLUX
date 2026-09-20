import Image from 'next/image';
import { ExternalLink, MapPin, Scale } from 'lucide-react';
import { getCasablancaEditorial } from '@/config/casablanca-editorial';
import { getCityMedia, localizedMediaText } from '@/config/city-media';
import { CardSurface, MediaContainer, PageContainer, Section } from '@/components/city/CityFoundation';

export function CasablancaEditorialArticle({ locale }: { locale: string }) {
  const copy = getCasablancaEditorial(locale);
  const media = getCityMedia('casablanca')!;

  return <article>
    <Section>
      <PageContainer>
        <header className="grid gap-8 border-b border-border-subtle pb-12 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-blue">{copy.kicker}</p><p className="mt-5 text-2xl leading-relaxed text-text-primary sm:text-3xl">{copy.dek}</p></div>
          <CardSurface className="p-6"><p className="text-4xl font-bold text-brand-blue">{copy.regionalFact.value}</p><p className="mt-2 font-semibold text-text-primary">{copy.regionalFact.label}</p><p className="mt-3 text-xs leading-5 text-text-muted">{copy.regionalFact.context}</p></CardSurface>
        </header>
      </PageContainer>
    </Section>

    {copy.sections.map((section, index) => <Section key={section.id} className={index === 1 ? 'bg-surface-subtle' : undefined}>
      <PageContainer>
        <div className={`grid gap-9 lg:grid-cols-2 lg:items-center ${index % 2 ? '' : 'lg:[&>*:first-child]:order-2'}`}>
          <figure>
            <MediaContainer ratio={index === 1 ? 'portrait' : 'landscape'} className="shadow-card">
              <Image src={media.gallery[index].src} alt={localizedMediaText(media.gallery[index].alt, locale)} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </MediaContainer>
            <figcaption className="mt-3 text-sm text-text-muted">{copy.captions[index]}</figcaption>
          </figure>
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-blue">{section.eyebrow}</p><h2 className="mt-3 text-heading text-text-primary">{section.title}</h2><div className="mt-6 space-y-5 text-base leading-8 text-text-secondary sm:text-lg">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div>
        </div>
      </PageContainer>
    </Section>)}

    <Section className="bg-[#101b2d] text-white">
      <PageContainer>
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300"><MapPin className="me-2 inline h-4 w-4" />Casablanca</p><h2 className="mt-4 text-heading text-white">{copy.neighborhoodsTitle}</h2><p className="mt-5 leading-7 text-white/70">{copy.neighborhoodsIntro}</p></div>
        <div className="mt-9 grid gap-px overflow-hidden rounded-card bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{copy.neighborhoods.map((item) => <div key={item.name} className="bg-[#101b2d] p-6"><h3 className="font-bold text-white">{item.name}</h3><p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p></div>)}</div>
      </PageContainer>
    </Section>

    <Section>
      <PageContainer>
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-blue"><Scale className="me-2 inline h-4 w-4" />MaisonDeLUX</p><h2 className="mt-4 text-heading text-text-primary">{copy.factorsTitle}</h2><p className="mt-5 leading-7 text-text-secondary">{copy.factorsIntro}</p></div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{copy.factors.map((factor) => <CardSurface key={factor.name} className="p-6"><h3 className="font-bold text-text-primary">{factor.name}</h3><p className="mt-3 text-sm leading-6 text-text-secondary">{factor.description}</p></CardSurface>)}</div>
        <div className="mt-6 rounded-card border-s-4 border-brand-blue bg-brand-blue-subtle p-5 text-sm leading-7 text-text-secondary">{copy.methodologyNote}</div>
      </PageContainer>
    </Section>

    <Section className="bg-surface-subtle">
      <PageContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_.9fr]">
          <div><h2 className="text-heading text-text-primary">{copy.conclusionTitle}</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">{copy.conclusionBody}</p></div>
          <aside aria-label={copy.sourcesTitle} className="rounded-card border border-border-subtle bg-surface p-6 sm:p-8"><h2 className="text-xl font-bold text-text-primary">{copy.sourcesTitle}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{copy.sourcesIntro}</p><ul className="mt-6 space-y-5">{copy.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="group inline-flex items-start gap-2 font-semibold text-brand-blue hover:underline">{source.title}<ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" /></a><p className="mt-1 text-xs font-medium text-text-primary">{source.organization}</p><p className="mt-1 text-xs leading-5 text-text-muted">{source.note}</p></li>)}</ul></aside>
        </div>
      </PageContainer>
    </Section>
  </article>;
}
