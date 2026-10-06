'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { VerifiedCity } from '@/config/cities.config';
import { CityCardGrid } from './CityCard';
import { StatePanel } from './CityFoundation';

export function CityExplorer({ cities, locale, copy }: { cities: readonly VerifiedCity[]; locale: string; copy: any }) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const regions = useMemo(() => Array.from(new Set(cities.map((city) => city.regionKey))).sort(), [cities]);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const results = useMemo(() => cities.filter((city) => {
    const matchesQuery = !query || city.searchAliases.some((alias) => normalize(alias).includes(normalize(query)));
    const matchesRegion = region === 'all' || city.regionKey === region;
    const matchesStatus = status === 'all' || (status === 'available' ? city.estimation.publicEnabled : !city.estimation.publicEnabled);
    return matchesQuery && matchesRegion && matchesStatus;
  }), [cities, query, region, status]);

  return <>
    <div className="grid gap-4 rounded-card border border-border-subtle bg-surface p-4 shadow-card md:grid-cols-3">
      <label className="relative"><span className="mb-2 block text-xs font-semibold text-text-secondary">{copy.searchLabel}</span><Search className="absolute bottom-3.5 start-3.5 h-4 w-4 text-text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} className="h-12 w-full rounded-control border border-border-medium bg-background ps-10 pe-4 text-sm outline-none focus:border-brand-blue focus:shadow-focus" /></label>
      <label><span className="mb-2 block text-xs font-semibold text-text-secondary">{copy.regionLabel}</span><select value={region} onChange={(event) => setRegion(event.target.value)} className="h-12 w-full rounded-control border border-border-medium bg-background px-4 text-sm outline-none focus:border-brand-blue"><option value="all">{copy.allRegions}</option>{regions.map((key) => { const city = cities.find((item) => item.regionKey === key)!; return <option key={key} value={key}>{locale === 'ar' ? city.regionAr : city.regionFr}</option>; })}</select></label>
      <label><span className="mb-2 block text-xs font-semibold text-text-secondary">{copy.statusLabel}</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-control border border-border-medium bg-background px-4 text-sm outline-none focus:border-brand-blue"><option value="all">{copy.allStatuses}</option><option value="available">{copy.availableOnly}</option><option value="coming">{copy.comingSoonOnly}</option></select></label>
    </div>
    {results.length ? <div className="mt-8"><CityCardGrid cities={results} locale={locale} copy={copy} /></div> : <div className="mt-8"><StatePanel title={copy.empty} /></div>}
  </>;
}
