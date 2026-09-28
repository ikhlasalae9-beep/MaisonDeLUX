'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, BarChart3, Building2, FileBadge2, Home, LayoutDashboard, LogOut, Menu, Plus, Scale, Settings, UserRound, X } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';

type Identity={displayName:string;email:string};

export function AccountShell({children,locale,identity}:{children:React.ReactNode;locale:string;identity:Identity}){
  const pathname=usePathname()||`/${locale}/account`,ar=locale==='ar';
  const [mobileOpen,setMobileOpen]=useState(false),[userOpen,setUserOpen]=useState(false),[loggingOut,setLoggingOut]=useState(false);
  const userMenu=useRef<HTMLDivElement>(null),BackIcon=ar?ArrowRight:ArrowLeft;
  const items=[
    ['',ar?'نظرة عامة':'Vue d’ensemble',LayoutDashboard],
    ['estimations',ar?'تقديراتي':'Mes estimations',BarChart3],
    ['properties',ar?'عقاراتي':'Mes biens',Building2],
    ['passports',ar?'جوازاتي':'Mes Passeports',FileBadge2],
    ['compare',ar?'المقارنة':'Comparaison',Scale],
  ] as const;
  const active=(path:string)=>path?pathname===`/${locale}/account/${path}`||pathname.startsWith(`/${locale}/account/${path}/`):pathname===`/${locale}/account`;
  const linkClass=(path:string)=>`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active(path)?'bg-brand-blue/10 text-brand-blue':'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}`;
  useEffect(()=>{setMobileOpen(false);setUserOpen(false);},[pathname]);
  useEffect(()=>{if(!userOpen)return;const close=(event:MouseEvent)=>{if(!userMenu.current?.contains(event.target as Node))setUserOpen(false);};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[userOpen]);
  useEffect(()=>{if(!mobileOpen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobileOpen(false);};document.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close);};},[mobileOpen]);
  async function logout(){setLoggingOut(true);try{const response=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale})});if(response.ok)window.location.assign(`/${locale}`);}finally{setLoggingOut(false);}}
  const initials=identity.displayName.trim().slice(0,1)||identity.email.slice(0,1)||'M';
  const navigation=<>
    <Link href={`/${locale}/cities/casablanca/estimate`} className="mb-3 flex min-h-12 items-center gap-3 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-blue/90"><Plus className="h-4 w-4"/>{ar?'تقدير جديد':'Nouvelle estimation'}</Link>
    {items.map(([path,label,Icon])=><Link key={path} href={`/${locale}/account${path?`/${path}`:''}`} aria-current={active(path)?'page':undefined} className={linkClass(path)}><Icon className="h-4 w-4"/>{label}</Link>)}
    <div className="my-3 border-t border-border-subtle"/>
    <Link href={`/${locale}/account/profile`} aria-current={active('profile')?'page':undefined} className={linkClass('profile')}><Settings className="h-4 w-4"/>{ar?'الملف والإعدادات':'Profil et réglages'}</Link>
  </>;
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[90rem] items-center justify-between gap-3 px-3 sm:min-h-[4.5rem] sm:px-6 lg:px-8">
        <BrandLogo locale={locale} size="compact"/>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 md:flex"><LanguageSwitcher currentLocale={locale} showIcon={false}/><Link href={`/${locale}`} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-text-secondary hover:bg-surface-subtle hover:text-text-primary"><BackIcon className="h-4 w-4"/>{ar?'العودة إلى الدار البيضاء':'Retour à Casablanca'}</Link></div>
          <ThemeToggle/>
          <div className="relative hidden md:block" ref={userMenu}>
            <button type="button" onClick={()=>setUserOpen(value=>!value)} aria-expanded={userOpen} aria-haspopup="menu" aria-label={ar?'قائمة الحساب':'Menu du compte'} className="flex h-11 items-center gap-2 rounded-full border border-border-medium px-2 pe-3 text-sm font-semibold text-text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-xs font-bold uppercase text-white">{initials}</span><span className="max-w-28 truncate">{identity.displayName||(ar?'حسابي':'Mon compte')}</span></button>
            {userOpen?<div role="menu" className="absolute end-0 mt-2 w-72 rounded-card border border-border-subtle bg-surface p-2 shadow-elevated"><div className="border-b border-border-subtle px-3 py-3"><p className="truncate text-sm font-bold text-text-primary">{identity.displayName||(ar?'فضائي MaisonDeLUX':'Mon espace MaisonDeLUX')}</p><p className="mt-1 truncate text-xs text-text-muted" dir="ltr">{identity.email}</p></div><Link role="menuitem" href={`/${locale}/account`} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-surface-subtle"><Home className="h-4 w-4"/>{ar?'فضائي':'Mon espace'}</Link><Link role="menuitem" href={`/${locale}/account/profile`} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-surface-subtle"><UserRound className="h-4 w-4"/>{ar?'الملف والإعدادات':'Profil et réglages'}</Link><button role="menuitem" disabled={loggingOut} onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-start text-sm text-status-danger hover:bg-surface-subtle disabled:opacity-50"><LogOut className="h-4 w-4"/>{ar?'تسجيل الخروج':'Se déconnecter'}</button></div>:null}
          </div>
          <button type="button" onClick={()=>setMobileOpen(value=>!value)} aria-expanded={mobileOpen} aria-controls="account-mobile-menu" aria-label={ar?'قائمة الحساب':'Menu du compte'} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-medium text-text-primary md:hidden">{mobileOpen?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}</button>
        </div>
      </div>
    </header>
    {mobileOpen?<div id="account-mobile-menu" role="dialog" aria-modal="true" aria-label={ar?'التنقل في الحساب':'Navigation du compte'} className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto border-t border-border-subtle bg-background p-4 md:hidden"><div className="mx-auto max-w-md"><div className="mb-4 rounded-card border border-border-subtle bg-surface p-4"><p className="font-bold">{identity.displayName||(ar?'فضائي MaisonDeLUX':'Mon espace MaisonDeLUX')}</p><p className="mt-1 truncate text-xs text-text-muted" dir="ltr">{identity.email}</p></div><nav className="space-y-1">{navigation}</nav><div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4"><LanguageSwitcher currentLocale={locale} showIcon={false}/><Link href={`/${locale}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary"><BackIcon className="h-4 w-4"/>{ar?'العودة إلى الموقع':'Retour au site'}</Link></div><button disabled={loggingOut} onClick={logout} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-status-danger"><LogOut className="h-4 w-4"/>{ar?'تسجيل الخروج':'Se déconnecter'}</button></div></div>:null}
    <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:px-8 lg:py-10">
      <aside className="hidden lg:block"><div className="sticky top-28"><p className="mb-4 px-3 text-xs font-bold uppercase tracking-[.16em] text-text-muted">{ar?'فضائي العقاري':'Espace immobilier'}</p><nav className="space-y-1">{navigation}</nav></div></aside>
      <section aria-label={ar?'محتوى الحساب':'Contenu du compte'} className="min-w-0">{children}</section>
    </div>
  </div>;
}
