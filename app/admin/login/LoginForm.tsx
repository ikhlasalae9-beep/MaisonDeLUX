'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      if (!response.ok) { const body = await response.json(); setError(body.error || 'Connexion impossible.'); return; }
      router.replace('/admin'); router.refresh();
    } catch { setError('Connexion momentanément indisponible.'); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <div><label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Adresse e-mail</label>
      <div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id="email" name="email" type="email" autoComplete="username" required className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 dark:border-slate-700 dark:bg-slate-900" /></div></div>
    <div><label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe</label>
      <div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 dark:border-slate-700 dark:bg-slate-900" /></div></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-blue disabled:opacity-60">
      {loading ? 'Connexion…' : 'Se connecter'} {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  </form>;
}
