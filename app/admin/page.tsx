import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/require';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tableau de bord — MaisonDeLUX' };
export default async function AdminPage() {
  try { await requireAdmin(); } catch { redirect('/admin/login'); }
  return <AdminDashboard />;
}
