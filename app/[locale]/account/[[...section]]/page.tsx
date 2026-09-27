import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/server';
import { AccountWorkspace } from '@/components/account/AccountWorkspace';
import { SavedPassport } from '@/components/account/SavedPassport';
export default async function AccountPage({params}:{params:{locale:string;section?:string[]}}){
  const section=params.section||[];
  await requireUser(params.locale,`/${params.locale}/account${section.length?'/'+section.join('/'):''}`);
  if(section[0]==='estimations'&&section.length===2&&/^[1-9][0-9]{0,17}$/.test(section[1]))return <SavedPassport locale={params.locale} id={section[1]}/>;
  if(section.length>1||!['','estimations','properties','passports','compare','profile'].includes(section[0]||''))notFound();
  return <AccountWorkspace locale={params.locale} section={section[0]||''}/>;
}
