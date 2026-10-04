export const dynamic = 'force-dynamic';

import { getDashboardStats, getRecentCoupons } from '@/app/actions/dashboard';
import { getCampaigns } from '@/app/actions/campaigns';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const [stats, recentCoupons, campaigns] = await Promise.all([
    getDashboardStats(),
    getRecentCoupons(),
    getCampaigns()
  ]);

  return (
    <div className="p-4 md:p-8">
      <div className="page-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <DashboardClient 
        initialStats={stats} 
        recentCoupons={recentCoupons} 
        campaigns={campaigns} 
      />
    </div>
  );
}
