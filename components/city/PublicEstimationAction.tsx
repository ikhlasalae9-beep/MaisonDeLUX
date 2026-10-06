import Link from 'next/link';
import type { ReactNode } from 'react';

/** Same public action surface; unavailable cities have no estimator destination. */
export function PublicEstimationAction({ href, className, disabledClassName, onClick, children }: {
  href: string | null;
  className?: string;
  disabledClassName?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return href ? <Link href={href} className={className} onClick={onClick}>{children}</Link> :
    <span aria-disabled="true" className={disabledClassName ?? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-medium bg-surface-subtle px-4 py-2 text-xs font-semibold text-text-muted'}>{children}</span>;
}
