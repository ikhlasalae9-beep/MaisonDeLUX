import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
export const metadata = { robots: { index: false, follow: false } };
export default function AuthPage({ params }: { params: { locale: string; action: string } }) {
  if (!['fr', 'ar'].includes(params.locale) || !['login', 'signup', 'forgot-password', 'reset-password'].includes(params.action)) notFound();
  return <div className="px-4 py-16 sm:py-24"><Suspense><AuthForm locale={params.locale} mode={params.action} /></Suspense></div>;
}
