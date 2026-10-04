import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminSessionToken } from '@/lib/auth/adminSession';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('akshaya_admin_session');
  const hasAdminSession = await verifyAdminSessionToken(adminCookie?.value);

  if (!user && !hasAdminSession) {
    redirect('/login');
  }

  const email = user?.email || cookieStore.get('akshaya_admin_email')?.value || 'admin@akshayajewellers.com';

  return (
    <DashboardShell userEmail={email}>
      {children}
    </DashboardShell>
  );
}
