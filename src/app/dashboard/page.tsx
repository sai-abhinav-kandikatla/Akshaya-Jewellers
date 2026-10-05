export const dynamic = 'force-dynamic';

import { getDashboardStats, getRecentCoupons } from '@/app/actions/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const [stats, recentCoupons] = await Promise.all([
    getDashboardStats(),
    getRecentCoupons(5)
  ]);

  return (
    <DashboardClient 
      initialStats={stats} 
      recentCoupons={recentCoupons}
    />
  );
}
