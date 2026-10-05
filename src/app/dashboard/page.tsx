export const dynamic = 'force-dynamic';

import { getDashboardStats, getRecentCoupons } from '@/app/actions/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const [stats, recentCoupons] = await Promise.all([
    getDashboardStats(),
    getRecentCoupons(5)
  ]);

  return (
    <div className="dashboard-page">
      <div className="page-header dashboard-page-heading mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <DashboardClient 
        initialStats={stats} 
        recentCoupons={recentCoupons}
      />
    </div>
  );
}
