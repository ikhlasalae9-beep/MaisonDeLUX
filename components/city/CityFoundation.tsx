import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function Section({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return <section aria-labelledby={labelledBy} className={cn('py-12 sm:py-section-sm lg:py-section', className)}>{children}</section>;
}

export function SectionHeading({
  as: Heading = 'h2',
  eyebrow,
  title,
  description,
  id,
  align = 'start',
  className,
}: {
  as?: ElementType;
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <header className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue">{eyebrow}</p>}
      <Heading id={id} className="text-[clamp(1.9rem,8.5vw,3.5rem)] leading-[1.1] tracking-[-.03em] text-text-primary">{title}</Heading>
      {description && <p className="mt-4 text-[15px] leading-7 text-text-secondary sm:mt-5 sm:text-lg">{description}</p>}
    </header>
  );
}

export type CityBadgeStatus = 'available' | 'prepared' | 'coming-soon' | 'informational' | 'unavailable';

const badgeStyles: Record<CityBadgeStatus, string> = {
  available: 'border-status-success/25 bg-status-success/10 text-status-success',
  prepared: 'border-brand-blue/25 bg-brand-blue-subtle text-brand-blue',
  'coming-soon': 'border-status-warning/25 bg-status-warning/10 text-status-warning',
  informational: 'border-border-medium bg-surface-subtle text-text-secondary',
  unavailable: 'border-border-medium bg-surface-subtle text-text-muted',
};

export function CityStatusBadge({ status, children, className }: { status: CityBadgeStatus; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', badgeStyles[status], className)}>
      {children}
    </span>
  );
}

export function CardSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-card border border-border-subtle bg-surface shadow-card', className)}>{children}</div>;
}

export function MediaContainer({
  children,
  className,
  ratio = 'landscape',
}: {
  children: ReactNode;
  className?: string;
  ratio?: 'landscape' | 'cinematic' | 'portrait';
}) {
  const ratios = { landscape: 'aspect-[4/3]', cinematic: 'aspect-video', portrait: 'aspect-[3/4]' };
  return (
    <div className={cn('relative overflow-hidden rounded-media bg-surface-subtle', ratios[ratio], className)}>
      {children}
    </div>
  );
}

export function StatePanel({
  title,
  description,
  children,
  busy = false,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  busy?: boolean;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy={busy} className="rounded-card border border-border-subtle bg-surface-subtle p-6 text-center">
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function ZelligePattern({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('zellige-pattern pointer-events-none', className)} />;
}
