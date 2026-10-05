import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { isAdminAuthenticated } from '@/lib/auth/requireAdmin';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasAdminSession = await isAdminAuthenticated();

  if (!hasAdminSession) {
    redirect('/login');
  }

  const email = cookieStore.get('akshaya_admin_email')?.value || 'Admin account';

  return (
    <DashboardShell userEmail={email}>
      {children}
    </DashboardShell>
  );
}
