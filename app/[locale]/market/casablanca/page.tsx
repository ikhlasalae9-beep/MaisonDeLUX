import { notFound, permanentRedirect } from 'next/navigation';
import { LOCALES } from '@/lib/i18n/config';

export default function LegacyCasablancaMarket({ params }: { params: { locale: string } }) {
  if (!LOCALES.includes(params.locale as any)) notFound();
  permanentRedirect(`/${params.locale}/cities/casablanca/market`);
}
