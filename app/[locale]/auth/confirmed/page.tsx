import Link from 'next/link';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { notFound } from 'next/navigation';
import { safeDestination } from '@/lib/auth/config';
import { CardSurface } from '@/components/city/CityFoundation';
import { PostAuthRedirect } from '@/components/auth/PostAuthRedirect';

export const metadata={robots:{index:false,follow:false}};

export default function ConfirmationResult({params,searchParams}:{params:{locale:string};searchParams:{status?:string;flow?:string;next?:string}}){
  if(!['fr','ar'].includes(params.locale))notFound();
  const ar=params.locale==='ar', success=searchParams.status==='success';
  const flow=['recovery','email_change'].includes(searchParams.flow||'')?searchParams.flow:'email';
  const next=flow==='recovery'?`/${params.locale}/auth/reset-password`:flow==='email_change'?`/${params.locale}/account/profile`:safeDestination(searchParams.next,params.locale);
  const title=success
    ? flow==='recovery'?(ar?'تم التحقق من رابط الاستعادة':'Lien de récupération vérifié')
      :flow==='email_change'?(ar?'تم تأكيد عنوانك الجديد':'Votre nouvelle adresse est confirmée')
      :(ar?'تم تأكيد بريدك الإلكتروني':'Votre adresse e-mail est confirmée')
    :(ar?'تعذر تأكيد الرابط':'Ce lien ne peut pas être confirmé');
  const body=success
    ? flow==='recovery'?(ar?'يمكنك الآن اختيار كلمة مرور جديدة وآمنة.':'Vous pouvez maintenant choisir un nouveau mot de passe sécurisé.')
      :flow==='email_change'?(ar?'تم تحديث هوية تسجيل الدخول بأمان.':'Votre identité de connexion a été mise à jour en toute sécurité.')
      :(ar?'أصبح فضاؤك العقاري مفعّلاً، ويمكنك متابعة مسارك من حيث توقفت.':'Votre espace immobilier est activé. Vous pouvez reprendre votre parcours là où vous l’avez laissé.')
    :(ar?'قد يكون الرابط منتهي الصلاحية أو سبق استخدامه. اطلب رسالة جديدة من صفحة تسجيل الدخول.':'Le lien est peut-être expiré ou déjà utilisé. Demandez un nouvel e-mail depuis la page de connexion.');
  return <div className="px-4 py-16 sm:py-24"><CardSurface className="mx-auto max-w-xl p-6 text-center sm:p-10">
    {success&&flow==='email'?<PostAuthRedirect destination={next}/>:null}
    <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${success?'bg-status-success/10 text-status-success':'bg-status-danger/10 text-status-danger'}`}>{success?<CheckCircle2 className="h-6 w-6"/>:<CircleAlert className="h-6 w-6"/>}</span>
    <h1 className="mt-6 text-2xl font-black text-text-primary sm:text-3xl">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">{body}</p>
    {success?<Link href={next} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-control bg-brand-blue px-6 text-sm font-bold text-white">{flow==='recovery'?(ar?'اختيار كلمة مرور جديدة':'Choisir un nouveau mot de passe'):(ar?'متابعة إلى فضائي':'Continuer vers mon espace')}</Link>:<div className="mt-7 flex flex-wrap justify-center gap-4"><Link href={`/${params.locale}/auth/login`} className="inline-flex min-h-11 items-center font-bold text-brand-blue">{ar?'تسجيل الدخول':'Se connecter'}</Link><Link href={`/${params.locale}/auth/signup`} className="inline-flex min-h-11 items-center font-bold text-brand-blue">{ar?'إنشاء فضاء جديد':'Créer mon espace'}</Link></div>}
  </CardSurface></div>;
}
