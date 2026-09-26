import Link from 'next/link';
import { requireUser } from '@/lib/auth/server';
import { claimGuest } from '@/lib/security/service';
import { PageContainer } from '@/components/city/CityFoundation';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function AccountLayout({children,params}:{children:React.ReactNode;params:{locale:string}}){
  const user=await requireUser(params.locale);await claimGuest(user.id);
  const ar=params.locale==='ar';
  return <PageContainer className="py-12 sm:py-20"><h1 className="text-3xl font-bold">{ar?'فضائي MaisonDeLUX':'Mon espace MaisonDeLUX'}</h1><nav aria-label={ar?'فضاء الحساب':'Espace personnel'} className="my-6 flex flex-wrap gap-2">{[['',ar?'نظرة عامة':'Vue d’ensemble'],['estimations',ar?'تقديراتي':'Mes estimations'],['properties',ar?'عقاراتي':'Mes biens'],['compare',ar?'المقارنة':'Comparaison'],['security',ar?'الأمان':'Sécurité']].map(([path,label])=><Link className="inline-flex min-h-11 items-center rounded-control border border-border-medium px-4 text-sm" key={path} href={`/${params.locale}/account${path?'/'+path:''}`}>{label}</Link>)}</nav>{children}</PageContainer>;
}
