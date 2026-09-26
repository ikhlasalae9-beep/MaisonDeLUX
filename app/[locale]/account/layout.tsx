import { requireUser } from '@/lib/auth/server';
import { claimGuest } from '@/lib/security/service';
import { AccountShell } from '@/components/account/AccountShell';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default async function AccountLayout({children,params}:{children:React.ReactNode;params:{locale:string}}){
  const user=await requireUser(params.locale);await claimGuest(user.id);
  return <AccountShell locale={params.locale}>{children}</AccountShell>;
}
