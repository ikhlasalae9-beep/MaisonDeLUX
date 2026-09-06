import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Administration — MaisonDeLUX' };
export default function AdminLoginPage() {
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 dark:bg-brand-navy-deep">
    <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(29,78,216,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
    <section className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-2xl shadow-slate-900/10 sm:p-10 dark:border-white/10 dark:bg-brand-navy-surface">
      <Image src="/brand/logo/maisondelux-logo-horizontal.png" alt="MaisonDeLUX" width={230} height={55} className="mb-9 h-auto dark:brightness-0 dark:invert" priority />
      <div className="mb-8"><div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue"><ShieldCheck className="h-5 w-5" /></div>
        <h1 className="text-2xl font-black tracking-tight text-brand-navy dark:text-white">Administration MaisonDeLUX</h1>
        <p className="mt-2 text-sm text-slate-500">Accès réservé à l’administration</p></div>
      <LoginForm />
      <p className="mt-8 text-center text-[11px] text-slate-400">Espace sécurisé · Session privée de 8 heures</p>
    </section>
  </main>;
}
